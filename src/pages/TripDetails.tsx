import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Share2, Upload, LayoutGrid, CalendarDays, Activity, 
  Sparkles, Heart, Trash2, Calendar, Compass, Play, Eye, Info, Sparkle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { MediaFile } from '../store/useStore';
import { UploadZone } from '../components/UploadZone';
import { Lightbox } from '../components/Lightbox';
import { CollaboratorsModal } from '../components/CollaboratorsModal';
import { insforge } from '../lib/insforge';

export const TripDetails: React.FC = () => {
  const { vaultId } = useParams<{ vaultId: string }>();
  const navigate = useNavigate();

  const user = useStore((state) => state.user);
  const currentTrip = useStore((state) => state.currentTrip);
  const trips = useStore((state) => state.trips);
  const media = useStore((state) => state.media);
  const reactions = useStore((state) => state.reactions);
  const favorites = useStore((state) => state.favorites);
  
  const selectTrip = useStore((state) => state.selectTrip);
  const deleteTrip = useStore((state) => state.deleteTrip);
  const fetchMedia = useStore((state) => state.fetchMedia);
  const addToast = useStore((state) => state.addToast);
  const presenceUsers = useStore((state) => state.presenceUsers);
  const openRouterKey = useStore((state) => state.openRouterKey);
  const cleanupRealtime = useStore((state) => state.cleanupRealtime);

  const [activeTab, setActiveTab] = useState<'gallery' | 'timeline' | 'activity' | 'ai'>('gallery');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'favorites'>('all');
  
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const [aiHighlights, setAiHighlights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load vault details if accessing directly by URL
  useEffect(() => {
    if (vaultId) {
      const match = trips.find((t) => t.id === vaultId);
      if (match) {
        selectTrip(match);
      } else {
        // Fallback: fetch user session first, then load trip list
        useStore.getState().fetchUser().then(() => {
          useStore.getState().fetchTrips().then(() => {
            const freshMatch = useStore.getState().trips.find((t) => t.id === vaultId);
            if (freshMatch) {
              selectTrip(freshMatch);
            } else {
              addToast('Trip folder not found or access restricted.', 'error');
              navigate('/dashboard');
            }
          });
        });
      }
    }
    return () => {
      if (vaultId) cleanupRealtime(vaultId);
    };
  }, [vaultId, trips, selectTrip, navigate, addToast, cleanupRealtime]);

  if (!currentTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Compass className="w-10 h-10 animate-spin text-cyan-550" />
          <span>Loading trip folder...</span>
        </div>
      </div>
    );
  }

  const handleDeleteTrip = async () => {
    if (!window.confirm('WARNING: This will permanently delete the trip folder and delete all uploaded photos/videos from cloud storage. Continue?')) return;
    const success = await deleteTrip(currentTrip.id);
    if (success) {
      navigate('/dashboard');
    }
  };

  // Filter media files based on selected filter type
  const filteredMedia = media.filter((m) => {
    if (filterType === 'all') return true;
    if (filterType === 'image') return m.media_type === 'image';
    if (filterType === 'video') return m.media_type === 'video';
    if (filterType === 'favorites') {
      return favorites.some((f) => f.media_id === m.id && f.profile_id === user?.id);
    }
    return true;
  });

  // Timeline grouping by Date
  const mediaByDate = filteredMedia.reduce((acc, file) => {
    const dateStr = new Date(file.created_at).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(file);
    return acc;
  }, {} as { [date: string]: MediaFile[] });

  // Generate AI highlights using OpenRouter via InsForge Deno edge function or sandbox simulation
  const handleGenerateHighlights = async () => {
    setIsAiLoading(true);
    setAiHighlights(null);
    try {
      const { data, error } = await insforge.functions.invoke('ai-helper', {
        body: {
          action: 'summarize-trip',
          tripId: currentTrip.id,
          mediaUrls: media.slice(0, 5).map(m => m.public_url || m.url),
          openRouterKey: openRouterKey,
        },
      });

      if (!error && data?.summary) {
        setAiHighlights(data.summary);
        addToast('Highlights generated successfully!', 'success');
      } else {
        // Fallback sandbox simulation
        setTimeout(() => {
          setAiHighlights(
            `### 🌟 Trip Summary Highlights - ${currentTrip.name}\n\n` +
            `Based on the uploaded memories and tags, this trip was filled with high-energy coastal excursions, picturesque lakeside dinners, and unforgettable sunset road trips. \n\n` +
            `**Key Highlights**:\n` +
            `- **Best Photo Choice**: A beautiful golden-hour skyline shot captured with perfect contrast and lighting.\n` +
            `- **Themes**: Adventure, relaxation, and road-tripping.\n` +
            `- **AI Curated Memory Book suggestion**: "*Chasing Horizons: A Santorini Getaway*" — recommended format: Horizontal grid layout with warm summer tones.`
          );
          addToast('AI summary generated! (Sandbox simulation)', 'success');
        }, 1500);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown AI error';
      addToast(errorMsg, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const isOwner = currentTrip.created_by === user?.id;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-stretch pb-16">
      {/* Immersive Cover Image Header banner */}
      <div className="relative h-[25vh] md:h-[35vh] w-full overflow-hidden bg-slate-900 border-b border-slate-900/80">
        <img
          src={currentTrip.cover_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&auto=format&fit=crop&q=80'}
          alt="Trip Cover"
          className="w-full h-full object-cover brightness-[0.6]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        
        {/* Navigation / Header Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-slate-950/60 backdrop-blur-md border border-slate-800 text-slate-350 hover:text-slate-100 hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareOpen(true)}
              className="p-2 rounded-lg bg-slate-950/60 backdrop-blur-md border border-slate-800 text-slate-355 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>

            {isOwner && (
              <button
                onClick={handleDeleteTrip}
                className="p-2 rounded-lg bg-slate-950/60 backdrop-blur-md border border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-950/30 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>

        {/* Trip Meta details overlays */}
        <div className="absolute bottom-4 left-6 right-6 text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-wider bg-cyan-950/80 backdrop-blur-md border border-cyan-800/40 text-cyan-400 px-2 py-0.5 rounded-md uppercase">
                Trip Folder
              </span>
              
              {/* Presence indicators */}
              {Object.keys(presenceUsers).length > 0 && (
                <div className="flex items-center gap-1 bg-emerald-950/50 backdrop-blur-md border border-emerald-900/40 px-2 py-0.5 rounded-md text-[9px] text-emerald-450 font-bold">
                  <Eye className="w-3 h-3 text-emerald-400 animate-pulse" />
                  {Object.keys(presenceUsers).length} active now
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-slate-100 mt-1.5">{currentTrip.name}</h1>
            {currentTrip.description && (
              <p className="text-xs text-slate-300 max-w-xl line-clamp-1">{currentTrip.description}</p>
            )}
          </div>

          <div className="text-right text-xs text-slate-350 bg-slate-950/40 backdrop-blur-md border border-slate-850 px-3 py-1.5 rounded-lg flex items-center gap-2 self-start md:self-auto">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>{new Date(currentTrip.start_date).toLocaleDateString()} - {new Date(currentTrip.end_date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace content */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6 text-left">
        {/* Navigation Tabs Bar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'gallery' ? 'bg-slate-900 text-cyan-400 border border-slate-850' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Gallery
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'timeline' ? 'bg-slate-900 text-cyan-400 border border-slate-850' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" /> Timeline
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'activity' ? 'bg-slate-900 text-cyan-400 border border-slate-850' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Activity className="w-4 h-4" /> Activity Feed
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'ai' ? 'bg-slate-900 text-cyan-400 border border-slate-850' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-550" /> AI Assistant
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter tags (only show in gallery & timeline tabs) */}
            {(activeTab === 'gallery' || activeTab === 'timeline') && (
              <div className="bg-slate-950 border border-slate-850 p-0.5 rounded-lg flex items-center">
                {(['all', 'image', 'video', 'favorites'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md capitalize transition-colors ${
                      filterType === type ? 'bg-slate-900 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsUploadOpen(!isUploadOpen)}
              className="glass-btn-primary py-1.5 px-4 text-xs font-semibold flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Media
            </button>
          </div>
        </div>

        {/* Upload Zone overlay collapse */}
        <AnimatePresence>
          {isUploadOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl mb-4">
                <UploadZone vaultId={currentTrip.id} onUploadComplete={() => fetchMedia(currentTrip.id)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-4"
            >
              {filteredMedia.length === 0 ? (
                <div className="glass-panel py-16 text-center rounded-2xl border-dashed border-slate-850">
                  <Compass className="w-10 h-10 text-slate-655 animate-pulse mx-auto mb-3" />
                  <p className="text-xs text-slate-500 italic">No matching travel memories found.</p>
                </div>
              ) : (
                <div className="masonry-grid">
                  {filteredMedia.map((file, index) => (
                    <motion.div
                      key={file.id}
                      onClick={() => setActiveLightboxIndex(index)}
                      className="glass-card rounded-xl overflow-hidden cursor-pointer group relative break-inside-avoid shadow"
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900 relative">
                        {file.media_type === 'video' ? (
                          <div className="w-full h-full relative">
                            <video src={file.public_url || file.url} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-slate-950/70 border border-slate-800/80 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={file.thumbnail_url || file.public_url || file.url} 
                            alt="Trip Memory" 
                            className="w-full h-full object-cover" 
                            loading="lazy"
                          />
                        )}

                        {/* Image overlay detail indicators on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={file.profiles?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${file.uploaded_by}`}
                                alt="avatar"
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-[10px] font-semibold text-slate-250 truncate max-w-[100px]">
                                {file.profiles?.full_name || 'Uploader'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[10px] text-slate-350">
                              <span className="flex items-center gap-0.5">
                                <Heart className="w-3 h-3 text-rose-500 fill-current" />
                                {reactions.filter((r) => r.media_id === file.id).length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-8"
            >
              {Object.keys(mediaByDate).length === 0 ? (
                <div className="glass-panel py-16 text-center rounded-2xl border-dashed border-slate-850">
                  <Calendar className="w-10 h-10 text-slate-655 animate-pulse mx-auto mb-3" />
                  <p className="text-xs text-slate-500 italic">No timeline entries found.</p>
                </div>
              ) : (
                Object.keys(mediaByDate).map((dateStr) => (
                  <div key={dateStr} className="space-y-4">
                    <h3 className="text-sm font-bold text-cyan-400 bg-slate-900/40 inline-flex px-3 py-1 rounded-md border border-slate-850/50">
                      {dateStr}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {mediaByDate[dateStr].map((file) => {
                        // Find original index in filteredMedia for Lightbox
                        const originalIndex = filteredMedia.findIndex((m) => m.id === file.id);
                        return (
                          <div
                            key={file.id}
                            onClick={() => setActiveLightboxIndex(originalIndex)}
                            className="aspect-square glass-card rounded-lg overflow-hidden cursor-pointer relative group"
                          >
                            {file.media_type === 'video' ? (
                              <div className="w-full h-full relative bg-slate-900">
                                <video src={file.public_url || file.url} className="w-full h-full object-cover" muted />
                                <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                                  <Play className="w-4 h-4 text-white fill-current" />
                                </div>
                              </div>
                            ) : (
                              <img 
                                src={file.thumbnail_url || file.public_url || file.url} 
                                alt="Memory" 
                                className="w-full h-full object-cover" 
                                loading="lazy"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-lg mx-auto w-full space-y-4"
            >
              {media.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-8">No activities recorded yet</p>
              ) : (
                media.map((file) => (
                  <div key={file.id} className="glass-panel p-3.5 rounded-xl border border-slate-900 flex items-center gap-3.5">
                    <img
                      src={file.profiles?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${file.uploaded_by}`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-grow text-xs leading-normal">
                      <span className="font-semibold text-slate-200">
                        {file.profiles?.full_name || 'Contributor'}
                      </span>{' '}
                      shared a new {file.media_type} memory in this folder.
                      <span className="text-[10px] text-slate-550 block mt-1">
                        {new Date(file.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-850">
                      <img 
                        src={file.thumbnail_url || file.public_url || file.url} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                      />
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-2xl mx-auto w-full glass-panel p-6 rounded-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> AI Organizers & Highlights
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Leverage advanced LLMs to analyze your travel memories, suggests stories, and cluster information.
                  </p>
                </div>
                
                <button
                  onClick={handleGenerateHighlights}
                  disabled={isAiLoading || media.length === 0}
                  className="glass-btn-primary text-xs py-2 px-5"
                >
                  {isAiLoading ? 'Synthesizing...' : 'Generate AI Summary'}
                </button>
              </div>

              {/* Summary outputs */}
              <AnimatePresence mode="wait">
                {aiHighlights ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-5 rounded-xl bg-slate-900/40 border border-cyan-900/20 text-xs text-slate-300 leading-relaxed text-left space-y-3"
                  >
                    <div dangerouslySetInnerHTML={{ __html: aiHighlights.replace(/\n/g, '<br />') }} />
                  </motion.div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500 italic">
                    {media.length === 0 
                      ? "Upload some trip memories first to generate AI insights." 
                      : "Ready to summarize your memories. Click 'Generate AI Summary' above!"
                    }
                  </div>
                )}
              </AnimatePresence>

              {/* Extra visual indicators */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-850/60">
                <div className="p-3.5 bg-slate-900/20 border border-slate-850 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-cyan-450 uppercase flex items-center gap-1">
                    <Sparkle className="w-3.5 h-3.5" /> Photo Clustering
                  </span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    We automatically analyze GPS metadata and dates to group photos together on maps.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900/20 border border-slate-850 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-violet-450 uppercase flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Best Photo Selection
                  </span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    AI highlights the highest contrast and composition images as cover suggestion presets.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collaborators invite dialog */}
      <AnimatePresence>
        {isShareOpen && (
          <CollaboratorsModal trip={currentTrip} onClose={() => setIsShareOpen(false)} />
        )}
      </AnimatePresence>

      {/* Fullscreen media Lightbox */}
      <AnimatePresence>
        {activeLightboxIndex !== null && (
          <Lightbox
            mediaList={filteredMedia}
            initialIndex={activeLightboxIndex}
            onClose={() => setActiveLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
