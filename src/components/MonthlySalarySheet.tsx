import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Calculator,
  ShieldCheck,
  TrendingDown,
  Coins,
  MessageCircle,
  Filter,
  Zap,
} from 'lucide-react';
import { Supervisor, DayAttendance } from '../types';
import { calculateMonthlyReport } from '../utils/salaryCalculator';
import {
  BENGALI_MONTHS,
  toBengaliNumber,
  formatTaka,
  DEDUCTION_PER_DAY,
  MONTHLY_ALLOWED_LEAVE,
  getTodayDateString,
} from '../utils/bengaliUtils';
import { SalarySlipModal } from './SalarySlipModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface MonthlySalarySheetProps {
  supervisors: Supervisor[];
  attendanceData: Record<string, DayAttendance>;
  currentYear: number;
  currentMonth: number;
}

export const MonthlySalarySheet: React.FC<MonthlySalarySheetProps> = ({
  supervisors,
  attendanceData,
  currentYear,
  currentMonth,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'গ্রুপ-এ' | 'গ্রুপ-বি'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSupervisorForSlip, setSelectedSupervisorForSlip] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Compute monthly calculations
  const reportList = calculateMonthlyReport(
    supervisors,
    attendanceData,
    selectedYear,
    selectedMonth
  );

  // Filter by group and search
  const filteredReport = reportList.filter((item) => {
    if (selectedGroup !== 'all' && item.supervisor.group !== selectedGroup) {
      return false;
    }
    const matchSearch =
      item.supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supervisor.phone.includes(searchTerm) ||
      item.supervisor.designation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Totals for filtered report
  const totalBaseSalary = filteredReport.reduce((acc, curr) => acc + curr.supervisor.baseSalary, 0);
  const totalDeductions = filteredReport.reduce((acc, curr) => acc + curr.totalDeduction, 0);
  const totalNetPayable = filteredReport.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalPresentCount = filteredReport.reduce((acc, curr) => acc + curr.presentDays, 0);
  const totalRegularAbsentCount = filteredReport.reduce((acc, curr) => acc + curr.regularAbsentDays, 0);
  const totalMonday24hAbsentCount = filteredReport.reduce((acc, curr) => acc + curr.monday24hAbsentDays, 0);
  const totalEffectiveAbsentCount = filteredReport.reduce((acc, curr) => acc + curr.effectiveAbsentDays, 0);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'সুপারভাইজারের নাম',
      'গ্রুপ',
      'মোবাইল নম্বর',
      'পদবী',
      'মূল বেতন (টাকা)',
      'উপস্থিত দিন',
      'সাধারণ অনুপস্থিতি (দিন)',
      'সোমবারের ২৪ ঘণ্টা অনুপস্থিতি (দিন)',
      'মোট কার্যকর অনুপস্থিতি (দিন)',
      'অনুমোদিত ফ্রি ছুটি (দিন)',
      'কর্তনযোগ্য নিট দিন',
      'দৈনিক কর্তনের হার (টাকা)',
      'মোট কর্তন (টাকা)',
      'প্রদেয় অবশিষ্ট নিট বেতন (টাকা)',
    ];

    const rows = filteredReport.map((r) => [
      r.supervisor.name,
      r.supervisor.group,
      r.supervisor.phone,
      r.supervisor.designation,
      r.supervisor.baseSalary,
      r.presentDays,
      r.regularAbsentDays,
      r.monday24hAbsentDays,
      r.effectiveAbsentDays,
      r.allowedLeaveDays,
      r.deductibleDays,
      r.deductionRate,
      r.totalDeduction,
      r.netSalary,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `chattogram_dredger_salary_sheet_${selectedYear}_${selectedMonth}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeSlipReport = reportList.find((r) => r.supervisor.id === selectedSupervisorForSlip);

  return (
    <div className="space-y-6">
      {/* Association Letterhead Header for Print Mode Only */}
      <div className="hidden print-only text-center mb-6 pb-4 border-b-2 border-slate-900">
        <h1 className="text-2xl font-bold text-slate-900">চট্টগ্রাম ড্রেজার মালিক সমিতি</h1>
        <p className="text-sm text-slate-700">সুপারভাইজারদের মাসিক হাজিরা ও বেতন কর্তন বিবরণী শিট</p>
        <p className="text-sm font-semibold text-slate-800 mt-1">
          মাস: {BENGALI_MONTHS[selectedMonth - 1]}, {toBengaliNumber(selectedYear)}
        </p>
      </div>

      {/* Month, Year & Group Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label htmlFor="select-salary-month" className="block text-xs font-semibold text-slate-700 mb-1">
                মাস নির্বাচন:
              </label>
              <select
                id="select-salary-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium bg-white text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
              >
                {BENGALI_MONTHS.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="select-salary-year" className="block text-xs font-semibold text-slate-700 mb-1">
                বছর:
              </label>
              <select
                id="select-salary-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium bg-white text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
              >
                {[2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {toBengaliNumber(yr)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="select-salary-group" className="block text-xs font-semibold text-slate-700 mb-1">
                গ্রুপ ফিল্টার:
              </label>
              <select
                id="select-salary-group"
                value={selectedGroup}
                onChange={(e) =>
                  setSelectedGroup(e.target.value as 'all' | 'গ্রুপ-এ' | 'গ্রুপ-বি')
                }
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium bg-white text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
              >
                <option value="all">উভয় গ্রুপ (সবাই)</option>
                <option value="গ্রুপ-এ">গ্রুপ-এ</option>
                <option value="গ্রুপ-বি">গ্রুপ-বি</option>
              </select>
            </div>

            <div className="pt-5">
              <span className="text-xs bg-cyan-50 text-cyan-900 border border-cyan-200 px-3 py-2 rounded-lg font-semibold inline-block">
                নির্বাচিত: {BENGALI_MONTHS[selectedMonth - 1]} {toBengaliNumber(selectedYear)} ({selectedGroup === 'all' ? 'সবাই' : selectedGroup})
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 md:pt-0">
            <button
              id="btn-open-wa-from-monthly"
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপ রিপোর্ট</span>
            </button>

            <button
              id="btn-print-sheet"
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>প্রিন্ট শিট</span>
            </button>

            <button
              id="btn-export-csv"
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>এক্সেল / CSV</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-supervisor"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="সুপারভাইজার নাম বা মোবাইল নম্বর খুঁজুন..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-cyan-500 bg-white"
            />
          </div>
          <div className="text-xs text-slate-700">
            তালিকাভুক্ত: <span className="font-semibold text-slate-800">{toBengaliNumber(filteredReport.length)}</span> জন
          </div>
        </div>
      </div>

      {/* Deduction & Monday 24-Hour Duty Policy Explanatory Card */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border border-amber-300 rounded-xl p-4 sm:p-5 text-amber-950 no-print shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-amber-950">
                চট্টগ্রাম ড্রেজার মালিক সমিতি — শিফটিং, সোমবারে ২৪ ঘণ্টা ডিউটি ও বেতন কর্তন নীতিমালা
              </h2>
              <span className="text-[11px] bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-full font-bold">
                কার্যকর নীতিমালা
              </span>
            </div>
            <div className="text-xs text-amber-950/90 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              <div>
                • <strong>মূল বেতন:</strong> সকল সুপারভাইজারের মাসিক নির্ধারিত মূল বেতন <strong>২০,০০০ টাকা</strong>।
              </div>
              <div>
                • <strong>দৈনিক কর্তনের হার:</strong> ২০,০০০ ÷ ৩০ = <strong>৬৬৬.৬৭ টাকা / দিন</strong>।
              </div>
              <div>
                • <strong>মাসিক ফ্রি ছুটি:</strong> মাসে মোট <strong>১ দিন</strong> ফ্রি ছুটি অনুমোদিত (বেতন কর্তন ছাড়া)।
              </div>
              <div>
                • <strong className="text-rose-800">সোমবারের ২৪ ঘণ্টা ডিউটি:</strong> অনুপস্থিত থাকলে <strong>২ দিনের বেতন (১,৩৩৩.৩৩ ৳) কর্তন</strong> হবে।
              </div>
              <div>
                • <strong>সোমবারে ২৪ ঘণ্টা ছুটি:</strong> অপর গ্রুপ সোমবারে ২৪ ঘণ্টা শিফটিং ছুটি পাবে যা সবেতন উপস্থিত গণ্য।
              </div>
              <div>
                • <strong>সাপ্তাহিক শিফট বদল:</strong> প্রতি সোমবারে ২৪ ঘণ্টা ডিউটির মাধ্যমে গ্রুপ-এ ও গ্রুপ-বি-এর দিন/রাত শিফট অদলবদল হয়।
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice if no approved records exist yet for this month */}
      {reportList[0]?.daysRecorded === 0 && (
        <div className="bg-cyan-50/90 border border-cyan-300 rounded-xl p-4 text-cyan-950 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-cyan-950">
                {BENGALI_MONTHS[selectedMonth - 1]}, {toBengaliNumber(selectedYear)} মাসের কোনো অনুমোদিত হাজিরা এখনো নেই (নতুন ফ্রেশ রেকর্ড শুরু)
              </p>
              <p className="text-xs text-cyan-800 mt-0.5">
                ১ সেপ্টেম্বর থেকে &quot;দৈনিক হাজিরা ফরম&quot;-এ হাজিরা পূরণ করে জমা দিন। অফিস কর্তৃপক্ষ অনুমোদন দিলেই স্বয়ংক্রিয়ভাবে এখানে উপস্থিতি ও কর্তনের হিসাব প্রদর্শিত হবে।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 no-print">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700 text-xs font-semibold mb-1">
            <span>সর্বমোট মূল বেতন</span>
            <Coins className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            {formatTaka(totalBaseSalary)}
          </p>
          <span className="text-[11px] text-slate-700">
            {toBengaliNumber(filteredReport.length)} জন (প্রতিজন ২০,০০০ ৳)
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700 text-xs font-semibold mb-1">
            <span>মোট উপস্থিতি ও অনুপস্থিতি</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-lg sm:text-xl font-bold text-emerald-700">
              {toBengaliNumber(totalPresentCount)} দিন
            </p>
            <span className="text-xs text-rose-700 font-semibold">
              (সাধারণ: {toBengaliNumber(totalRegularAbsentCount)}, সোম ২৪ঘণ্টা: {toBengaliNumber(totalMonday24hAbsentCount)})
            </span>
          </div>
          <span className="text-[11px] text-slate-700">
            মোট কার্যকর অনুপস্থিতি: {toBengaliNumber(totalEffectiveAbsentCount)} দিন
          </span>
        </div>

        <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/20 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-1">
            <span>মোট কর্তনকৃত টাকা</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-rose-700">
            {formatTaka(totalDeductions)}
          </p>
          <span className="text-[11px] text-rose-700/80">
            প্রতি কার্যকর দিন {toBengaliNumber(DEDUCTION_PER_DAY)} ৳
          </span>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
            <span>প্রদেয় সর্বমোট অবশিষ্ট বেতন</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-800">
            {formatTaka(totalNetPayable)}
          </p>
          <span className="text-[11px] text-emerald-700/80">
            কর্তন বাদে চূড়ান্ত পরিশোধযোগ্য
          </span>
        </div>
      </div>

      {/* Main Monthly Calculation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print-shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3 text-center w-10">ক্র.</th>
                <th className="py-3 px-3.5">সুপারভাইজার ও পদবী</th>
                <th className="py-3 px-2 text-center">গ্রুপ</th>
                <th className="py-3 px-3 text-right">মূল বেতন</th>
                <th className="py-3 px-2.5 text-center">উপস্থিত দিন</th>
                <th className="py-3 px-2.5 text-center">সাধারণ অনুপস্থিতি</th>
                <th className="py-3 px-2.5 text-center bg-amber-50/60 text-amber-950">
                  সোম ২৪ঘণ্টা অনুপস্থিতি
                </th>
                <th className="py-3 px-2.5 text-center bg-slate-50 font-bold">
                  কার্যকর অনুপস্থিতি
                </th>
                <th className="py-3 px-2.5 text-center bg-cyan-50/50">ফ্রি ছুটি বাদ</th>
                <th className="py-3 px-2.5 text-center bg-rose-50/40 text-rose-900">
                  নিট কর্তন দিন
                </th>
                <th className="py-3 px-3 text-right bg-rose-50/40 text-rose-900">
                  মোট কর্তন (৳)
                </th>
                <th className="py-3 px-3.5 text-right bg-emerald-50/70 font-bold text-emerald-950">
                  অবশিষ্ট প্রদেয় বেতন
                </th>
                <th className="py-3 px-2 text-center no-print w-20">রশিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredReport.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-600">
                    কোনো সুপারভাইজারের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredReport.map((row, index) => {
                  const hasDeduction = row.totalDeduction > 0;
                  return (
                    <tr
                      key={row.supervisor.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-medium text-slate-600">
                        {toBengaliNumber(index + 1)}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{row.supervisor.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {row.supervisor.phone}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.supervisor.group === 'গ্রুপ-এ'
                              ? 'bg-cyan-100 text-cyan-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {row.supervisor.group}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatTaka(row.supervisor.baseSalary)}
                      </td>
                      <td className="py-3 px-2.5 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {toBengaliNumber(row.presentDays)}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-xs ${
                            row.regularAbsentDays > 0
                              ? 'bg-slate-200 text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {toBengaliNumber(row.regularAbsentDays)} দিন
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-center bg-amber-50/40">
                        {row.monday24hAbsentDays > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-xs">
                            <Zap className="w-3 h-3 text-rose-600" />
                            {toBengaliNumber(row.monday24hAbsentDays)} দিন (×২ কর্তন)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">০</span>
                        )}
                      </td>
                      <td className="py-3 px-2.5 text-center bg-slate-50 font-bold text-slate-900">
                        {toBengaliNumber(row.effectiveAbsentDays)} দিন
                      </td>
                      <td className="py-3 px-2.5 text-center bg-cyan-50/30 text-cyan-900 font-semibold">
                        -{toBengaliNumber(row.allowedLeaveDays)} দিন
                      </td>
                      <td className="py-3 px-2.5 text-center bg-rose-50/20 font-bold text-rose-800">
                        {toBengaliNumber(row.deductibleDays)} দিন
                      </td>
                      <td className="py-3 px-3 text-right bg-rose-50/20 font-semibold text-rose-700">
                        {hasDeduction ? `-${formatTaka(row.totalDeduction)}` : '০.০০'}
                      </td>
                      <td className="py-3 px-3.5 text-right bg-emerald-50/50 font-extrabold text-emerald-950 text-sm">
                        {formatTaka(row.netSalary)}
                      </td>
                      <td className="py-3 px-2 text-center no-print">
                        <button
                          id={`btn-view-slip-${row.supervisor.id}`}
                          type="button"
                          onClick={() => setSelectedSupervisorForSlip(row.supervisor.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>স্লিপ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="py-3.5 px-3.5 text-right">
                  সর্বমোট সমষ্টি:
                </td>
                <td className="py-3.5 px-3 text-right">
                  {formatTaka(totalBaseSalary)}
                </td>
                <td className="py-3.5 px-2.5 text-center">
                  {toBengaliNumber(totalPresentCount)} দিন
                </td>
                <td className="py-3.5 px-2.5 text-center text-slate-700">
                  {toBengaliNumber(totalRegularAbsentCount)} দিন
                </td>
                <td className="py-3.5 px-2.5 text-center text-rose-700">
                  {toBengaliNumber(totalMonday24hAbsentCount)} দিন
                </td>
                <td className="py-3.5 px-2.5 text-center text-slate-900">
                  {toBengaliNumber(totalEffectiveAbsentCount)} দিন
                </td>
                <td className="py-3.5 px-2.5 text-center text-cyan-800">
                  -১ দিন (ফ্রি)
                </td>
                <td className="py-3.5 px-2.5 text-center text-rose-700">
                  {toBengaliNumber(
                    filteredReport.reduce((acc, curr) => acc + curr.deductibleDays, 0)
                  )}{' '}
                  দিন
                </td>
                <td className="py-3.5 px-3 text-right text-rose-700">
                  -{formatTaka(totalDeductions)}
                </td>
                <td className="py-3.5 px-3.5 text-right text-emerald-950 text-base font-extrabold">
                  {formatTaka(totalNetPayable)}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Official Signatures Section for Print View */}
      <div className="hidden print-only mt-12 pt-8 border-t border-slate-400">
        <div className="grid grid-cols-3 gap-8 text-center text-xs text-slate-800">
          <div>
            <div className="border-t border-slate-400 w-40 mx-auto mb-1"></div>
            <p className="font-semibold">প্রস্তুতকারী (অফিস কর্তৃপক্ষ)</p>
            <p className="text-[11px] text-slate-600">চট্টগ্রাম ড্রেজার মালিক সমিতি</p>
          </div>
          <div>
            <div className="border-t border-slate-400 w-40 mx-auto mb-1"></div>
            <p className="font-semibold">হিসাবরক্ষক / ক্যাশিয়ার</p>
            <p className="text-[11px] text-slate-600">চট্টগ্রাম ড্রেজার মালিক সমিতি</p>
          </div>
          <div>
            <div className="border-t border-slate-400 w-40 mx-auto mb-1"></div>
            <p className="font-semibold">সাধারণ সম্পাদক / সভাপতি</p>
            <p className="text-[11px] text-slate-600">চট্টগ্রাম ড্রেজার মালিক সমিতি</p>
          </div>
        </div>
      </div>

      {/* Salary Slip Modal */}
      {activeSlipReport && (
        <SalarySlipModal
          report={activeSlipReport}
          year={selectedYear}
          month={selectedMonth}
          onClose={() => setSelectedSupervisorForSlip(null)}
        />
      )}

      {/* WhatsApp Share Modal */}
      {showShareModal && (
        <WhatsAppShareModal
          selectedDate={getTodayDateString()}
          supervisors={supervisors}
          attendanceData={attendanceData}
          onClose={() => setShowShareModal(false)}
          initialYear={selectedYear}
          initialMonth={selectedMonth}
        />
      )}
    </div>
  );
};
