/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { insforge } from '../lib/insforge';
import { deleteR2Object } from '../lib/r2';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Vault {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  start_date: string;
  end_date: string;
  created_by: string;
  invite_code: string;
  is_archived: boolean;
  created_at: string;
}

export interface VaultMember {
  id: string;
  vault_id: string;
  profile_id: string;
  role: 'owner' | 'admin' | 'contributor' | 'viewer';
  status: 'invited' | 'joined';
  joined_at: string;
  profile?: Profile;
}

export interface MediaFile {
  id: string;
  vault_id: string;
  uploaded_by: string;
  url: string;
  storage_key: string | null;
  public_url: string | null;
  thumbnail_url: string | null;
  mime_type: string | null;
  upload_provider: string | null;
  media_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  created_at: string;
  profiles?: Profile; // Joins uploader profile
}

export interface Reaction {
  id: string;
  media_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  media_id: string;
  profile_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  media_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface AppToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'invite' | 'comment' | 'upload' | 'reaction' | 'join';
  createdAt: string;
  read: boolean;
  link?: string;
}

interface AppState {
  user: any | null;
  profile: Profile | null;
  isAuthLoading: boolean;
  trips: Vault[];
  currentTrip: Vault | null;
  currentTripMembers: VaultMember[];
  media: MediaFile[];
  reactions: Reaction[];
  favorites: Favorite[];
  comments: Comment[];
  toasts: AppToast[];
  notifications: NotificationItem[];
  realtimeConnected: boolean;
  presenceUsers: { [profileId: string]: { name: string; avatarUrl: string; activeAt: number } };
  openRouterKey: string | null;

  // Actions
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  fetchUser: () => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar_url?: string }) => Promise<void>;
  fetchTrips: () => Promise<void>;
  selectTrip: (trip: Vault | null) => Promise<void>;
  createTrip: (tripData: Omit<Vault, 'id' | 'created_by' | 'invite_code' | 'is_archived' | 'created_at'>) => Promise<Vault | null>;
  deleteTrip: (vaultId: string) => Promise<boolean>;
  fetchTripMembers: (vaultId: string) => Promise<void>;
  joinTripByCode: (inviteCode: string) => Promise<Vault | null>;
  fetchMedia: (vaultId: string) => Promise<void>;
  uploadMediaFile: (
    vaultId: string,
    metadata: {
      url: string;
      storage_key: string;
      public_url: string;
      thumbnail_url: string | null;
      mime_type: string;
      media_type: 'image' | 'video';
      byte_size: number;
      width?: number;
      height?: number;
    }
  ) => Promise<MediaFile | null>;
  deleteMediaFile: (mediaId: string, storageKey: string | null) => Promise<boolean>;
  toggleFavorite: (mediaId: string) => Promise<void>;
  addReaction: (mediaId: string, emoji: string) => Promise<void>;
  removeReaction: (mediaId: string, emoji: string) => Promise<void>;
  fetchComments: (mediaId: string) => Promise<void>;
  addComment: (mediaId: string, content: string) => Promise<void>;
  loadNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  setOpenRouterKey: (key: string | null) => void;
  setupRealtime: (vaultId: string) => Promise<void>;
  cleanupRealtime: (vaultId: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  profile: null,
  isAuthLoading: true,
  trips: [],
  currentTrip: null,
  currentTripMembers: [],
  media: [],
  reactions: [],
  favorites: [],
  comments: [],
  toasts: [],
  notifications: [],
  realtimeConnected: false,
  presenceUsers: {},
  openRouterKey: localStorage.getItem('tripnest_openrouter_key'),

  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  fetchUser: async () => {
    set({ isAuthLoading: true });
    try {
      const { data, error } = await insforge.auth.getCurrentUser();
      if (error) throw error;
      
      if (data?.user) {
        // Fetch user profile from database profiles table
        const { data: profileData } = await insforge.database
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        // If profile doesn't exist, create it from auth details
        let finalProfile = profileData;
        if (!finalProfile) {
          const name = data.user.profile?.name || data.user.email.split('@')[0];
          const avatarUrl = data.user.profile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.user.id}`;
          
          const { data: insertedProfile } = await insforge.database
            .from('profiles')
            .insert([{
              id: data.user.id,
              email: data.user.email,
              full_name: name,
              avatar_url: avatarUrl,
            }])
            .select()
            .single();
            
          finalProfile = insertedProfile;
        }

        set({ user: data.user, profile: finalProfile, isAuthLoading: false });
        return data.user;
      }
    } catch (err: any) {
      console.error('Error fetching user:', err.message);
    } finally {
      set({ isAuthLoading: false });
    }
    return null;
  },

  signOut: async () => {
    const { error } = await insforge.auth.signOut();
    if (!error) {
      set({ user: null, profile: null, trips: [], currentTrip: null, media: [], reactions: [], favorites: [] });
      get().addToast('Signed out successfully', 'info');
    } else {
      get().addToast(error.message, 'error');
    }
  },

  updateProfile: async (updates) => {
    const profile = get().profile;
    if (!profile) return;

    // Use setProfile SDK method
    const { error } = await insforge.auth.setProfile({
      name: updates.name || profile.full_name,
      avatar_url: updates.avatar_url || profile.avatar_url,
    });

    if (error) {
      get().addToast(error.message, 'error');
      return;
    }

    // Update in profiles table as well
    const { data: updatedDbProfile } = await insforge.database
      .from('profiles')
      .update({
        full_name: updates.name || profile.full_name,
        avatar_url: updates.avatar_url || profile.avatar_url,
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (updatedDbProfile) {
      set({ profile: updatedDbProfile });
      get().addToast('Profile updated successfully!', 'success');
    }
  },

  fetchTrips: async () => {
    const user = get().user;
    if (!user) return;
    try {
      // 1. Fetch vaults owned by user
      const { data: ownedVaults, error: ownedError } = await insforge.database
        .from('vaults')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_archived', false);

      if (ownedError) throw ownedError;

      // 2. Fetch vaults where user is a member
      const { data: memberRecords, error: memberError } = await insforge.database
        .from('vault_members')
        .select('vault_id')
        .eq('profile_id', user.id);

      if (memberError) throw memberError;
      const memberVaultIds = memberRecords?.map((m: any) => m.vault_id) || [];

      let collaboratedVaults: Vault[] = [];
      if (memberVaultIds.length > 0) {
        const { data: collabs } = await insforge.database
          .from('vaults')
          .select('*')
          .in('id', memberVaultIds)
          .eq('is_archived', false);
        collaboratedVaults = collabs || [];
      }

      // Combine and filter duplicates
      const allVaults = [...(ownedVaults || [])];
      collaboratedVaults.forEach((v) => {
        if (!allVaults.some((existing) => existing.id === v.id)) {
          allVaults.push(v);
        }
      });

      // Sort by creation date descending
      allVaults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      set({ trips: allVaults });
    } catch (err: any) {
      get().addToast(err.message, 'error');
    }
  },

  selectTrip: async (trip) => {
    set({ currentTrip: trip, media: [], reactions: [], favorites: [] });
    if (trip) {
      get().cleanupRealtime(trip.id);
      await Promise.all([
        get().fetchTripMembers(trip.id),
        get().fetchMedia(trip.id),
        get().setupRealtime(trip.id),
      ]);
    }
  },

  createTrip: async (tripData) => {
    const user = get().user;
    if (!user) return null;
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await insforge.database
        .from('vaults')
        .insert([{
          ...tripData,
          created_by: user.id,
          invite_code: inviteCode,
          is_archived: false,
        }])
        .select()
        .single();

      if (error) throw error;

      // Add owner as a member with owner role
      await insforge.database
        .from('vault_members')
        .insert([{
          vault_id: data.id,
          profile_id: user.id,
          role: 'owner',
          status: 'joined',
        }]);

      get().addToast(`Trip "${data.name}" created successfully!`, 'success');
      await get().fetchTrips();
      return data;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      return null;
    }
  },

  deleteTrip: async (vaultId) => {
    try {
      // 1. Fetch all media from this trip
      const { data: mediaFiles } = await insforge.database
        .from('media')
        .select('id, url, storage_key, upload_provider')
        .eq('vault_id', vaultId);

      // 2. Remove media files from storage bucket
      if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          if (file.upload_provider === 'r2' && file.storage_key) {
            try {
              await deleteR2Object(file.storage_key);
            } catch (err) {
              console.error('Failed to delete object from R2:', file.storage_key, err);
            }
          } else {
            // Extract file key from URL (legacy fallback)
            const key = decodeURIComponent(file.url.split('/objects/')[1] || '');
            if (key) {
              await insforge.storage.from('media').remove(key);
            }
          }
        }
      }

      // 3. Delete vault from database (foreign key cascade deletes members, media, reactions)
      const { error } = await insforge.database
        .from('vaults')
        .delete()
        .eq('id', vaultId);

      if (error) throw error;

      get().addToast('Trip deleted successfully and storage cleaned', 'success');
      set({ currentTrip: null });
      await get().fetchTrips();
      return true;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      return false;
    }
  },

  fetchTripMembers: async (vaultId) => {
    try {
      const { data, error } = await insforge.database
        .from('vault_members')
        .select('*, profile:profiles(*)')
        .eq('vault_id', vaultId);

      if (error) throw error;
      set({ currentTripMembers: data || [] });
    } catch (err: any) {
      console.error('Error fetching members:', err.message);
    }
  },

  joinTripByCode: async (inviteCode) => {
    const user = get().user;
    if (!user) return null;
    try {
      // Find vault by code
      const { data: vault, error: fetchError } = await insforge.database
        .from('vaults')
        .select('*')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!vault) {
        get().addToast('Invalid invite code. Please check and try again.', 'error');
        return null;
      }

      // Check if already a member
      const { data: existing } = await insforge.database
        .from('vault_members')
        .select('*')
        .eq('vault_id', vault.id)
        .eq('profile_id', user.id)
        .maybeSingle();

      if (existing) {
        get().addToast('You are already a member of this trip!', 'info');
        return vault;
      }

      // Add user to vault members
      await insforge.database
        .from('vault_members')
        .insert([{
          vault_id: vault.id,
          profile_id: user.id,
          role: 'contributor',
          status: 'joined',
        }]);

      // Publish join notification to WebSocket
      await insforge.realtime.publish(`vault:${vault.id}`, 'member_joined', {
        profileId: user.id,
        fullName: get().profile?.full_name || user.email.split('@')[0],
      });

      get().addToast(`Joined trip "${vault.name}"!`, 'success');
      await get().fetchTrips();
      return vault;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      return null;
    }
  },

  fetchMedia: async (vaultId) => {
    try {
      // Fetch media
      const { data: mediaData, error: mediaError } = await insforge.database
        .from('media')
        .select('*, profiles!media_uploaded_by_fkey(*)')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      // Fetch reactions for this trip's media
      const mediaIds = mediaData?.map((m: any) => m.id) || [];
      let reactionsData: Reaction[] = [];
      let favoritesData: Favorite[] = [];

      if (mediaIds.length > 0) {
        const [reactionsRes, favoritesRes] = await Promise.all([
          insforge.database.from('reactions').select('*').in('media_id', mediaIds),
          insforge.database.from('favorites').select('*').in('media_id', mediaIds),
        ]);
        reactionsData = reactionsRes.data || [];
        favoritesData = favoritesRes.data || [];
      }

      set({ 
        media: mediaData || [], 
        reactions: reactionsData, 
        favorites: favoritesData 
      });
    } catch (err: any) {
      console.error('Error fetching media:', err.message);
    }
  },

  uploadMediaFile: async (vaultId, metadata) => {
    const user = get().user;
    if (!user) return null;
    try {
      // Save reference to Postgres media table
      const { data: mediaRecord, error: dbError } = await insforge.database
        .from('media')
        .insert([{
          vault_id: vaultId,
          uploaded_by: user.id,
          url: metadata.url,
          storage_key: metadata.storage_key,
          public_url: metadata.public_url,
          thumbnail_url: metadata.thumbnail_url,
          mime_type: metadata.mime_type,
          media_type: metadata.media_type,
          byte_size: metadata.byte_size,
          width: metadata.width || 800,
          height: metadata.height || 600,
          upload_provider: 'r2'
        }])
        .select('*, profiles!media_uploaded_by_fkey(*)')
        .single();

      if (dbError) throw dbError;

      // Add to local state list
      set((state) => ({ media: [mediaRecord, ...state.media] }));

      // Broadcast lightweight new upload via WebSockets
      await insforge.realtime.publish(`vault:${vaultId}`, 'media_uploaded', {
        mediaId: mediaRecord.id,
        vaultId: vaultId,
        uploadedBy: user.id
      });

      // Add activity notification
      const newNotification: NotificationItem = {
        id: Math.random().toString(),
        title: 'New Memory Shared!',
        message: `${get().profile?.full_name || 'A user'} uploaded a new memory.`,
        type: 'upload',
        createdAt: new Date().toISOString(),
        read: false,
      };
      set((state) => ({ notifications: [newNotification, ...state.notifications] }));

      return mediaRecord;
    } catch (err: any) {
      get().addToast(`DB save failed: ${err.message}`, 'error');
      return null;
    }
  },

  deleteMediaFile: async (mediaId, storageKey) => {
    try {
      // 1. Delete from R2 bucket
      if (storageKey) {
        await deleteR2Object(storageKey);
      }

      // 2. Delete database entry (cascade deletes favorites/reactions)
      const { error: dbError } = await insforge.database
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      // Update state
      set((state) => ({
        media: state.media.filter((m) => m.id !== mediaId),
        reactions: state.reactions.filter((r) => r.media_id !== mediaId),
        favorites: state.favorites.filter((f) => f.media_id !== mediaId),
      }));

      // Broadcast deletion via WebSocket
      if (get().currentTrip) {
        await insforge.realtime.publish(`vault:${get().currentTrip!.id}`, 'media_deleted', {
          mediaId
        });
      }

      get().addToast('Memory removed successfully', 'success');
      return true;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      return false;
    }
  },

  toggleFavorite: async (mediaId) => {
    const user = get().user;
    if (!user) return;
    try {
      const existing = get().favorites.find(
        (f) => f.media_id === mediaId && f.profile_id === user.id
      );

      if (existing) {
        // Remove favorite
        const { error } = await insforge.database
          .from('favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== existing.id),
        }));
      } else {
        // Add favorite
        const { data, error } = await insforge.database
          .from('favorites')
          .insert([{
            media_id: mediaId,
            profile_id: user.id,
          }])
          .select()
          .single();

        if (error) throw error;
        set((state) => ({
          favorites: [...state.favorites, data],
        }));
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err.message);
    }
  },

  addReaction: async (mediaId, emoji) => {
    const user = get().user;
    if (!user) return;
    try {
      const { data, error } = await insforge.database
        .from('reactions')
        .insert([{
          media_id: mediaId,
          profile_id: user.id,
          emoji,
        }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        reactions: [...state.reactions, data],
      }));

      // Broadcast reaction via WebSocket
      if (get().currentTrip) {
        await insforge.realtime.publish(`vault:${get().currentTrip!.id}`, 'reaction_added', {
          reaction: data,
          reactorName: get().profile?.full_name || user.email.split('@')[0],
        });
      }
    } catch (err: any) {
      console.error('Error adding reaction:', err.message);
    }
  },

  removeReaction: async (mediaId, emoji) => {
    const user = get().user;
    if (!user) return;
    try {
      const reaction = get().reactions.find(
        (r) => r.media_id === mediaId && r.profile_id === user.id && r.emoji === emoji
      );

      if (!reaction) return;

      const { error } = await insforge.database
        .from('reactions')
        .delete()
        .eq('id', reaction.id);

      if (error) throw error;

      set((state) => ({
        reactions: state.reactions.filter((r) => r.id !== reaction.id),
      }));

      // Broadcast reaction removed via WebSocket
      if (get().currentTrip) {
        await insforge.realtime.publish(`vault:${get().currentTrip!.id}`, 'reaction_removed', {
          mediaId,
          profileId: user.id,
          emoji,
        });
      }
    } catch (err: any) {
      console.error('Error removing reaction:', err.message);
    }
  },

  fetchComments: async (mediaId) => {
    try {
      const { data, error } = await insforge.database
        .from('comments')
        .select('*, profile:profiles(*)')
        .eq('media_id', mediaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ comments: data || [] });
    } catch (err: any) {
      console.error('Error fetching comments:', err.message);
    }
  },

  addComment: async (mediaId, content) => {
    const user = get().user;
    if (!user) return;
    try {
      const { data, error } = await insforge.database
        .from('comments')
        .insert([{
          media_id: mediaId,
          profile_id: user.id,
          content,
        }])
        .select('*, profile:profiles(*)')
        .single();

      if (error) throw error;

      set((state) => ({
        comments: [...state.comments, data],
      }));

      // Broadcast comment via WebSocket
      if (get().currentTrip) {
        await insforge.realtime.publish(`vault:${get().currentTrip!.id}`, 'comment_added', {
          comment: data,
          commenterName: get().profile?.full_name || user.email.split('@')[0],
        });
      }
    } catch (err: any) {
      get().addToast(`Failed to add comment: ${err.message}`, 'error');
    }
  },

  loadNotifications: () => {
    const saved = localStorage.getItem('tripnest_notifications');
    if (saved) {
      set({ notifications: JSON.parse(saved) });
    }
  },

  markNotificationAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem('tripnest_notifications', JSON.stringify(updated));
      return { notifications: updated };
    });
  },

  setOpenRouterKey: (key) => {
    if (key) {
      localStorage.setItem('tripnest_openrouter_key', key);
    } else {
      localStorage.removeItem('tripnest_openrouter_key');
    }
    set({ openRouterKey: key });
  },

  setupRealtime: async (vaultId) => {
    try {
      if (!insforge.realtime.isConnected) {
        await insforge.realtime.connect();
      }

      const channel = `vault:${vaultId}`;
      const { ok, error } = await insforge.realtime.subscribe(channel);
      if (!ok) throw error;

      set({ realtimeConnected: true });

      // Hear new uploads (lightweight payload fetches full metadata from database)
      insforge.realtime.on('media_uploaded', async (payload: any) => {
        const { mediaId } = payload;
        
        // Avoid duplicates
        const alreadyExists = get().media.some((m) => m.id === mediaId);
        if (alreadyExists) return;

        // Fetch full record from Postgres
        const { data: mediaRecord } = await insforge.database
          .from('media')
          .select('*, profiles!media_uploaded_by_fkey(*)')
          .eq('id', mediaId)
          .single();

        if (mediaRecord) {
          set((state) => ({ media: [mediaRecord, ...state.media] }));
          
          const uploaderName = mediaRecord.profiles?.full_name || 'A collaborator';
          get().addToast(`${uploaderName} uploaded a new memory!`, 'info');
          
          // Add local notification
          const newNotif: NotificationItem = {
            id: Math.random().toString(),
            title: 'New memory uploaded',
            message: `${uploaderName} uploaded a file in "${get().currentTrip?.name}"`,
            type: 'upload',
            createdAt: new Date().toISOString(),
            read: false,
          };
          set((state) => {
            const list = [newNotif, ...state.notifications];
            localStorage.setItem('tripnest_notifications', JSON.stringify(list));
            return { notifications: list };
          });
        }
      });

      // Hear media deletions
      insforge.realtime.on('media_deleted', (payload: any) => {
        set((state) => ({
          media: state.media.filter((m) => m.id !== payload.mediaId),
          reactions: state.reactions.filter((r) => r.media_id !== payload.mediaId),
          favorites: state.favorites.filter((f) => f.media_id !== payload.mediaId),
        }));
      });

      // Hear new reactions
      insforge.realtime.on('reaction_added', (payload: any) => {
        const alreadyExists = get().reactions.some((r) => r.id === payload.reaction.id);
        if (!alreadyExists) {
          set((state) => ({ reactions: [...state.reactions, payload.reaction] }));
          // Add toast if reacted to our media
          const mediaItem = get().media.find((m) => m.id === payload.reaction.media_id);
          if (mediaItem && mediaItem.uploaded_by === get().user?.id && payload.reaction.profile_id !== get().user?.id) {
            get().addToast(`${payload.reactorName} reacted ${payload.reaction.emoji} to your memory!`, 'info');
          }
        }
      });

      // Hear new comments
      insforge.realtime.on('comment_added', (payload: any) => {
        const alreadyExists = get().comments.some((c) => c.id === payload.comment.id);
        if (!alreadyExists) {
          set((state) => ({ comments: [...state.comments, payload.comment] }));
          
          // Add toast if commented on our media
          const mediaItem = get().media.find((m) => m.id === payload.comment.media_id);
          if (mediaItem && mediaItem.uploaded_by === get().user?.id && payload.comment.profile_id !== get().user?.id) {
            get().addToast(`${payload.commenterName} commented on your memory: "${payload.comment.content.substring(0, 20)}..."`, 'info');
          }
          
          // Add local notification
          const newNotif: NotificationItem = {
            id: Math.random().toString(),
            title: 'New comment added',
            message: `${payload.commenterName} commented on a memory`,
            type: 'comment',
            createdAt: new Date().toISOString(),
            read: false,
          };
          set((state) => {
            const list = [newNotif, ...state.notifications];
            localStorage.setItem('tripnest_notifications', JSON.stringify(list));
            return { notifications: list };
          });
        }
      });

      // Hear reaction removals
      insforge.realtime.on('reaction_removed', (payload: any) => {
        set((state) => ({
          reactions: state.reactions.filter(
            (r) => !(r.media_id === payload.mediaId && r.profile_id === payload.profileId && r.emoji === payload.emoji)
          ),
        }));
      });

      // Hear presence/typing updates
      insforge.realtime.on('presence_ping', (payload: any) => {
        if (payload.profileId === get().user?.id) return;
        set((state) => {
          const presence = { ...state.presenceUsers };
          presence[payload.profileId] = {
            name: payload.name,
            avatarUrl: payload.avatarUrl,
            activeAt: Date.now(),
          };
          return { presenceUsers: presence };
        });
      });

      // Heartbeat presence ping loop
      const pingInterval = setInterval(() => {
        if (insforge.realtime.isConnected && get().profile) {
          insforge.realtime.publish(channel, 'presence_ping', {
            profileId: get().profile!.id,
            name: get().profile!.full_name || 'Uploader',
            avatarUrl: get().profile!.avatar_url || '',
          }).catch(console.error);
        }

        // Clean stale presence users (inactive for > 10 seconds)
        set((state) => {
          const presence = { ...state.presenceUsers };
          const now = Date.now();
          let changed = false;
          Object.keys(presence).forEach((pid) => {
            if (now - presence[pid].activeAt > 10000) {
              delete presence[pid];
              changed = true;
            }
          });
          return changed ? { presenceUsers: presence } : {};
        });
      }, 5000);

      // Save ping interval ID in window/state for cleanup
      (window as any)._tripnestPingInterval = pingInterval;
    } catch (err: any) {
      console.error('WebSocket Realtime Setup Failed:', err.message);
      set({ realtimeConnected: false });
    }
  },

  cleanupRealtime: (vaultId) => {
    try {
      const channel = `vault:${vaultId}`;
      insforge.realtime.unsubscribe(channel);
      
      const interval = (window as any)._tripnestPingInterval;
      if (interval) {
        clearInterval(interval);
      }
      set({ realtimeConnected: false, presenceUsers: {} });
    } catch (e) {
      console.error('Error cleaning up realtime:', e);
    }
  },
}));
