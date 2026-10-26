import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Calendar,
  Building2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Zap,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Supervisor, DayAttendance } from '../types';
import {
  generateWhatsAppReportText,
  openWhatsAppShare,
  WhatsAppReportType,
  computeMonthlyStatsForSupervisor,
} from '../utils/whatsappHelper';
import { formatBengaliDate, toBengaliNumber, BENGALI_MONTHS } from '../utils/bengaliUtils';

interface WhatsAppShareModalProps {
  selectedDate: string;
  supervisors: Supervisor[];
  attendanceData: Record<string, DayAttendance>;
  onClose: () => void;
  initialYear?: number;
  initialMonth?: number;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  selectedDate,
  supervisors,
  attendanceData,
  onClose,
  initialYear,
  initialMonth,
}) => {
  const [reportType, setReportType] = useState<WhatsAppReportType>('full_month');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [dateYear, dateMonth, dateDay] = selectedDate.split('-').map(Number);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || dateYear || 2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || dateMonth || 9);

  // Month navigation
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

  // Month total days & records
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const recordedDays = Object.keys(attendanceData).filter((d) => {
    if (!d.startsWith(monthPrefix)) return false;
    const r = attendanceData[d];
    return r && (r.approvalStatus === 'approved' || !r.approvalStatus);
  }).length;

  // Monthly stats across all supervisors
  let totalAbsentsInMonth = 0;
  let supervisorsWithAbsences = 0;
  supervisors.forEach((s) => {
    const stats = computeMonthlyStatsForSupervisor(s, attendanceData, selectedYear, selectedMonth);
    if (stats.actualMissedDays > 0) {
      totalAbsentsInMonth += stats.actualMissedDays;
      supervisorsWithAbsences += 1;
    }
  });

  // Share link
  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  const reportText = generateWhatsAppReportText(
    selectedDate,
    supervisors,
    attendanceData,
    currentUrl,
    reportType,
    selectedYear,
    selectedMonth
  );

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const handleSendWhatsApp = () => {
    openWhatsAppShare(reportText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Executive Styling */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/30 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <MessageCircle className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  হোয়াটসঅ্যাপ পূর্ণাঙ্গ মাসিক হাজিরা ও কর্তন রিপোর্ট
                </h3>
                <span className="text-[11px] bg-emerald-500/25 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-emerald-200 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  অনুপস্থিতির নির্দিষ্ট তারিখসহ
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                মাস: {BENGALI_MONTHS[selectedMonth - 1]} {toBengaliNumber(selectedYear)} — চট্টগ্রাম ড্রেজার মালিক সমিতি
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Month Selector Bar */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">রিপোর্টের মাস নির্বাচন:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                  title="পূর্ববর্তী মাস"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white"
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
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white"
                >
                  <option value={2025}>{toBengaliNumber(2025)}</option>
                  <option value={2026}>{toBengaliNumber(2026)}</option>
                  <option value={2027}>{toBengaliNumber(2027)}</option>
                </select>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                  title="পরবর্তী মাস"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick stats pills */}
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                ক্যালেন্ডার দিন: <strong className="text-slate-900">{toBengaliNumber(totalDaysInMonth)}</strong> দিন
              </span>
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                সংরক্ষিত এন্ট্রি: <strong className="text-cyan-800">{toBengaliNumber(recordedDays)}</strong> দিন
              </span>
              <span className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-rose-800 font-bold">
                অনুপস্থিতি: {toBengaliNumber(supervisorsWithAbsences)} জনে {toBengaliNumber(totalAbsentsInMonth)} দিন
              </span>
            </div>
          </div>

          {/* Template Switcher */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap gap-1.5 border border-slate-200">
            <button
              id="btn-wa-type-fullmonth"
              type="button"
              onClick={() => setReportType('full_month')}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'full_month' || reportType === 'monthly_cumulative'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 bg-white/70'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>📊 পূর্ণাঙ্গ মাসিক রিপোর্ট (অনুপস্থিত তারিখসহ)</span>
            </button>

            <button
              id="btn-wa-type-audit"
              type="button"
              onClick={() => setReportType('deduction_audit')}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'deduction_audit'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 bg-white/70'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>⚠️ কর্তন ও অনুপস্থিতি অডিট (তারিখসহ)</span>
            </button>

            <button
              id="btn-wa-type-summary"
              type="button"
              onClick={() => setReportType('monthly_summary')}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'monthly_summary'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 bg-white/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>⚡ সংক্ষিপ্ত সারসংক্ষেপ</span>
            </button>

            <button
              id="btn-wa-type-daily"
              type="button"
              onClick={() => setReportType('daily_only')}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'daily_only'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 bg-white/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📅 দৈনিক একক দিনের হাজিরা</span>
            </button>
          </div>

          {/* Formatted Text Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>মেসেজ টেক্সট প্রিভিউ (হোয়াটসঅ্যাপ উপযোগী):</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ প্রত্যেক অনুপস্থিতির নির্দিষ্ট তারিখ ও ডিউটির ধরণ অন্তর্ভুক্ত রয়েছে
              </span>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={reportText}
                rows={13}
                className="w-full font-mono text-xs p-4 bg-slate-950 text-emerald-300 rounded-xl border border-slate-800 focus:outline-hidden leading-relaxed shadow-inner selection:bg-emerald-800 selection:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-copy-wa-link"
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4 text-slate-500" />}
              <span>{linkCopied ? 'লিংক কপি হয়েছে!' : 'পোর্টাল লিংক কপি'}</span>
            </button>

            <button
              id="btn-copy-wa-text"
              type="button"
              onClick={handleCopyText}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'মেসেজ কপি সম্পন্ন!' : 'সম্পূর্ণ মেসেজ কপি'}</span>
            </button>
          </div>

          <button
            id="btn-direct-send-whatsapp"
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপে সরাসরি পাঠান</span>
          </button>
        </div>
      </div>
    </div>
  );
};
