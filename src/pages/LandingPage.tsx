import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, Users, Sparkles, Compass, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-between">
      {/* Background neon flares */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-900/60 max-w-7xl w-full mx-auto backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            TripNest
          </span>
        </div>

        <button
          onClick={() => navigate('/auth')}
          className="glass-btn hover:bg-slate-900 text-xs font-semibold py-1.5 px-4"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-grow flex flex-col justify-center py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-full px-4.5 py-1.5 text-xs text-cyan-400 font-semibold shadow-inner shadow-black/10">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Travel Memories Shared
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-100"
            >
              Collaborative trip folders for{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 bg-clip-text text-transparent">
                shared memories
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-slate-450 text-base sm:text-lg max-w-2xl leading-relaxed"
            >
              Ditch the scattered chat threads and low-res uploads. Create private trip albums, invite your group instantly, and share photos & videos together in real-time, enhanced by AI organization.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate('/auth')}
                className="glass-btn-primary px-7 py-3 text-sm font-semibold flex items-center gap-2 group"
              >
                Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#features"
                className="glass-btn px-6 py-3 text-sm font-medium hover:bg-slate-900"
              >
                Learn More
              </a>
            </motion.div>
          </div>

          {/* Hero Right Visuals */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Visual Glass Box Mockup */}
            <div className="w-[340px] sm:w-[400px] aspect-[4/5] glass-panel rounded-2xl p-4 shadow-2xl relative rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="relative w-full h-[60%] rounded-xl overflow-hidden mb-4 bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=80"
                  alt="Swiss Lakes"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30 text-[10px] font-bold text-cyan-400 px-2 py-0.5 rounded">
                    SWITZERLAND 🇨🇭
                  </div>
                </div>
              </div>

              {/* Mock shared user tags */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200">Alps Roadtrip '26</h4>
                  <span className="text-[10px] text-slate-500">July 10-18</span>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time photo logs with Alex, Sarah, and John.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                  <div className="flex -space-x-2">
                    {['A', 'S', 'J'].map((initial, i) => (
                      <div
                        key={i}
                        className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-slate-900 ${
                          i === 0 ? 'bg-cyan-500' : i === 1 ? 'bg-violet-600' : 'bg-emerald-600'
                        }`}
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-cyan-400">42 memories uploaded</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Features Grid Section */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 py-20 border-t border-slate-900/60">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100">
            Engineered for shared travel moments
          </h2>
          <p className="text-sm text-slate-450">
            A premium set of features allowing you to save, collaborate, and relive your journeys together in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-xl space-y-4 hover:border-slate-700/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-550/10 border border-cyan-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-200">High-Res Uploads</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Upload original size photos and videos directly from your browser or mobile phone, backed by lightning fast CDNs.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-xl space-y-4 hover:border-slate-700/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-200">Realtime Collaboration</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              New uploads, reactions, comments, and member presences synchronize instantly across all devices.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-xl space-y-4 hover:border-slate-700/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-650/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-200">AI Assistant Integration</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Generate AI descriptions, search memories by keywords, and get custom trip summaries automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-900/60 max-w-7xl w-full mx-auto text-center flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <span>© 2026 TripNest. All rights reserved. Powered by InsForge BaaS.</span>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-450 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-450 transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};
