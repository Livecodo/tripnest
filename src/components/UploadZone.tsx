import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, FileVideo, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useStore } from '../store/useStore';
import { getSignedUploadUrl, uploadToR2 } from '../lib/r2';

interface UploadZoneProps {
  vaultId: string;
  onUploadComplete?: () => void;
}

interface UploadJob {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ vaultId, onUploadComplete }) => {
  const uploadMediaFile = useStore((state) => state.uploadMediaFile);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCountRef = useRef(0);
  const queueRef = useRef<UploadJob[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return 'Unsupported file type. Only images and videos are allowed.';
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      return 'Image is too large. Maximum size allowed is 10MB.';
    }

    if (isVideo && file.size > 100 * 1024 * 1024) {
      return 'Video is too large. Maximum size allowed is 100MB.';
    }

    return null;
  };

  const processFiles = (files: FileList) => {
    const newJobs: UploadJob[] = Array.from(files).map((file) => {
      const validationError = validateFile(file);
      return {
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: validationError ? 'failed' as const : 'pending' as const,
        error: validationError || undefined,
      };
    });

    setUploadQueue((prev) => [...prev, ...newJobs]);
    const validJobs = newJobs.filter((j) => j.status === 'pending');
    queueRef.current = [...queueRef.current, ...validJobs];
    
    // Trigger queue processing
    processQueue();
  };

  const processQueue = async () => {
    if (activeCountRef.current >= 3) return;

    const nextJob = queueRef.current.find((j) => j.status === 'pending');
    if (!nextJob) return;

    activeCountRef.current += 1;
    nextJob.status = 'uploading';
    
    setUploadQueue((prev) =>
      prev.map((j) => (j.id === nextJob.id ? { ...j, status: 'uploading', progress: 5 } : j))
    );

    try {
      await performUpload(nextJob);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Job failed:', nextJob.file.name, err);
      nextJob.status = 'failed';
      setUploadQueue((prev) =>
        prev.map((j) => (j.id === nextJob.id ? { ...j, status: 'failed', error: errorMessage } : j))
      );
    } finally {
      activeCountRef.current -= 1;
      // Remove completed/failed from processing queueRef
      queueRef.current = queueRef.current.filter((j) => j.id !== nextJob.id);
      
      // Fetch next job
      processQueue();

      if (onUploadComplete && queueRef.current.length === 0 && activeCountRef.current === 0) {
        onUploadComplete();
      }
    }
  };

  const performUpload = async (job: UploadJob) => {
    const { file } = job;
    const isImage = file.type.startsWith('image/');
    console.log(`[UploadZone] Starting upload job for file: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${file.type}`);
    
    if (isImage) {
      // 1. Image Compression (Convert to WebP)
      console.log('[UploadZone] Compressing full image...');
      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, progress: 10, error: 'Compressing...' } : j))
      );
      
      const compressionOptions = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp' as const
      };
      
      const compressedBlob = await imageCompression(file, compressionOptions);
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const webpFile = new File([compressedBlob], `${cleanName}.webp`, { type: 'image/webp' });
      console.log(`[UploadZone] Full image compressed to ${(webpFile.size / 1024).toFixed(1)}KB`);

      // 2. Generate 300px Thumbnail
      console.log('[UploadZone] Generating thumbnail...');
      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, progress: 20, error: 'Generating thumbnail...' } : j))
      );

      const thumbnailOptions = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 300,
        useWebWorker: true,
        fileType: 'image/webp' as const
      };
      const thumbnailBlob = await imageCompression(file, thumbnailOptions);
      const thumbnailFile = new File([thumbnailBlob], `thumb_${cleanName}.webp`, { type: 'image/webp' });
      console.log(`[UploadZone] Thumbnail generated: ${(thumbnailFile.size / 1024).toFixed(1)}KB`);

      // 3. Request Signed URLs from Edge Function (Sequential to track progress precisely)
      console.log('[UploadZone] Requesting signed URL for full resolution image...');
      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, progress: 25, error: 'Requesting link (1/2)...' } : j))
      );
      const fullResSign = await getSignedUploadUrl(vaultId, webpFile.name, webpFile.type, false);
      console.log('[UploadZone] Full-res signed URL received:', fullResSign.storageKey);

      console.log('[UploadZone] Requesting signed URL for thumbnail...');
      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, progress: 30, error: 'Requesting link (2/2)...' } : j))
      );
      const thumbnailSign = await getSignedUploadUrl(vaultId, thumbnailFile.name, thumbnailFile.type, true);
      console.log('[UploadZone] Thumbnail signed URL received:', thumbnailSign.storageKey);

      // 4. Upload to Cloudflare R2
      console.log('[UploadZone] Uploading both files to Cloudflare R2...');
      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, progress: 40, error: 'Uploading to storage...' } : j))
      );

      await Promise.all([
        uploadToR2(fullResSign.uploadUrl, webpFile, (pct) => {
          setUploadQueue((prev) =>
            prev.map((j) => {
              if (j.id === job.id) {
                // Map R2 progress (0-100) to overall progress (40-90)
                const overallPct = 40 + Math.round(pct * 0.5);
                return { ...j, progress: overallPct, error: 'Uploading full image...' };
              }
              return j;
            })
          );
        }),
        uploadToR2(thumbnailSign.uploadUrl, thumbnailFile)
      ]);
      console.log('[UploadZone] R2 uploads completed successfully');

      // 5. Save reference to Postgres media table
      console.log('[UploadZone] Saving media metadata to database...');
      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, progress: 95, error: 'Saving metadata...' } : j))
      );

      const mediaRecord = await uploadMediaFile(vaultId, {
        url: fullResSign.publicUrl, // Fallback/compatibility
        storage_key: fullResSign.storageKey,
        public_url: fullResSign.publicUrl,
        thumbnail_url: thumbnailSign.publicUrl,
        mime_type: webpFile.type,
        media_type: 'image',
        byte_size: webpFile.size,
        width: 1920,
        height: 1080
      });

      if (!mediaRecord) {
        throw new Error('Failed to record media entry in database');
      }
      console.log('[UploadZone] Metadata saved to database:', mediaRecord.id);

      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'completed', progress: 100, error: undefined } : j))
      );

    } else {
      // Video Upload
      console.log('[UploadZone] Starting video upload...');
      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, progress: 15, error: 'Requesting upload link...' } : j))
      );

      const sign = await getSignedUploadUrl(vaultId, file.name, file.type, false);
      console.log('[UploadZone] Video signed URL received:', sign.storageKey);

      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, progress: 30, error: 'Uploading to R2...' } : j))
      );

      await uploadToR2(sign.uploadUrl, file, (pct) => {
        setUploadQueue((prev) =>
          prev.map((j) => {
            if (j.id === job.id) {
              // Map R2 progress (0-100) to overall progress (30-90)
              const overallPct = 30 + Math.round(pct * 0.6);
              return { ...j, progress: overallPct, error: 'Uploading video...' };
            }
            return j;
          })
        );
      });
      console.log('[UploadZone] Video R2 upload completed successfully');

      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, progress: 95, error: 'Saving metadata...' } : j))
      );

      const mediaRecord = await uploadMediaFile(vaultId, {
        url: sign.publicUrl, // Fallback/compatibility
        storage_key: sign.storageKey,
        public_url: sign.publicUrl,
        thumbnail_url: null, // No thumbnail for video
        mime_type: file.type,
        media_type: 'video',
        byte_size: file.size
      });

      if (!mediaRecord) {
        throw new Error('Failed to record video entry in database');
      }
      console.log('[UploadZone] Video metadata saved to database:', mediaRecord.id);

      setUploadQueue((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'completed', progress: 100, error: undefined } : j))
      );
    }
  };

  const retryJob = (jobId: string) => {
    setUploadQueue((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'pending', progress: 0, error: undefined } : j))
    );
    const job = uploadQueue.find((j) => j.id === jobId);
    if (job) {
      const freshJob = { ...job, status: 'pending' as const, progress: 0, error: undefined };
      queueRef.current.push(freshJob);
      processQueue();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearQueue = () => {
    setUploadQueue([]);
    queueRef.current = [];
  };

  return (
    <div className="w-full space-y-4">
      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        animate={{
          borderColor: isDragActive ? '#06b6d4' : 'rgba(51, 65, 85, 0.8)',
          backgroundColor: isDragActive ? 'rgba(6, 182, 212, 0.05)' : 'rgba(15, 23, 42, 0.2)',
        }}
        transition={{ duration: 0.2 }}
        className="w-full min-h-[220px] rounded-xl border-2 border-dashed glass-panel p-6 flex flex-col items-center justify-center cursor-pointer text-center group hover:border-slate-600 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleChange}
          className="hidden"
        />

        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center mb-4 group-hover:bg-cyan-950/40 group-hover:text-cyan-450 border border-slate-800 transition-colors"
        >
          <Upload className="w-6 h-6 text-slate-400 group-hover:text-cyan-400" />
        </motion.div>

        <h3 className="font-semibold text-lg text-slate-200">
          Drag & drop photos & videos
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md">
          Images up to 10MB (automatically compressed and converted to WebP) & videos up to 100MB are uploaded directly to secure Cloudflare R2 storage.
        </p>

        <button
          type="button"
          className="mt-4 px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all active:scale-95"
        >
          Select from Computer
        </button>
      </motion.div>

      {/* Upload queue status */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full rounded-xl glass-panel p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <span className="text-sm font-semibold text-slate-300">
                Upload Queue ({uploadQueue.filter((q) => q.status === 'completed').length}/{uploadQueue.length})
              </span>
              <button
                onClick={clearQueue}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear Queue
              </button>
            </div>

            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
              {uploadQueue.map((job) => (
                <div key={job.id} className="flex items-center gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                  <div className="flex-shrink-0">
                    {job.file.type.startsWith('video/') ? (
                      <FileVideo className="w-5 h-5 text-violet-400" />
                    ) : (
                      <FileImage className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate text-slate-300 max-w-[70%]">
                        {job.file.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {job.error && job.status === 'uploading' ? (
                          <span className="text-cyan-450 italic">{job.error}</span>
                        ) : (
                          `${(job.file.size / (1024 * 1024)).toFixed(2)} MB`
                        )}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 0.2 }}
                        className={`h-full rounded-full ${
                          job.status === 'failed'
                            ? 'bg-rose-500'
                            : job.status === 'completed'
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-cyan-500 to-violet-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex-shrink-0 min-w-[75px] text-right">
                    {job.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-450">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Done
                      </span>
                    )}
                    {job.status === 'failed' && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400" title={job.error}>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Error
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            retryJob(job.id);
                          }}
                          className="inline-flex items-center gap-0.5 text-[9px] text-cyan-400 hover:text-cyan-300 hover:underline font-bold transition-all"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Retry
                        </button>
                      </div>
                    )}
                    {job.status === 'uploading' && (
                      <span className="text-[11px] font-semibold text-cyan-450 animate-pulse">
                        {job.progress}%
                      </span>
                    )}
                    {job.status === 'pending' && (
                      <span className="text-[11px] font-medium text-slate-500">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
