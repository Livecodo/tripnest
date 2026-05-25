import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, Users, Shield, QrCode } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Vault } from '../store/useStore';

interface CollaboratorsModalProps {
  trip: Vault;
  onClose: () => void;
}

export const CollaboratorsModal: React.FC<CollaboratorsModalProps> = ({ trip, onClose }) => {
  const members = useStore((state) => state.currentTripMembers);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const inviteLink = `${window.location.origin}/join/${trip.invite_code}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-2xl glass-panel overflow-hidden flex flex-col items-stretch"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Share Trip Folder
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Invite Code / Link Details */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400">Share Invite Link</span>
            
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-grow glass-input text-xs select-all py-2 bg-slate-950/80"
              />
              <button
                onClick={copyToClipboard}
                className="glass-btn px-3 flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-450" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg border border-slate-850 mt-2">
              <div>
                <span className="text-[10px] text-slate-500 block">Invite Code</span>
                <span className="text-sm font-extrabold tracking-wider text-cyan-400">{trip.invite_code}</span>
              </div>
              <button
                onClick={() => setShowQr(!showQr)}
                className="glass-btn text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" /> {showQr ? 'Hide QR' : 'Show QR'}
              </button>
            </div>

            {/* QR Mock Code */}
            {showQr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col items-center justify-center bg-white p-4 rounded-xl w-[160px] mx-auto border-2 border-slate-800"
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}`}
                  alt="QR Code"
                  className="w-[130px] h-[130px]"
                />
                <span className="text-[9px] text-slate-600 mt-2 font-bold font-sans">SCAN TO JOIN</span>
              </motion.div>
            )}
          </div>

          {/* Members list */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400">Members ({members.length})</span>
            
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.profile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.profile_id}`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full bg-slate-800"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        {member.profile?.full_name || 'Uploader'}
                      </span>
                      <span className="text-[9px] text-slate-500">{member.profile?.email}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-450 bg-cyan-950/20 px-2 py-0.5 rounded-md border border-cyan-900/30 capitalize">
                    <Shield className="w-3 h-3 text-cyan-500" /> {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="glass-btn text-xs py-1.5 px-4"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
