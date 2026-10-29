import React, { useState } from 'react';
import {
  HelpCircle,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Info,
  BadgePercent,
  Anchor,
  Zap,
  Sun,
  Moon,
  Coffee,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import {
  toBengaliNumber,
  formatTaka,
  DEDUCTION_PER_DAY,
  MONTHLY_ALLOWED_LEAVE,
} from '../utils/bengaliUtils';

export const RulesGuide: React.FC = () => {
  const [calcSalary, setCalcSalary] = useState<number>(20000);
  const [calcRegularAbsent, setCalcRegularAbsent] = useState<number>(1);
  const [calcMondayAbsent, setCalcMondayAbsent] = useState<number>(1);

  // Live calculator calculation
  const effectiveAbsent = calcRegularAbsent + calcMondayAbsent * 2;
  const allowedLeave = Math.min(effectiveAbsent, MONTHLY_ALLOWED_LEAVE);
  const deductibleDays = Math.max(0, effectiveAbsent - MONTHLY_ALLOWED_LEAVE);
  const totalDeduction = Math.round(deductibleDays * DEDUCTION_PER_DAY * 100) / 100;
  const netSalary = Math.max(0, Math.round((calcSalary - totalDeduction) * 100) / 100);

  return (
    <div className="space-y-6">
      {/* Association Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-900 flex items-center justify-center shrink-0">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              চট্টগ্রাম ড্রেজার মালিক সমিতি — শিফটিং, সোমবারে ২৪ ঘণ্টা ডিউটি ও বেতন কর্তন নীতিমালা
            </h2>
            <p className="text-sm text-slate-700 mt-1">
              প্রতিষ্ঠানের শৃঙ্খলা, স্বচ্ছতা ও কার্যকারিতা নিশ্চিতকরণে নির্ধারিত শিফট ও বেতন সমন্বয় নির্দেশিকা
            </p>
          </div>
        </div>
      </div>

      {/* Core Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule 1: Monday 24h Double Duty & Shift Rotation */}
        <div className="bg-white rounded-xl border border-amber-300 p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base mb-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <span>১. প্রতি সোমবার ২৪ ঘণ্টা ডাবল ডিউটি ও শিফট বদল</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            প্রতি সোমবারে সুপারভাইজারদের শিফটিং পরিবর্তন হয়। দিনের বেলায় যে গ্রুপ দায়িত্ব পালন করে, তারা সোমবার সকাল ৮টা থেকে মঙ্গলবার সকাল ৮টা পর্যন্ত টানা <strong>২৪ ঘণ্টা ডাবল ডিউটি</strong> পালন করবে।
          </p>
          <div className="mt-3 bg-amber-50 text-amber-950 px-3 py-2 rounded-lg text-xs font-semibold">
            সাপ্তাহিক শিফট পরিবর্তন প্রতি সোমবারে কার্যকর হয়।
          </div>
        </div>

        {/* Rule 2: Monday Absence Penalty = 2 Days Salary Deduction */}
        <div className="bg-white rounded-xl border border-rose-300 p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 text-rose-800 font-bold text-base mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>২. সোমবারে অনুপস্থিতির জন্য ২ দিনের বেতন কর্তন</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            সোমবারে যাদের ২৪ ঘণ্টা ডিউটি থাকবে, তাদের কেউ অনুপস্থিত থাকলে সেদিন দায়িত্বে অনুপস্থিত থাকার কারণে <strong>২ দিনের বেতন কর্তন (৳ ১,৩৩৩.৩৩)</strong> হিসাব করা হবে। বেতন রশিদ ও শিটে এটি স্পষ্টভাবে উল্লেখ থাকবে।
          </p>
          <div className="mt-3 bg-rose-50 text-rose-900 px-3 py-2 rounded-lg text-xs font-semibold">
            সোমবারের ২৪ ঘণ্টার ১টি অনুপস্থিতি = ২ দিনের কার্যকর অনুপস্থিতি হিসাব।
          </div>
        </div>

        {/* Rule 3: Monday 24h Rest Group */}
        <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-base mb-2">
            <Coffee className="w-5 h-5 text-emerald-600" />
            <span>৩. অপর গ্রুপের ২৪ ঘণ্টা শিফটিং ছুটি (সবেতন)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            যে গ্রুপ সোমবারে ২৪ ঘণ্টা ডিউটিতে থাকে না, তারা সোমবার ২৪ ঘণ্টা শিফটিং ছুটি/বিশ্রাম পায়। সে দিন তারা <strong>উপস্থিত আছে বলে গণ্য হবে এবং সম্পূর্ণ বেতন পাবে</strong>। এটির সাথে মাসিক ১ দিন নির্ধারিত ছুটির কোনো সম্পর্ক নেই।
          </p>
          <div className="mt-3 bg-emerald-50 text-emerald-900 px-3 py-2 rounded-lg text-xs font-semibold">
            সোমবারে শিফটিং ছুটি সম্পূর্ণ সবেতন এবং স্বাভাবিক উপস্থিতির মতো গণ্য।
          </div>
        </div>

        {/* Rule 4: Monthly 1 Day Free Leave & Net Calculation */}
        <div className="bg-white rounded-xl border border-cyan-200 p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 text-cyan-900 font-bold text-base mb-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-700" />
            <span>৪. মাসিক ১ দিন প্রাপ্ত ছুটি বাদ দিয়ে অবশিষ্ট বেতন</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            প্রত্যেক সুপারভাইজার প্রতি মাসে মোট অনুপস্থিতি থেকে <strong>১ দিন প্রাপ্ত ফ্রি ছুটি</strong> ভোগ করতে পারবেন। মাসের মোট অনুপস্থিতি থেকে এই ১ দিন বাদ দিয়ে অবশিষ্ট কার্যকর অনুপস্থিতির জন্য দিনপ্রতি <strong>৬৬৬.৬৭ টাকা</strong> কর্তন করে অবশিষ্ট বেতন প্রদান করা হবে।
          </p>
          <div className="mt-3 bg-cyan-50 text-cyan-950 px-3 py-2 rounded-lg text-xs font-semibold">
            প্রদেয় বেতন = ২০,০০০ - [(মোট কার্যকর অনুপস্থিতি - ১) × ৬৬৬.৬৭ ৳]।
          </div>
        </div>

        {/* Rule 5: Office Discretionary Leave (Paid / No Deduction) */}
        <div className="bg-white rounded-xl border border-teal-300 p-5 shadow-2xs md:col-span-2">
          <div className="flex items-center gap-2.5 text-teal-900 font-bold text-base mb-2">
            <Coffee className="w-5 h-5 text-teal-600" />
            <span>৫. অফিস বিবেচনাধীন ছুটি (টাকা কাটবে না, সম্পূর্ণ বেতন প্রাপ্য)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            ফিল্ড সুপারভাইজাররা কেবল &apos;উপস্থিত&apos; বা &apos;অনুপস্থিত&apos; তথ্য দিতে পারেন এবং অনুপস্থিত থাকলে মন্তব্যের ঘরে কারণ উল্লেখ করা বাধ্যতামূলক। অফিস কর্তৃপক্ষ এই অনুপস্থিতির কারণ পর্যালোচনা করে যদি তা যৌক্তিক ও বিবেচনাযোগ্য মনে করেন, তবে অফিস প্যানেল থেকে উক্ত দিনের হাজিরাকে <strong>&apos;ছুটি (বেতনযুক্ত)&apos;</strong> হিসেবে অনুমোদন দিতে পারবেন। অফিস কর্তৃক অনুমোদিত ছুটির জন্য <strong>কোনো বেতন কর্তন করা হবে না (বেতন ধরা হবে)</strong>।
          </p>
          <div className="mt-3 bg-teal-50 text-teal-950 px-3 py-2 rounded-lg text-xs font-semibold">
            ছুটি মঞ্জুরির ক্ষমতা কেবল অফিস কর্তৃপক্ষের এবং অনুমোদিত ছুটির সম্পূর্ণ বেতন প্রদান করা হয়।
          </div>
        </div>
      </div>

      {/* Rotation Calendar & Example Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-cyan-700" />
          <h3 className="font-bold text-slate-900 text-base">
            শিফটিং রোটেশন ও ক্যালেন্ডার সময়রেখা (রেফারেন্স: ১ সেপ্টেম্বর ২০২৬)
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          • <strong>রেফারেন্স শুরুর দিন:</strong> ১ সেপ্টেম্বর ২০২৬ (মঙ্গলবার) — দিনের বেলায় ডিউটি পালন করেছিল <strong>গ্রুপ-বি</strong> এবং রাতে ডিউটি ছিল <strong>গ্রুপ-এ</strong> এর।
          <br />
          • <strong>প্রথম সোমবার (৭ সেপ্টেম্বর):</strong> গ্রুপ-বি টানা ২৪ ঘণ্টা ডাবল ডিউটি পালন করে এবং গ্রুপ-এ পায় ২৪ ঘণ্টা শিফটিং ছুটি।
          <br />
          • <strong>পরের মঙ্গলবার (৮ সেপ্টেম্বর):</strong> গ্রুপ-এ দিনের দায়িত্ব নেয় এবং গ্রুপ-বি রাতের দায়িত্ব নেয়। পরবর্তী সোমবারে গ্রুপ-এ ২৪ ঘণ্টা ডিউটি করবে।
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-cyan-950 block text-sm mb-1">
              ☀️ সাধারণ দিনসমূহ (মঙ্গলবার - রবিবার):
            </span>
            <span>দিনের শিফট: সকাল ৮টা থেকে রাত ৮টা (১২ ঘণ্টা)</span>
            <br />
            <span>রাতের শিফট: রাত ৮টা থেকে সকাল ৮টা (১২ ঘণ্টা)</span>
            <br />
            <span className="text-slate-600">সাধারণ অনুপস্থিতিতে ১ দিনের বেতন কর্তন (৳ ৬৬৬.৬৭)</span>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-300">
            <span className="font-bold text-amber-950 block text-sm mb-1">
              ⚡ প্রতি সোমবার (২৪ ঘণ্টা ডাবল ডিউটি):
            </span>
            <span>সময়: সোমবার সকাল ৮টা থেকে মঙ্গলবার সকাল ৮টা (টানা ২৪ ঘণ্টা)</span>
            <br />
            <span className="text-rose-700 font-bold">
              অনুপস্থিত থাকলে ২ দিনের বেতন কর্তন হিসাব (৳ ১,৩৩৩.৩৩)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Calculator */}
      <div className="bg-white rounded-xl border border-cyan-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b pb-3">
          <Calculator className="w-5 h-5 text-cyan-700" />
          <h3 className="font-bold text-slate-900 text-base">
            ইন্টারেক্টিভ বেতন কর্তন সিমুলেটর (পরীক্ষা করুন)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div>
              <label htmlFor="input-calc-salary" className="block text-xs font-semibold text-slate-700 mb-1">
                মাসিক মূল বেতন (টাকা):
              </label>
              <input
                id="input-calc-salary"
                type="number"
                step="500"
                value={calcSalary}
                onChange={(e) => setCalcSalary(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="input-calc-regular" className="block text-xs font-semibold text-slate-700 mb-1">
                সাধারণ দিনগুলোতে অনুপস্থিতি (দিন):
              </label>
              <input
                id="input-calc-regular"
                type="number"
                min="0"
                max="25"
                value={calcRegularAbsent}
                onChange={(e) => setCalcRegularAbsent(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="input-calc-monday" className="block text-xs font-semibold text-rose-800 mb-1">
                সোমবারের ২৪ ঘণ্টা ডিউটিতে অনুপস্থিতি (দিন — দিনপ্রতি ২ দিন কর্তন হিসাব):
              </label>
              <input
                id="input-calc-monday"
                type="number"
                min="0"
                max="5"
                value={calcMondayAbsent}
                onChange={(e) => setCalcMondayAbsent(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-rose-300 bg-rose-50/30 rounded-lg focus:ring-2 focus:ring-rose-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              গণনার ফলাফল ও অবশিষ্ট বেতন:
            </h4>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">মূল মাসিক বেতন:</span>
                <span className="font-semibold text-slate-900">{formatTaka(calcSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">সাধারণ অনুপস্থিতি:</span>
                <span className="font-medium text-slate-800">{toBengaliNumber(calcRegularAbsent)} দিন</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-700 font-medium">সোমবারের ২৪ ঘণ্টা অনুপস্থিতি:</span>
                <span className="font-bold text-rose-700">
                  {toBengaliNumber(calcMondayAbsent)} দিন (হিসাব = {toBengaliNumber(calcMondayAbsent * 2)} দিন)
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-800 font-semibold">মোট কার্যকর অনুপস্থিতি:</span>
                <span className="font-bold text-slate-900">{toBengaliNumber(effectiveAbsent)} দিন</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>বাদ: মাসিক ১ দিন ফ্রি ছুটি:</span>
                <span className="font-semibold">-{toBengaliNumber(allowedLeave)} দিন</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span className="font-semibold">নিট কর্তনযোগ্য দিন:</span>
                <span className="font-bold">{toBengaliNumber(deductibleDays)} দিন</span>
              </div>
              <div className="flex justify-between text-rose-700 border-t pt-1 font-semibold">
                <span>মোট কর্তন ({toBengaliNumber(deductibleDays)} × {toBengaliNumber(DEDUCTION_PER_DAY)} ৳):</span>
                <span>-{formatTaka(totalDeduction)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-slate-300 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">প্রদেয় অবশিষ্ট নিট বেতন:</span>
              <span className="text-lg font-extrabold text-emerald-800">
                {formatTaka(netSalary)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
