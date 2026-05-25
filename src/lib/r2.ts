import { insforge } from './insforge';

const VITE_R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || '';

export interface PresignedUrlResponse {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
}

/**
 * Generate a signed upload URL by invoking the InsForge edge function
 */
export async function getSignedUploadUrl(
  vaultId: string,
  filename: string,
  contentType: string,
  isThumbnail: boolean = false
): Promise<PresignedUrlResponse> {
  const { data, error } = await insforge.functions.invoke('generate-upload-url', {
    body: {
      action: 'generate',
      vaultId,
      filename,
      contentType,
      isThumbnail,
    },
  });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to generate signed upload URL');
  }

  return data;
}

/**
 * Delete an object from Cloudflare R2 by invoking the edge function
 */
export async function deleteR2Object(storageKey: string): Promise<void> {
  const { error } = await insforge.functions.invoke('generate-upload-url', {
    body: {
      action: 'delete',
      storageKey,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to delete object from R2');
  }
}

/**
 * Helper to construct a public URL if we only have the storage key
 */
export function getPublicUrl(storageKey: string): string {
  if (!storageKey) return '';
  // If it is already a full URL, return it
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  const base = VITE_R2_PUBLIC_URL.replace(/\/$/, '');
  return `${base}/${storageKey}`;
}

/**
 * Helper to upload a file directly to R2 using the presigned URL
 */
export async function uploadToR2(
  uploadUrl: string,
  file: Blob | File,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress(percentage);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve();
      } else {
        reject(new Error(`R2 Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during R2 upload'));
    };

    xhr.send(file);
  });
}
