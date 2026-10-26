import React, { useState } from 'react';
import {
  Calendar,
  Share2,
  Copy,
  Check,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Phone,
  ShieldCheck,
  Send,
  MessageCircle,
  Zap,
  Sun,
  Moon,
  Coffee,
  AlertTriangle,
  Award,
  Layers,
  Filter,
  Sparkles,
  Info,
} from 'lucide-react';
import { Supervisor, DayAttendance, AbsentDateDetail } from '../types';
import {
  formatBengaliDate,
  toBengaliNumber,
  formatTaka,
  DEDUCTION_PER_DAY,
  MONTHLY_ALLOWED_LEAVE,
  BENGALI_MONTHS,
  getCurrentYearMonth,
  getTodayDateString,
} from '../utils/bengaliUtils';
import {
  computeMonthlyStatsForSupervisor,
  generateWhatsAppReportText,
  openWhatsAppShare,
} from '../utils/whatsappHelper';
import { getShiftInfoForDate } from '../utils/shiftCalculator';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface DailySummaryPreviewProps {
  supervisors: Supervisor[];
  attendanceData: Record<string, DayAttendance>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const DailySummaryPreview: React.FC<DailySummaryPreviewProps> = ({
  supervisors,
  attendanceData,
  selectedDate,
  setSelectedDate,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Month & Year state initialized from selectedDate
  const [initialY, initialM] = selectedDate.split('-').map(Number);
  const [selectedYear, setSelectedYear] = useState<number>(initialY || 2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialM || 9);

  // Filter state for cards
  const [filterMode, setFilterMode] = useState<'all' | 'absent' | 'perfect' | 'groupA' | 'groupB'>('all');
  const [showDailyToggle, setShowDailyToggle] = useState<boolean>(false);

  const monthName = BENGALI_MONTHS[selectedMonth - 1] || 'চলতি মাস';
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Approved recorded days in this month
  const recordedDatesInMonth = Object.keys(attendanceData)
    .filter((d) => {
      if (!d.startsWith(monthPrefix)) return false;
      const r = attendanceData[d];
      return r && (r.approvalStatus === 'approved' || !r.approvalStatus);
    })
    .sort();
  const totalRecordedDays = recordedDatesInMonth.length;

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    const { year, month } = getCurrentYearMonth();
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Direct WhatsApp Share of Full Month
  const handleDirectWhatsApp = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const text = generateWhatsAppReportText(
      selectedDate,
      supervisors,
      attendanceData,
      currentUrl,
      'full_month',
      selectedYear,
      selectedMonth
    );
    openWhatsAppShare(text);
  };

  // Copy Full Month Report Text
  const handleCopyText = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const text = generateWhatsAppReportText(
      selectedDate,
      supervisors,
      attendanceData,
      currentUrl,
      'full_month',
      selectedYear,
      selectedMonth
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Precompute stats for all supervisors
  const allSupervisorStats = supervisors.map((s) => {
    const stats = computeMonthlyStatsForSupervisor(s, attendanceData, selectedYear, selectedMonth);
    return { supervisor: s, stats };
  });

  const totalAbsentsCount = allSupervisorStats.reduce((acc, curr) => acc + curr.stats.actualMissedDays, 0);
  const totalDeductionsAmount = allSupervisorStats.reduce((acc, curr) => acc + curr.stats.totalDeduction, 0);
  const supervisorsWithAbsencesCount = allSupervisorStats.filter((item) => item.stats.actualMissedDays > 0).length;
  const supervisorsPerfectCount = allSupervisorStats.filter((item) => item.stats.actualMissedDays === 0).length;

  // Filtered list
  const filteredList = allSupervisorStats.filter((item) => {
    if (filterMode === 'absent') return item.stats.actualMissedDays > 0;
    if (filterMode === 'perfect') return item.stats.actualMissedDays === 0;
    if (filterMode === 'groupA') return item.supervisor.group === 'গ্রুপ-এ';
    if (filterMode === 'groupB') return item.supervisor.group === 'গ্রুপ-বি';
    return true;
  });

  const groupAItems = filteredList.filter((item) => item.supervisor.group === 'গ্রুপ-এ');
  const groupBItems = filteredList.filter((item) => item.supervisor.group === 'গ্রুপ-বি');

  // Single Day Shift Info (for today / selected single date)
  const shiftInfo = getShiftInfoForDate(selectedDate);
  const dayRecord = attendanceData[selectedDate];
  const dayRecords = dayRecord?.records || {};

  return (
    <div className="space-y-6">
      {/* Association Letterhead for Print Mode */}
      <div className="hidden print-only text-center mb-6 pb-4 border-b-2 border-slate-900">
        <h1 className="text-2xl font-bold text-slate-900">চট্টগ্রাম ড্রেজার মালিক সমিতি</h1>
        <p className="text-sm text-slate-700">বন্দর ব্লক ও নদী ড্রেজিং প্রকল্প, চট্টগ্রাম</p>
        <h2 className="text-lg font-bold text-slate-800 mt-2">
          সুপারভাইজারদের মাসিক পূর্ণাঙ্গ হাজিরা বিবরণী ও বেতন কর্তন রেজিস্টার
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          মাস: {monthName} {toBengaliNumber(selectedYear)} | মোট ক্যালেন্ডার দিন: {toBengaliNumber(totalDaysInMonth)} দিন
        </p>
      </div>

      {/* Top Banner & Full Month Navigation Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-900 bg-cyan-100/80 border border-cyan-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-700" />
                পূর্ণাঙ্গ মাসিক অটো-প্রিভিউ ও শেয়ার
              </span>
              <span className="text-xs text-slate-600">হোয়াটসঅ্যাপ অফিসিয়াল ফরম্যাট</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
              মাসিক হাজিরা বিবরণী, অনুপস্থিতির নির্দিষ্ট তারিখ ও বেতন কর্তন অটো-প্রিভিউ
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              নির্বাচিত মাস: <strong className="text-cyan-950 font-bold">{monthName} {toBengaliNumber(selectedYear)}</strong> | সংরক্ষিত অফিস হাজিরা রেকর্ড: মোট <strong className="text-slate-800 font-bold">{toBengaliNumber(totalRecordedDays)}</strong> দিন
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-quick-wa-share"
              type="button"
              onClick={handleDirectWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="পুরো মাসের অনুপস্থিতির তারিখসহ রিপোর্ট সরাসরি হোয়াটসঅ্যাপে পাঠান"
            >
              <Send className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপে মাসিক রিপোর্ট পাঠান</span>
            </button>

            <button
              id="btn-open-wa-modal"
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="মেসেজ ফরম্যাট প্রিভিউ ও কপি করুন"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>রিপোর্ট প্রিভিউ ও কপি</span>
            </button>

            <button
              id="btn-copy-preview-text"
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="মাসিক টেক্সট কপি করুন"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'কপি হয়েছে!' : 'টেক্সট কপি'}</span>
            </button>

            <button
              id="btn-print-preview"
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Month Navigation & Controls Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-cyan-700" />
              মাস নির্বাচন:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="পূর্ববর্তী মাস"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              >
                {BENGALI_MONTHS.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              >
                <option value={2025}>{toBengaliNumber(2025)}</option>
                <option value={2026}>{toBengaliNumber(2026)}</option>
                <option value={2027}>{toBengaliNumber(2027)}</option>
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="পরবর্তী মাস"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 transition-colors cursor-pointer"
            >
              চলতি মাস
            </button>
          </div>

          {/* Quick Monthly Metric Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg font-medium text-slate-800">
              <span>ক্যালেন্ডার দিন: <strong className="font-bold">{toBengaliNumber(totalDaysInMonth)}</strong> দিন</span>
            </div>
            <div className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-lg font-medium text-cyan-900">
              <span>সংরক্ষিত এন্ট্রি: <strong className="font-bold">{toBengaliNumber(totalRecordedDays)}</strong> দিন</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>১০০% উপস্থিত: {toBengaliNumber(supervisorsPerfectCount)} জন</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-lg font-bold">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>অনুপস্থিতি রয়েছে: {toBengaliNumber(supervisorsWithAbsencesCount)} জন</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              ফিল্টার:
            </span>

            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              সকল সুপারভাইজার ({toBengaliNumber(supervisors.length)})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('absent')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'absent'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              অনুপস্থিতি রয়েছে যাদের ({toBengaliNumber(supervisorsWithAbsencesCount)})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('perfect')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'perfect'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              ১০০% উপস্থিতি রয়েছে যাদের ({toBengaliNumber(supervisorsPerfectCount)})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('groupA')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'groupA'
                  ? 'bg-cyan-700 text-white shadow-2xs'
                  : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
              }`}
            >
              গ্রুপ-এ
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('groupB')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'groupB'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              গ্রুপ-বি
            </button>
          </div>

          {/* Toggle button to view single day details if needed */}
          <button
            type="button"
            onClick={() => setShowDailyToggle(!showDailyToggle)}
            className="text-xs text-cyan-800 hover:text-cyan-900 font-semibold flex items-center gap-1 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-lg border border-cyan-200 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{showDailyToggle ? 'দৈনিক প্যানেল লুকান' : 'দৈনিক একক দিন ও শিফট চেক করুন'}</span>
          </button>
        </div>

        {/* Collapsible Single Day Panel */}
        {showDailyToggle && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">তারিখ নির্বাচন:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
                />
                <span className="text-slate-600">
                  ({formatBengaliDate(selectedDate)} — {shiftInfo.dayName})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                  {shiftInfo.isMonday ? '⚡ সোমবার: ২৪ ঘণ্টা ডাবল ডিউটি শিফট বদল' : 'নিয়মিত ১২ ঘণ্টা শিফট'}
                </span>
              </div>
            </div>
            <p className="text-slate-600">
              {shiftInfo.isMonday
                ? `২৪ ঘণ্টা ডিউটি: ${shiftInfo.monday24hDutyGroup} (অনুপস্থিতিতে ২ দিনের কর্তন) | ২৪ ঘণ্টা বিশ্রাম: ${shiftInfo.monday24hRestGroup} (সবেতন)`
                : `দিনের শিফট (১২ ঘণ্টা): ${shiftInfo.dayShiftGroup} | রাতের শিফট (১২ ঘণ্টা): ${shiftInfo.nightShiftGroup}`}
            </p>
          </div>
        )}
      </div>

      {/* Group A Section */}
      {groupAItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gradient-to-r from-cyan-900 to-cyan-800 text-white px-5 py-3 rounded-xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 ring-2 ring-cyan-200"></span>
              <h3 className="font-bold text-base sm:text-lg">
                গ্রুপ-এ ({toBengaliNumber(groupAItems.length)} জন) — মাসিক পূর্ণাঙ্গ হাজিরা ও অনুপস্থিতির তারিখ
              </h3>
            </div>
            <span className="text-xs text-cyan-100 bg-white/10 px-3 py-1 rounded-full font-medium">
              মাস: {monthName} {toBengaliNumber(selectedYear)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupAItems.map((item, idx) => renderMonthlySupervisorCard(item.supervisor, item.stats, idx))}
          </div>
        </div>
      )}

      {/* Group B Section */}
      {groupBItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-5 py-3 rounded-xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-400 ring-2 ring-blue-200"></span>
              <h3 className="font-bold text-base sm:text-lg">
                গ্রুপ-বি ({toBengaliNumber(groupBItems.length)} জন) — মাসিক পূর্ণাঙ্গ হাজিরা ও অনুপস্থিতির তারিখ
              </h3>
            </div>
            <span className="text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-full font-medium">
              মাস: {monthName} {toBengaliNumber(selectedYear)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupBItems.map((item, idx) =>
              renderMonthlySupervisorCard(item.supervisor, item.stats, groupAItems.length + idx)
            )}
          </div>
        </div>
      )}

      {filteredList.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Info className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">কোনো সুপারভাইজার পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500 mt-1">নির্বাচিত ফিল্টারে কোনো রেকর্ড নেই। অন্য ফিল্টার নির্বাচন করুন।</p>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {showShareModal && (
        <WhatsAppShareModal
          selectedDate={selectedDate}
          supervisors={supervisors}
          attendanceData={attendanceData}
          onClose={() => setShowShareModal(false)}
          initialYear={selectedYear}
          initialMonth={selectedMonth}
        />
      )}
    </div>
  );

  // Helper render function for each Supervisor's monthly card
  function renderMonthlySupervisorCard(s: Supervisor, stats: ReturnType<typeof computeMonthlyStatsForSupervisor>, index: number) {
    const hasAbsences = stats.actualMissedDays > 0;
    const isPerfect = stats.actualMissedDays === 0;

    return (
      <div
        key={s.id}
        id={`monthly-card-${s.id}`}
        className={`rounded-2xl border p-5 transition-all shadow-xs ${
          hasAbsences
            ? 'bg-white border-rose-200 hover:border-rose-300 ring-1 ring-rose-100'
            : 'bg-white border-slate-200 hover:border-cyan-300'
        }`}
      >
        {/* Supervisor Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 border shadow-2xs ${
                isPerfect
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {toBengaliNumber(index + 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-base sm:text-lg">{s.name}</h4>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                  {s.group}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">{s.phone}</span>
                <span className="text-slate-300">•</span>
                <span>{s.designation}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isPerfect ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                ১০০% উপস্থিতি
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 font-bold text-xs">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                {toBengaliNumber(stats.actualMissedDays)} দিন অনুপস্থিত
              </span>
            )}
          </div>
        </div>

        {/* Monthly Numbers Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">উপস্থিত দিন</span>
            <span className="font-bold text-emerald-700 text-sm sm:text-base">
              {toBengaliNumber(stats.presentDays)} দিন
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">অনুপস্থিতি (মোট)</span>
            <span className={`font-bold text-sm sm:text-base ${hasAbsences ? 'text-rose-700' : 'text-slate-700'}`}>
              {toBengaliNumber(stats.actualMissedDays)} দিন
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">বেতন কর্তন</span>
            <span className={`font-bold text-sm sm:text-base ${stats.totalDeduction > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {stats.totalDeduction > 0 ? formatTaka(stats.totalDeduction) : '০ ৳'}
            </span>
          </div>

          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 text-[11px] block font-medium">অবশিষ্ট নিট বেতন</span>
            <span className="font-bold text-emerald-900 text-sm sm:text-base">
              {formatTaka(stats.netSalary)}
            </span>
          </div>
        </div>

        {/* CRITICAL REQUIREMENT: EXPLICIT DEDICATED ABSENT DATES LIST */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          {hasAbsences ? (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  অনুপস্থিতির নির্দিষ্ট তারিখসমূহ (মোট {toBengaliNumber(stats.actualMissedDays)} দিন):
                </span>
                <span className="text-[11px] font-semibold text-rose-700 bg-white/80 px-2 py-0.5 rounded border border-rose-200">
                  কার্যকর কর্তন দিন: {toBengaliNumber(stats.effectiveAbsentDays)} দিন
                </span>
              </div>

              <div className="space-y-1.5">
                {stats.absentDates.map((absent, aIdx) => (
                  <div
                    key={aIdx}
                    className="flex flex-wrap items-center justify-between gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-rose-200/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {toBengaliNumber(aIdx + 1)}
                      </span>
                      <strong className="text-slate-900 font-bold">{absent.formattedBengaliDate}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {absent.isMonday24h ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                          <Zap className="w-3 h-3 text-amber-700" />
                          সোমবারে ২৪ ঘণ্টা ডিউটি (২ দিন কর্তন)
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          সাধারণ ডিউটি (১ দিন কর্তন)
                        </span>
                      )}

                      {absent.remarks && (
                        <span className="text-[11px] text-slate-600 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          {absent.remarks}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Leave policy reminder info */}
              <div className="mt-2.5 pt-2 border-t border-rose-200/60 flex flex-wrap items-center justify-between text-[11px] text-rose-800">
                <span>
                  • মাসিক ফ্রি ছুটি: <strong>১ দিন</strong> সমন্বিত হয়েছে (কর্তনমুক্ত)
                </span>
                <span>
                  • নিট কর্তনযোগ্য দিন: <strong>{toBengaliNumber(stats.deductibleDays)} দিন</strong> × ৬৬৬.৬৭ ৳ = <strong>{formatTaka(stats.totalDeduction)}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>আলহামদুলিল্লাহ!</strong> এই মাসে কোনো অনুপস্থিতি নেই — পুরো মাস ১০০% উপস্থিত (মূল বেতন ২০,০০০ টাকা সম্পূর্ণ প্রাপ্য)।
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
};
