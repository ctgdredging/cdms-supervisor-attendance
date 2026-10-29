import React from 'react';
import { Printer, X, Anchor, AlertTriangle, Zap } from 'lucide-react';
import { MonthlySalaryReport } from '../types';
import {
  BENGALI_MONTHS,
  toBengaliNumber,
  formatTaka,
  DEDUCTION_PER_DAY,
} from '../utils/bengaliUtils';

interface SalarySlipModalProps {
  report: MonthlySalaryReport;
  year: number;
  month: number;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({
  report,
  year,
  month,
  onClose,
}) => {
  const monthName = BENGALI_MONTHS[month - 1];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-cyan-700" />
            <span className="font-bold text-slate-800 text-sm">
              বেতন ভাউচার ও কর্তন রশিদ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-voucher"
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট ভাউচার</span>
            </button>
            <button
              id="btn-close-slip-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Pay Voucher Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Letterhead Header */}
          <div className="text-center border-b-2 border-cyan-800 pb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100 text-cyan-900 mb-2">
              <Anchor className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              চট্টগ্রাম ড্রেজার মালিক সমিতি
            </h1>
            <p className="text-xs text-slate-700 mt-0.5">
              প্রধান কার্যালয়: চট্টগ্রাম, বাংলাদেশ
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-bold text-cyan-900">
              সুপারভাইজার বেতন রশিদ — {monthName}, {toBengaliNumber(year)}
            </div>
          </div>

          {/* Supervisor Information Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm">
            <div>
              <span className="text-slate-600 text-xs block">সুপারভাইজারের নাম:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">
                  {report.supervisor.name}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900">
                  {report.supervisor.group}
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-600 text-xs block">পদবী:</span>
              <span className="font-semibold text-slate-800">
                {report.supervisor.designation}
              </span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block">মোবাইল নম্বর:</span>
              <span className="font-medium text-slate-800">
                {report.supervisor.phone}
              </span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block">মূল মাসিক বেতন:</span>
              <span className="font-bold text-cyan-950">
                {formatTaka(report.supervisor.baseSalary)}
              </span>
            </div>
          </div>

          {/* Attendance Summary Grid */}
          <div>
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              হাজিরা ও ছুটির বিবরণী
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-slate-600 block text-[11px]">উপস্থিত দিন</span>
                <span className="text-base font-bold text-emerald-800">
                  {toBengaliNumber(report.presentDays)} দিন
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300">
                <span className="text-amber-900 block text-[11px] font-semibold">ছুটি (বেতনযুক্ত)</span>
                <span className="text-base font-bold text-amber-900">
                  {toBengaliNumber(report.leaveDays || 0)} দিন
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-slate-600 block text-[11px]">সাধারণ অনুপস্থিতি</span>
                <span className="text-base font-bold text-slate-800">
                  {toBengaliNumber(report.regularAbsentDays)} দিন
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-rose-900 block text-[11px] font-semibold">সোম ২৪ঘণ্টা অনুপস্থিতি</span>
                <span className="text-base font-extrabold text-rose-900">
                  {toBengaliNumber(report.monday24hAbsentDays)} দিন
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-200">
                <span className="text-cyan-900 block text-[11px] font-semibold">ফ্রি প্রাপ্ত ছুটি</span>
                <span className="text-base font-bold text-cyan-800">
                  ১ দিন
                </span>
              </div>
            </div>
            {report.leaveDays > 0 && (
              <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-[11px] text-emerald-900 font-semibold flex items-center gap-1.5">
                <span>✓</span>
                <span>অফিস কর্তৃপক্ষ কর্তৃক {toBengaliNumber(report.leaveDays)} দিন বিবেচনাধীন ছুটি হিসেবে অনুমোদন করা হয়েছে (কোনো বেতন কাটা হয়নি, সম্পূর্ণ বেতন প্রাপ্য)।</span>
              </div>
            )}
          </div>

          {/* Absent Dates List if any */}
          {report.absentDates && report.absentDates.length > 0 && (
            <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs space-y-1.5">
              <span className="font-bold text-rose-900 block">
                অনুপস্থিতির নির্দিষ্ট তারিখসমূহ (মোট {toBengaliNumber(report.actualMissedDays)} দিন):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {report.absentDates.map((abs, idx) => (
                  <div key={idx} className="bg-white p-1.5 px-2.5 rounded border border-rose-200 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-800">{abs.formattedBengaliDate}</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${abs.isMonday24h ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
                      {abs.isMonday24h ? 'সোম ২৪ঘণ্টা (২ দিন)' : 'সাধারণ (১ দিন)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special notice if Monday 24h duty absent */}
          {report.monday24hAbsentDays > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>বিশেষ কর্তন উল্লেখ:</strong> সমিতির নীতিমালা অনুসারে প্রতি সোমবারের ২৪ ঘণ্টা (ডাবল ডিউটি) শিফটে অনুপস্থিত থাকার কারণে {toBengaliNumber(report.monday24hAbsentDays)}টি অনুপস্থিতির বিপরীতে মোট <strong>{toBengaliNumber(report.monday24hAbsentDays * 2)} দিনের বেতন কর্তন</strong> হিসাব করা হয়েছে।
              </div>
            </div>
          )}

          {/* Salary Deduction Computation Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 uppercase">
              বেতন কর্তন ও প্রদেয় হিসাব বিবরণী
            </div>
            <table className="w-full text-xs sm:text-sm">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-4 text-slate-700">১. মূল মাসিক বেতন</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatTaka(report.supervisor.baseSalary)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700">
                    ২. সাধারণ দিনগুলোতে অনুপস্থিতি
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-800">
                    {toBengaliNumber(report.regularAbsentDays)} দিন
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700">
                    ৩. সোমবারের ২৪ ঘণ্টা ডিউটিতে অনুপস্থিতি (দ্বিগুণ কর্তন প্রযোজ্য)
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                    {toBengaliNumber(report.monday24hAbsentDays)} দিন (হিসাব = {toBengaliNumber(report.monday24hAbsentDays * 2)} দিন)
                  </td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="py-2.5 px-4 text-slate-800 font-semibold">
                    ৪. সর্বমোট কার্যকর অনুপস্থিতি
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    {toBengaliNumber(report.effectiveAbsentDays)} দিন
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700">
                    ৫. বাদ: মাসিক ১ দিন নির্ধারিত অনুমোদিত ছুটি (সমিতির ফ্রি ছুটি)
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-emerald-700">
                    -{toBengaliNumber(report.allowedLeaveDays)} দিন (কর্তনমুক্ত)
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700">
                    ৬. বেতন কর্তনযোগ্য নিট কার্যদিবস
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                    {toBengaliNumber(report.deductibleDays)} দিন
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700">
                    ৭. দিনপ্রতি নির্ধারিত কর্তন হার
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-700">
                    {formatTaka(DEDUCTION_PER_DAY)}
                  </td>
                </tr>
                <tr className="bg-rose-50/50">
                  <td className="py-2.5 px-4 font-semibold text-rose-900">
                    ৮. মোট বেতন কর্তন ({toBengaliNumber(report.deductibleDays)} দিন × {toBengaliNumber(DEDUCTION_PER_DAY)} ৳)
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                    -{formatTaka(report.totalDeduction)}
                  </td>
                </tr>
                <tr className="bg-emerald-50 text-base font-extrabold text-emerald-950">
                  <td className="py-3.5 px-4">সর্বমোট প্রদেয় অবশিষ্ট নিট বেতন</td>
                  <td className="py-3.5 px-4 text-right text-emerald-900">
                    {formatTaka(report.netSalary)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Explanation Note */}
          <div className="text-[11px] text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
            * চট্টগ্রাম ড্রেজার মালিক সমিতির সিদ্ধান্ত অনুসারে প্রতি সোমবারের ২৪ ঘণ্টা ডিউটিতে অনুপস্থিতির ক্ষেত্রে ২ দিনের বেতন কর্তন প্রযোজ্য। এছাড়াও প্রত্যেক সুপারভাইজারকে মাসে ১ দিন নির্ধারিত ছুটি প্রদান করা হয় যা মোট অনুপস্থিতি থেকে বাদ দিয়ে অবশিষ্ট বেতন হিসাব করা হয়েছে।
          </div>

          {/* Signatures */}
          <div className="pt-8 flex justify-end pr-4 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 w-48 mx-auto mb-1.5"></div>
              <span className="text-slate-900 font-bold block text-sm">ম্যানেজার এর স্বাক্ষর</span>
              <span className="text-[11px] text-slate-600">চট্টগ্রাম ড্রেজার মালিক সমিতি</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
