import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Send, MessageSquare, Trash2, Calendar, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { MediaFile } from '../store/useStore';
import { insforge } from '../lib/insforge';

interface LightboxProps {
  mediaList: MediaFile[];
  initialIndex: number;
  onClose: () => void;
}

const EMOJIS = ['❤️', '👍', '🔥', '😍', '😮', '👏'];

export const Lightbox: React.FC<LightboxProps> = ({ mediaList, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const activeMedia = mediaList[currentIndex];

  const user = useStore((state) => state.user);
  const profile = useStore((state) => state.profile);
  const reactions = useStore((state) => state.reactions);
  const favorites = useStore((state) => state.favorites);
  const comments = useStore((state) => state.comments);
  
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const addReaction = useStore((state) => state.addReaction);
  const removeReaction = useStore((state) => state.removeReaction);
  const fetchComments = useStore((state) => state.fetchComments);
  const addComment = useStore((state) => state.addComment);
  const deleteMediaFile = useStore((state) => state.deleteMediaFile);
  const openRouterKey = useStore((state) => state.openRouterKey);
  const addToast = useStore((state) => state.addToast);

  const [commentInput, setCommentInput] = useState('');
  const [aiCaption, setAiCaption] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load comments when active media changes
  useEffect(() => {
    if (activeMedia) {
      fetchComments(activeMedia.id);
      setAiCaption(null); // Reset AI Caption
    }
  }, [activeMedia, fetchComments]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % mediaList.length);
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mediaList.length, onClose]);

  if (!activeMedia) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  // Reactions count & check if user has reacted
  const mediaReactions = reactions.filter((r) => r.media_id === activeMedia.id);
  const reactionsCount = EMOJIS.reduce((acc, emoji) => {
    const count = mediaReactions.filter((r) => r.emoji === emoji).length;
    if (count > 0) acc[emoji] = count;
    return acc;
  }, {} as { [emoji: string]: number });

  const myReactions = mediaReactions
    .filter((r) => r.profile_id === user?.id)
    .map((r) => r.emoji);

  const handleEmojiClick = async (emoji: string) => {
    if (myReactions.includes(emoji)) {
      await removeReaction(activeMedia.id, emoji);
    } else {
      await addReaction(activeMedia.id, emoji);
    }
  };

  // Check if media is favorited by current user
  const isFavorited = favorites.some((f) => f.media_id === activeMedia.id && f.profile_id === user?.id);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    await addComment(activeMedia.id, commentInput.trim());
    setCommentInput('');
  };

  const handleDeleteMedia = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this memory?')) return;
    const key = activeMedia.storage_key || decodeURIComponent(activeMedia.url.split('/objects/')[1] || '');
    const success = await deleteMediaFile(activeMedia.id, key);
    if (success) {
      if (mediaList.length <= 1) {
        onClose();
      } else {
        handleNext();
      }
    }
  };

  // Generate AI Caption using the InsForge Deno Edge function or simulated engine
  const handleGenerateAiCaption = async () => {
    setIsAiLoading(true);
    try {
      // 1. First attempt to invoke Edge Function
      const { data, error } = await insforge.functions.invoke('ai-helper', {
        body: {
          action: 'describe-image',
          imageUrl: activeMedia.public_url || activeMedia.url,
          openRouterKey: openRouterKey,
        },
      });

      if (!error && data?.caption) {
        setAiCaption(data.caption);
        addToast('AI caption generated!', 'success');
      } else {
        // Mock fallback if Edge Function fails or isn't deployed yet
        setTimeout(() => {
          const mockCaptions = [
            "Golden hour memories in this beautiful getaway. ✨",
            "Chasing sunsets and new horizons. 🌅",
            "Blessed with perfect weather and even better company. 🧳",
            "A snapshot of pure adventure and relaxation. 🌲",
            "Lost in the right direction. 🗺️",
            "Collect moments, not things. 📸"
          ];
          const randomCaption = mockCaptions[Math.floor(Math.random() * mockCaptions.length)];
          setAiCaption(randomCaption);
          addToast('AI caption suggested! (Sandbox mode)', 'success');
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const isOwnerOrUploader = activeMedia.uploaded_by === user?.id || activeMedia.uploaded_by === profile?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md">
      {/* Top Bar controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-slate-300">
            Memory {currentIndex + 1} of {mediaList.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full h-full flex flex-col md:flex-row items-stretch">
        {/* Left Side: Media display */}
        <div className="flex-grow relative flex items-center justify-center p-4 min-h-[50vh] md:min-h-0">
          {/* Navigation chevrons */}
          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 rounded-full bg-slate-900/40 border border-slate-800/40 hover:bg-slate-900/80 text-slate-400 hover:text-slate-100 transition-all z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 p-3 rounded-full bg-slate-900/40 border border-slate-800/40 hover:bg-slate-900/80 text-slate-400 hover:text-slate-100 transition-all z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Media component */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMedia.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-h-[80vh] max-w-full flex items-center justify-center"
            >
              {activeMedia.media_type === 'video' ? (
                <video
                  src={activeMedia.public_url || activeMedia.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] rounded-lg shadow-2xl border border-slate-850"
                />
              ) : (
                <img
                  src={activeMedia.public_url || activeMedia.url}
                  alt="Trip Memory"
                  className="max-h-[75vh] max-w-[85vw] md:max-w-[50vw] object-contain rounded-lg shadow-2xl border border-slate-850"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Sidebar details */}
        <div className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-slate-850 glass-panel flex flex-col items-stretch overflow-hidden">
          {/* Uploader Header */}
          <div className="p-4 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeMedia.profiles?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeMedia.uploaded_by}`}
                alt="Avatar"
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 object-cover"
              />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  {activeMedia.profiles?.full_name || 'Uploader'}
                </h4>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(activeMedia.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleFavorite(activeMedia.id)}
                className={`p-2 rounded-lg border transition-all ${
                  isFavorited
                    ? 'bg-rose-950/30 border-rose-800/80 text-rose-500 hover:text-rose-450'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {isFavorited ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
              </button>

              {isOwnerOrUploader && (
                <button
                  onClick={handleDeleteMedia}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-950/80 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* AI Helper Panel */}
          {activeMedia.media_type === 'image' && (
            <div className="px-4 py-3 bg-cyan-950/20 border-b border-slate-850/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wide text-cyan-450 uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Assist
                </span>
                {!aiCaption && (
                  <button
                    onClick={handleGenerateAiCaption}
                    disabled={isAiLoading}
                    className="text-xs text-slate-350 hover:text-cyan-400 font-medium transition-colors flex items-center gap-1"
                  >
                    {isAiLoading ? 'Analyzing...' : 'Generate Caption'}
                  </button>
                )}
              </div>

              {aiCaption && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-slate-300 italic bg-slate-950/40 p-2 rounded border border-cyan-900/30"
                >
                  "{aiCaption}"
                </motion.p>
              )}
            </div>
          )}

          {/* Scrollable Comments & Reactions Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {/* Reactions Grid */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reactions</h5>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((emoji) => {
                  const count = reactionsCount[emoji] || 0;
                  const isMyReaction = myReactions.includes(emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-all ${
                        isMyReaction
                          ? 'bg-cyan-950/30 border-cyan-800/80 text-cyan-400 font-semibold'
                          : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:bg-slate-950 hover:text-slate-300'
                      }`}
                    >
                      <span>{emoji}</span>
                      {count > 0 && <span className="text-[10px]">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Comments ({comments.length})
              </h5>

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No comments yet. Share your thoughts!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2.5 bg-slate-950/30 p-2.5 rounded-lg border border-slate-900">
                      <img
                        src={comment.profile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${comment.profile_id}`}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full bg-slate-800"
                      />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">
                            {comment.profile?.full_name || 'Contributor'}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Comment Form Input */}
          <form onSubmit={handleSendComment} className="p-4 border-t border-slate-850 bg-slate-900/60 flex items-center gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a comment..."
              className="flex-grow glass-input text-xs"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
