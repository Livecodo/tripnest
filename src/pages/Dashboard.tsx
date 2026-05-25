import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, Calendar, Plus, Bell, LogOut, Settings, 
  Camera, Users, User, KeyRound
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Vault } from '../store/useStore';
import { CreateTripModal } from '../components/CreateTripModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const profile = useStore((state) => state.profile);
  const trips = useStore((state) => state.trips);
  const notifications = useStore((state) => state.notifications);
  const fetchTrips = useStore((state) => state.fetchTrips);
  const selectTrip = useStore((state) => state.selectTrip);
  const signOut = useStore((state) => state.signOut);
  const updateProfile = useStore((state) => state.updateProfile);
  const joinTripByCode = useStore((state) => state.joinTripByCode);
  const loadNotifications = useStore((state) => state.loadNotifications);
  const markNotificationAsRead = useStore((state) => state.markNotificationAsRead);
  const openRouterKey = useStore((state) => state.openRouterKey);
  const setOpenRouterKey = useStore((state) => state.setOpenRouterKey);
  const addToast = useStore((state) => state.addToast);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileAvatarInput, setProfileAvatarInput] = useState('');
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState(openRouterKey || '');

  // Fetch trips and profiles
  useEffect(() => {
    fetchTrips();
    loadNotifications();
  }, [fetchTrips, loadNotifications]);

  useEffect(() => {
    if (profile) {
      setProfileNameInput(profile.full_name || '');
      setProfileAvatarInput(profile.avatar_url || '');
    }
  }, [profile]);

  const handleJoinTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setIsJoining(true);
    try {
      const result = await joinTripByCode(joinCodeInput.trim());
      if (result) {
        setJoinCodeInput('');
        selectTrip(result);
        navigate(`/trips/${result.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsJoining(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: profileNameInput.trim(),
      avatar_url: profileAvatarInput.trim(),
    });
    setIsProfileOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenRouterKey(openRouterKeyInput.trim() || null);
    addToast('OpenRouter API settings saved!', 'success');
    setIsSettingsOpen(false);
  };

  const handleTripClick = async (trip: Vault) => {
    await selectTrip(trip);
    navigate(`/trips/${trip.id}`);
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-stretch pb-12">
      {/* Background flares */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation header */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-slate-900/60 max-w-7xl w-full mx-auto backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            TripNest
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 bg-slate-900/60 hover:bg-slate-900 rounded-full border border-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cyan-500 rounded-full border border-slate-950 flex items-center justify-center text-[7px] font-black text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-[300px] glass-panel rounded-xl p-3 shadow-2xl z-30 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-xs font-semibold text-slate-350">Notifications</span>
                    {unreadNotifications.length > 0 && (
                      <span className="text-[10px] text-cyan-450">{unreadNotifications.length} unread</span>
                    )}
                  </div>

                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-slate-650 italic text-center py-4">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                            n.read ? 'bg-transparent border-transparent' : 'bg-slate-900/50 border-slate-850'
                          }`}
                        >
                          <span className="text-[11px] font-bold text-slate-300 block">{n.title}</span>
                          <span className="text-[10px] text-slate-450 mt-0.5 block leading-tight">{n.message}</span>
                          <span className="text-[8px] text-slate-600 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-slate-900/60 hover:bg-slate-900 rounded-full border border-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
          </button>

          {/* Profile Quick Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-1 rounded-full bg-slate-800 border border-slate-700 overflow-hidden"
          >
            <img
              src={profile?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'}
              alt="Profile"
              className="w-7 h-7 rounded-full object-cover"
            />
          </button>

          {/* Logout Button */}
          <button
            onClick={signOut}
            className="p-2 bg-slate-900/60 hover:bg-rose-950/40 rounded-full border border-slate-800 hover:border-rose-900/40 text-slate-400 hover:text-rose-450 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Workspace Dashboard Content */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-grow py-8 space-y-8 text-left">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 flex items-center gap-2">
              Hey, {profile?.full_name || 'Explorer'}! 👋
            </h1>
            <p className="text-sm text-slate-450 mt-1">
              Welcome back to your travel nest. Pick a trip folder or join a new one.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Join Trip Code inline */}
            <form onSubmit={handleJoinTrip} className="flex items-stretch gap-2">
              <input
                type="text"
                required
                maxLength={6}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Enter Trip Code"
                className="glass-input text-xs py-2 uppercase tracking-widest font-extrabold max-w-[150px]"
              />
              <button
                type="submit"
                disabled={isJoining || joinCodeInput.trim().length !== 6}
                className="glass-btn text-xs py-2 px-4 hover:border-cyan-800/80 hover:text-cyan-400 font-semibold"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </form>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="glass-btn-primary py-2 px-5 text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Trip Folder
            </button>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-550/10 border border-cyan-500/20 flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide">Trips</span>
              <span className="text-lg font-bold text-slate-200">{trips.length}</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide">Shared Files</span>
              <span className="text-lg font-bold text-slate-200">Live logs</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-650/10 border border-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide">Status</span>
              <span className="text-lg font-bold text-slate-250 flex items-center gap-1">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Trips Gallery Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Trip Folders</h2>

          {trips.length === 0 ? (
            <div className="w-full glass-panel py-16 px-6 rounded-2xl flex flex-col items-center justify-center border-dashed border-slate-800 text-center">
              <Compass className="w-12 h-12 text-slate-600 animate-pulse mb-4" />
              <h3 className="font-bold text-lg text-slate-350">No Shared Trip Folders Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Start a folder for your next adventure and invite your friends, or enter an invite code to join an existing group.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-6 glass-btn-primary py-2 px-5 text-xs font-semibold"
              >
                Create First Trip Folder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => handleTripClick(trip)}
                  className="glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group h-full shadow-lg"
                >
                  {/* Cover image container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={trip.cover_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'}
                      alt="Trip Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  </div>

                  {/* Vault info details */}
                  <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-slate-200 group-hover:text-cyan-400 transition-colors">
                        {trip.name}
                      </h3>
                      {trip.description && (
                        <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed">
                          {trip.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                      </span>
                      <span className="font-bold tracking-widest text-cyan-450 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-900/20 uppercase">
                        {trip.invite_code}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Trip Dialog Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <CreateTripModal onClose={() => setIsCreateOpen(false)} />
        )}
      </AnimatePresence>

      {/* Settings / OpenRouter Key Dialog Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl glass-panel p-6 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-cyan-400" /> Platform Settings
                </h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-slate-350">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-450">OpenRouter API Key (For AI Features)</label>
                  <input
                    type="password"
                    value={openRouterKeyInput}
                    onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full glass-input text-xs"
                  />
                  <span className="text-[10px] text-slate-500 leading-tight block">
                    Your key is stored locally in your browser. This enables direct OpenRouter calls for image analysis, highlights generation, and story curation. If left empty, TripNest runs in sandbox mock-AI mode.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                  <button type="button" onClick={() => setIsSettingsOpen(false)} className="glass-btn text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn-primary text-xs">
                    Save Key
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Update Dialog Drawer */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl glass-panel p-6 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-400" /> Edit Profile Details
                </h3>
                <button onClick={() => setIsProfileOpen(false)} className="text-slate-500 hover:text-slate-350">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-450">Display Name</label>
                  <input
                    type="text"
                    required
                    value={profileNameInput}
                    onChange={(e) => setProfileNameInput(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-450">Avatar Image URL</label>
                  <input
                    type="text"
                    value={profileAvatarInput}
                    onChange={(e) => setProfileAvatarInput(e.target.value)}
                    placeholder="https://api.dicebear.com/..."
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                  <button type="button" onClick={() => setIsProfileOpen(false)} className="glass-btn text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn-primary text-xs">
                    Update Details
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
