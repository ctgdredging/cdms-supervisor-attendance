import React from 'react';
import {
  Anchor,
  Calendar,
  Users,
  FileText,
  History,
  Info,
  Github,
  Send,
  Eye,
  ShieldCheck,
  Lock,
  Unlock,
  BellRing,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { formatBengaliDate, getTodayDateString, toBengaliNumber } from '../utils/bengaliUtils';

import { Supervisor } from '../types';

export type AppTab = 'attendance' | 'approval' | 'preview' | 'monthly' | 'history' | 'supervisors' | 'rules';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  supervisorCount: number;
  todayStats: { present: number; absent: number; total: number };
  pendingCount: number;
  isOfficeAuthenticated: boolean;
  loggedInSupervisor?: Supervisor | null;
  isCloudConnected?: boolean;
  isSyncing?: boolean;
  onOpenGitHubModal: () => void;
  onOpenWhatsAppModal: () => void;
  onOpenPinModal: () => void;
  onOpenAuthModal: (tab?: 'office' | 'supervisor') => void;
  onLogoutOffice: () => void;
  onLogoutSupervisor?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  supervisorCount,
  todayStats,
  pendingCount,
  isOfficeAuthenticated,
  loggedInSupervisor = null,
  isCloudConnected = true,
  isSyncing = false,
  onOpenGitHubModal,
  onOpenWhatsAppModal,
  onOpenPinModal,
  onOpenAuthModal,
  onLogoutOffice,
  onLogoutSupervisor,
}) => {
  const todayStr = getTodayDateString();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Top Banner with Association Identity */}
      <div className="bg-gradient-to-r from-cyan-950 via-blue-950 to-slate-900 text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Anchor className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
                  CDMS অফিসিয়াল পোর্টাল
                </span>
                <span className="text-xs text-slate-300">চট্টগ্রাম বন্দর এলাকা</span>
                {isOfficeAuthenticated && (
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    অফিস লগইন সক্রিয়
                  </span>
                )}
                {/* Real-time Cloud Sync Status Pill */}
                {isSyncing ? (
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    ক্লাউডে সিঙ্ক হচ্ছে...
                  </span>
                ) : isCloudConnected ? (
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1.5" title="পিসি ও মোবাইল রিয়েল-টাইমে সংযুক্ত">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <Cloud className="w-3 h-3" />
                    লাইভ ক্লাউড সিঙ্ক
                  </span>
                ) : (
                  <span className="text-[11px] bg-slate-700/50 text-slate-300 border border-slate-600/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    অফলাইন মেমোরি
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                চট্টগ্রাম ড্রেজার মালিক সমিতি (CDMS)
              </h1>
              <p className="text-xs text-cyan-100/80 font-normal">
                সুপারভাইজারদের বন্দর ব্লক হাজিরা, অফিস অনুমোদন (PIN) ও বেতন কর্তন রেজিস্টার
              </p>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>{formatBengaliDate(todayStr)}</span>
            </div>

            {/* Authentication Buttons: Office or Supervisor */}
            {isOfficeAuthenticated ? (
              <button
                type="button"
                onClick={onLogoutOffice}
                className="bg-emerald-600/30 hover:bg-rose-600/30 border border-emerald-400/40 hover:border-rose-400/40 text-emerald-200 hover:text-rose-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="অফিস সেশন লক করুন"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>🏢 অফিস লগইন (লক)</span>
              </button>
            ) : loggedInSupervisor ? (
              <button
                type="button"
                onClick={onLogoutSupervisor}
                className="bg-cyan-600/30 hover:bg-rose-600/30 border border-cyan-400/40 hover:border-rose-400/40 text-cyan-200 hover:text-rose-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="সুপারভাইজার সেশন লগআউট করুন"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>👷 {loggedInSupervisor.name} (লগআউট)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('supervisor')}
                  className="bg-cyan-800 hover:bg-cyan-700 text-cyan-100 border border-cyan-600/50 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="সুপারভাইজার মোবাইল ও পাসওয়ার্ড দিয়ে লগইন করুন"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-300" />
                  <span>সুপারভাইজার লগইন</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('office')}
                  className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="অফিস পিন দিয়ে প্রবেশ করুন"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>অফিস পিন</span>
                </button>
              </div>
            )}

            {/* WhatsApp Monthly Report button */}
            <button
              id="btn-header-wa"
              type="button"
              onClick={onOpenWhatsAppModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="হোয়াটসঅ্যাপে মাসিক হাজিরা রিপোর্ট পাঠান"
            >
              <Send className="w-3.5 h-3.5" />
              <span>হোয়াটসঅ্যাপ রিপোর্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
          {/* Tab: Daily Attendance Form (Supervisor) */}
          <button
            id="tab-daily-attendance"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>দৈনিক হাজিরা ফরম</span>
          </button>

          {/* Tab: Office Approval (with pending badge) */}
          <button
            id="tab-office-approval"
            onClick={() => setActiveTab('approval')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'approval'
                ? 'bg-emerald-700 text-white shadow-xs'
                : pendingCount > 0
                ? 'bg-amber-100/70 text-amber-900 hover:bg-amber-100 border border-amber-300 font-bold'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>অফিস অনুমোদন</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold animate-pulse">
                {toBengaliNumber(pendingCount)}
              </span>
            )}
          </button>

          {/* Tab: Daily Preview */}
          <button
            id="tab-daily-preview"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>অটো-প্রিভিউ ও শেয়ার</span>
          </button>

          {/* Tab: Monthly Salary */}
          <button
            id="tab-monthly-sheet"
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>মাসিক বেতন শিট</span>
          </button>

          {/* Tab: History */}
          <button
            id="tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>হাজিরা ইতিহাস</span>
          </button>

          {/* Tab: Supervisors */}
          <button
            id="tab-supervisors"
            onClick={() => setActiveTab('supervisors')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'supervisors'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>সুপারভাইজার ({toBengaliNumber(supervisorCount)})</span>
          </button>

          {/* Tab: Rules */}
          <button
            id="tab-rules"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ml-auto cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>বেতন কর্তন নিয়ম (৬৬৬.৬৭ ৳)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
