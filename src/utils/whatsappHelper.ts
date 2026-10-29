import { Supervisor, DayAttendance, AbsentDateDetail } from '../types';
import {
  formatBengaliDate,
  toBengaliNumber,
  formatTaka,
  DEDUCTION_PER_DAY,
  MONTHLY_ALLOWED_LEAVE,
  BENGALI_MONTHS,
  BENGALI_DAYS,
} from './bengaliUtils';
import { getShiftInfoForDate } from './shiftCalculator';

export interface SupervisorCumulativeStats {
  presentDays: number;
  leaveDays: number; // অফিস অনুমোদিত ছুটি (বেতন কর্তনমুক্ত)
  regularAbsentDays: number;
  monday24hAbsentDays: number;
  effectiveAbsentDays: number;
  actualMissedDays: number;
  allowedLeaveDays: number;
  deductibleDays: number;
  totalDeduction: number;
  netSalary: number;
  absentDates: AbsentDateDetail[];
  totalDaysInMonth: number;
  recordedDaysCount: number;
}

/**
 * Calculates monthly stats for a supervisor for a given year and month.
 * If upToDay is provided, restricts to dates <= upToDay; otherwise calculates for the full month.
 */
export function computeMonthlyStatsForSupervisor(
  supervisor: Supervisor,
  attendanceData: Record<string, DayAttendance>,
  year: number,
  month: number,
  upToDay?: number
): SupervisorCumulativeStats {
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;

  // Filter dates for the month
  const monthDates = Object.keys(attendanceData)
    .filter((d) => {
      if (!d.startsWith(monthPrefix)) return false;
      if (upToDay !== undefined) {
        const dayNum = parseInt(d.split('-')[2], 10);
        if (dayNum > upToDay) return false;
      }
      const record = attendanceData[d];
      return record && (record.approvalStatus === 'approved' || !record.approvalStatus);
    })
    .sort();

  let presentDays = 0;
  let leaveDays = 0;
  let regularAbsentDays = 0;
  let monday24hAbsentDays = 0;
  const absentDates: AbsentDateDetail[] = [];

  monthDates.forEach((dateKey) => {
    const dayRecord = attendanceData[dateKey];
    const entry = dayRecord?.records?.[supervisor.id];
    const shiftInfo = getShiftInfoForDate(dateKey);
    const is24hDutyDay = shiftInfo.isGroupOn24hDuty(supervisor.group);

    if (entry) {
      if (entry.status === 'present') {
        presentDays += 1;
      } else if (entry.status === 'leave') {
        // অফিস কর্তৃক অনুমোদিত ছুটি: টাকা কাটবে না
        leaveDays += 1;
      } else if (entry.status === 'absent') {
        const parts = dateKey.split('-').map(Number);
        const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayNum = parts[2];
        const dName = BENGALI_DAYS[dObj.getDay()] || '';
        const mName = BENGALI_MONTHS[parts[1] - 1] || '';
        const formattedBengaliDate = `${toBengaliNumber(dayNum)} ${mName}, ${toBengaliNumber(parts[0])} (${dName})`;
        const shortBengaliDate = `${toBengaliNumber(dayNum)} ${mName} (${dName})`;

        if (is24hDutyDay) {
          monday24hAbsentDays += 1;
          absentDates.push({
            date: dateKey,
            dayNumber: dayNum,
            formattedBengaliDate,
            shortBengaliDate,
            dayName: dName,
            isMonday24h: true,
            remarks: entry.remarks,
            penaltyDays: 2,
          });
        } else {
          regularAbsentDays += 1;
          absentDates.push({
            date: dateKey,
            dayNumber: dayNum,
            formattedBengaliDate,
            shortBengaliDate,
            dayName: dName,
            isMonday24h: false,
            remarks: entry.remarks,
            penaltyDays: 1,
          });
        }
      }
    }
  });

  const effectiveAbsentDays = regularAbsentDays + monday24hAbsentDays * 2;
  const actualMissedDays = regularAbsentDays + monday24hAbsentDays;
  const allowedLeaveDays = Math.min(effectiveAbsentDays, MONTHLY_ALLOWED_LEAVE);
  const deductibleDays = Math.max(0, effectiveAbsentDays - MONTHLY_ALLOWED_LEAVE);
  const totalDeduction = Math.round(deductibleDays * DEDUCTION_PER_DAY * 100) / 100;
  const netSalary = Math.max(0, Math.round((supervisor.baseSalary - totalDeduction) * 100) / 100);

  return {
    presentDays,
    leaveDays,
    regularAbsentDays,
    monday24hAbsentDays,
    effectiveAbsentDays,
    actualMissedDays,
    allowedLeaveDays,
    deductibleDays,
    totalDeduction,
    netSalary,
    absentDates,
    totalDaysInMonth,
    recordedDaysCount: monthDates.length,
  };
}

export type WhatsAppReportType =
  | 'full_month'
  | 'monthly_cumulative'
  | 'monthly_summary'
  | 'deduction_audit'
  | 'daily_only';

export function generateWhatsAppReportText(
  selectedDate: string,
  supervisors: Supervisor[],
  attendanceData: Record<string, DayAttendance>,
  appUrl?: string,
  reportType: WhatsAppReportType = 'full_month',
  customYear?: number,
  customMonth?: number
): string {
  const [yearStr, monthStr, dayStr] = selectedDate.split('-');
  const year = customYear || parseInt(yearStr, 10);
  const month = customMonth || parseInt(monthStr, 10);
  const currentDayNum = parseInt(dayStr, 10);

  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const dayRecord = attendanceData[selectedDate];
  const records = dayRecord?.records || {};
  const shiftInfo = getShiftInfoForDate(selectedDate);
  const monthName = BENGALI_MONTHS[month - 1] || 'চলতি মাস';

  const groupA = supervisors.filter((s) => s.group === 'গ্রুপ-এ');
  const groupB = supervisors.filter((s) => s.group === 'গ্রুপ-বি');

  // Find all approved days in the entire month
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const recordedDaysList = Object.keys(attendanceData)
    .filter((d) => {
      if (!d.startsWith(monthPrefix)) return false;
      const r = attendanceData[d];
      return r && (r.approvalStatus === 'approved' || !recordStatusIsPending(r));
    })
    .sort();
  const totalRecordedDays = recordedDaysList.length;

  let todayPresent = 0;
  let todayAbsent = 0;
  let todayLeave = 0;
  supervisors.forEach((s) => {
    const entry = records[s.id];
    if (entry?.status === 'absent') {
      todayAbsent++;
    } else if (entry?.status === 'leave') {
      todayLeave++;
    } else {
      todayPresent++;
    }
  });

  const lines: string[] = [];

  // =========================================================================
  // 1. FULL MONTH REPORT (Primary & Default)
  // Covers the full month, with explicit listing of all absent dates for every supervisor
  // =========================================================================
  if (reportType === 'full_month' || reportType === 'monthly_cumulative') {
    lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
    lines.push(`📊 *পূর্ণাঙ্গ মাসিক হাজিরা ও বেতন কর্তন বিবরণী*`);
    lines.push(`📅 *মাস:* ${monthName} ${toBengaliNumber(year)} (মোট ${toBengaliNumber(totalDaysInMonth)} দিন)`);
    lines.push(`📋 *সংরক্ষিত অফিস হাজিরা এন্ট্রি:* মোট ${toBengaliNumber(totalRecordedDays)} দিন`);
    lines.push('──────────────────────────────────────');

    // গ্রুপ-এ
    lines.push(`🔹 *গ্রুপ-এ — সুপারভাইজারদের মাসিক হিসাব ও অনুপস্থিতির তারিখ:*`);
    lines.push('');
    groupA.forEach((s, idx) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);
      const leaveNote = stats.leaveDays > 0 ? ` | অনুমোদিত ছুটি: *${toBengaliNumber(stats.leaveDays)} দিন (বেতনযুক্ত)*` : '';

      lines.push(`${toBengaliNumber(idx + 1)}. *${s.name}* [${s.designation}]`);
      lines.push(`   📱 মোবাইল: ${s.phone}`);
      lines.push(
        `   ↳ উপস্থিত: *${toBengaliNumber(stats.presentDays)} দিন*${leaveNote} | মোট অনুপস্থিতি: *${toBengaliNumber(stats.actualMissedDays)} দিন* (কার্যকর: ${toBengaliNumber(stats.effectiveAbsentDays)} দিন)`
      );

      // List all absent dates if any
      if (stats.absentDates.length > 0) {
        lines.push(`   ↳ ❌ *অনুপস্থিতির নির্দিষ্ট তারিখসমূহ (${toBengaliNumber(stats.actualMissedDays)} দিন):*`);
        stats.absentDates.forEach((d) => {
          const dutyTypeNote = d.isMonday24h
            ? 'সোমবারে ২৪ ঘণ্টা ডিউটি ⚡ (২ দিন কর্তন হিসাব)'
            : 'সাধারণ ডিউটি (১ দিন কর্তন)';
          const remarkText = d.remarks ? ` [মন্তব্য: ${d.remarks}]` : '';
          lines.push(`      • ${d.shortBengaliDate} — ${dutyTypeNote}${remarkText}`);
        });
      } else {
        lines.push(`   ↳ ✅ *কোনো অননুমোদিত অনুপস্থিতি নেই*`);
      }

      // Deduction and Net Salary Breakdown
      if (stats.totalDeduction > 0) {
        lines.push(
          `   ↳ অনুমোদিত ফ্রি ছুটি: ১ দিন | কর্তনযোগ্য দিন: *${toBengaliNumber(stats.deductibleDays)} দিন*`
        );
        lines.push(`   ↳ মোট কর্তন: *${formatTaka(stats.totalDeduction)}*`);
      } else {
        lines.push(`   ↳ কর্তন: *০ ৳* (কোনো কর্তন নেই)`);
      }
      lines.push(`   ↳ *প্রদেয় অবশিষ্ট নিট বেতন: ${formatTaka(stats.netSalary)}*`);
      lines.push('');
    });

    lines.push('──────────────────────────────────────');

    // গ্রুপ-বি
    lines.push(`🔸 *গ্রুপ-বি — সুপারভাইজারদের মাসিক হিসাব ও অনুপস্থিতির তারিখ:*`);
    lines.push('');
    groupB.forEach((s, idx) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);
      const leaveNote = stats.leaveDays > 0 ? ` | অনুমোদিত ছুটি: *${toBengaliNumber(stats.leaveDays)} দিন (বেতনযুক্ত)*` : '';

      lines.push(`${toBengaliNumber(groupA.length + idx + 1)}. *${s.name}* [${s.designation}]`);
      lines.push(`   📱 মোবাইল: ${s.phone}`);
      lines.push(
        `   ↳ উপস্থিত: *${toBengaliNumber(stats.presentDays)} দিন*${leaveNote} | মোট অনুপস্থিতি: *${toBengaliNumber(stats.actualMissedDays)} দিন* (কার্যকর: ${toBengaliNumber(stats.effectiveAbsentDays)} দিন)`
      );

      // List all absent dates if any
      if (stats.absentDates.length > 0) {
        lines.push(`   ↳ ❌ *অনুপস্থিতির নির্দিষ্ট তারিখসমূহ (${toBengaliNumber(stats.actualMissedDays)} দিন):*`);
        stats.absentDates.forEach((d) => {
          const dutyTypeNote = d.isMonday24h
            ? 'সোমবারে ২৪ ঘণ্টা ডিউটি ⚡ (২ দিন কর্তন হিসাব)'
            : 'সাধারণ ডিউটি (১ দিন কর্তন)';
          const remarkText = d.remarks ? ` [মন্তব্য: ${d.remarks}]` : '';
          lines.push(`      • ${d.shortBengaliDate} — ${dutyTypeNote}${remarkText}`);
        });
      } else {
        lines.push(`   ↳ ✅ *কোনো অনুপস্থিতি নেই (পুরো মাস ১০০% উপস্থিত)*`);
      }

      // Deduction and Net Salary Breakdown
      if (stats.totalDeduction > 0) {
        lines.push(
          `   ↳ অনুমোদিত ফ্রি ছুটি: ১ দিন | কর্তনযোগ্য দিন: *${toBengaliNumber(stats.deductibleDays)} দিন*`
        );
        lines.push(`   ↳ মোট কর্তন: *${formatTaka(stats.totalDeduction)}*`);
      } else {
        lines.push(`   ↳ কর্তন: *০ ৳* (কোনো কর্তন নেই)`);
      }
      lines.push(`   ↳ *প্রদেয় অবশিষ্ট নিট বেতন: ${formatTaka(stats.netSalary)}*`);
      lines.push('');
    });

    lines.push('──────────────────────────────────────');
    lines.push('💼 *অফিসিয়াল বেতন কর্তন নীতিমালা:*');
    lines.push('• মাসিক মূল বেতন: ২০,০০০ টাকা');
    lines.push('• মাসিক ফ্রি ছুটি: ১ দিন (কর্তনমুক্ত)');
    lines.push(`• সাধারণ অনুপস্থিতি: দিনপ্রতি ${toBengaliNumber(DEDUCTION_PER_DAY)} টাকা কর্তন`);
    lines.push('• সোমবারে ২৪ ঘণ্টা ডিউটিতে অনুপস্থিতি: ২ দিনের কর্তন (১,৩৩৩.৩৩ টাকা)');

    if (appUrl) {
      lines.push('──────────────────────────────────────');
      lines.push(`🌐 *অনলাইন অফিস পোর্টাল:* ${appUrl}`);
    }

    return lines.join('\n');
  }

  // =========================================================================
  // 2. DEDUCTION & ABSENT DATES AUDIT REPORT
  // Lists only supervisors who missed days, along with their exact absent dates
  // =========================================================================
  if (reportType === 'deduction_audit') {
    lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
    lines.push(`🚨 *মাসিক অনুপস্থিতি ও বেতন কর্তন অডিট রিপোর্ট*`);
    lines.push(`📅 *মাস:* ${monthName} ${toBengaliNumber(year)}`);
    lines.push('──────────────────────────────────────');

    const supervisorsWithAbsent = supervisors.filter((s) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);
      return stats.actualMissedDays > 0;
    });

    if (supervisorsWithAbsent.length === 0) {
      lines.push(`🎉 *আলহামদুলিল্লাহ! ${monthName} ${toBengaliNumber(year)} মাসে কোনো সুপারভাইজার অনুপস্থিত ছিলেন না।*`);
      lines.push('সকল সুপারভাইজারের শতভাগ উপস্থিতি রয়েছে।');
    } else {
      lines.push(`⚠️ *অনুপস্থিতিপ্রাপ্ত সুপারভাইজার তালিকা (মোট ${toBengaliNumber(supervisorsWithAbsent.length)} জন):*`);
      lines.push('');
      supervisorsWithAbsent.forEach((s, idx) => {
        const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);
        lines.push(`${toBengaliNumber(idx + 1)}. *${s.name}* [${s.group}] (${s.phone})`);
        lines.push(`   ↳ উপস্থিত: *${toBengaliNumber(stats.presentDays)} দিন*`);
        lines.push(`   ↳ মোট অনুপস্থিত: *${toBengaliNumber(stats.actualMissedDays)} দিন* (কার্যকর: ${toBengaliNumber(stats.effectiveAbsentDays)} দিন)`);
        lines.push(`   ↳ ❌ *অনুপস্থিতির তারিখসমূহ:*`);
        stats.absentDates.forEach((d) => {
          const tag = d.isMonday24h ? 'সোমবারে ২৪ ঘণ্টা ডিউটি ⚡ (২ দিন কর্তন)' : 'সাধারণ ডিউটি';
          lines.push(`      • ${d.shortBengaliDate} — ${tag}${d.remarks ? ` (${d.remarks})` : ''}`);
        });
        lines.push(`   ↳ ফ্রি ছুটি: ১ দিন | কর্তনযোগ্য দিন: ${toBengaliNumber(stats.deductibleDays)} দিন`);
        lines.push(`   ↳ মোট কর্তন: *${formatTaka(stats.totalDeduction)}*`);
        lines.push(`   ↳ *অবশিষ্ট নিট বেতন: ${formatTaka(stats.netSalary)}*`);
        lines.push('');
      });
    }

    if (appUrl) {
      lines.push('──────────────────────────────────────');
      lines.push(`🌐 পোর্টাল: ${appUrl}`);
    }
    return lines.join('\n');
  }

  // =========================================================================
  // 3. MONTHLY COMPACT SUMMARY (With absent dates summary)
  // =========================================================================
  if (reportType === 'monthly_summary') {
    lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
    lines.push(`📋 *সংক্ষিপ্ত মাসিক হাজিরা সারসংক্ষেপ (${monthName} ${toBengaliNumber(year)})*`);
    lines.push('────────────────────────');

    lines.push(`🔹 *গ্রুপ-এ:*`);
    groupA.forEach((s, idx) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);
      const absentDatesStr =
        stats.absentDates.length > 0
          ? `অনুপস্থিতি (${toBengaliNumber(stats.actualMissedDays)} দিন: ${stats.absentDates.map((d) => toBengaliNumber(d.dayNumber)).join(', ')} তারিখ)`
          : '১০০% উপস্থিত';
      lines.push(
        `${toBengaliNumber(idx + 1)}. ${s.name}: ${toBengaliNumber(stats.presentDays)} দিন উপস্থিত, ${absentDatesStr}, কর্তন: ${formatTaka(stats.totalDeduction)}, নিট: ${formatTaka(stats.netSalary)}`
      );
    });

    lines.push('');
    lines.push(`🔸 *গ্রুপ-বি:*`);
    groupB.forEach((s, idx) => {
      const stats = computeMonthlyStatsForSupervisor(s, attendanceData, year, month);
      const absentDatesStr =
        stats.absentDates.length > 0
          ? `অনুপস্থিতি (${toBengaliNumber(stats.actualMissedDays)} দিন: ${stats.absentDates.map((d) => toBengaliNumber(d.dayNumber)).join(', ')} তারিখ)`
          : '১০০% উপস্থিত';
      lines.push(
        `${toBengaliNumber(groupA.length + idx + 1)}. ${s.name}: ${toBengaliNumber(stats.presentDays)} দিন উপস্থিত, ${absentDatesStr}, কর্তন: ${formatTaka(stats.totalDeduction)}, নিট: ${formatTaka(stats.netSalary)}`
      );
    });

    if (appUrl) {
      lines.push('────────────────────────');
      lines.push(`🌐 পোর্টাল: ${appUrl}`);
    }
    return lines.join('\n');
  }

  // =========================================================================
  // 4. DAILY ONLY (Single Day fallback if user chooses)
  // =========================================================================
  lines.push('🏛️ *চট্টগ্রাম ড্রেজার মালিক সমিতি*');
  lines.push(`⚓ *শুধুমাত্র আজকের দৈনিক হাজিরা রিপোর্ট*`);
  lines.push(`📅 *তারিখ:* ${formatBengaliDate(selectedDate)} (${shiftInfo.dayName})`);
  lines.push('──────────────────────────────────────');
  lines.push(
    `📊 সারসংক্ষেপ: উপস্থিত: ${toBengaliNumber(todayPresent)} জন${
      todayLeave > 0 ? ` | ছুটি (বেতনযুক্ত): ${toBengaliNumber(todayLeave)} জন` : ''
    } | অনুপস্থিত: ${toBengaliNumber(todayAbsent)} জন`
  );
  lines.push('──────────────────────────────────────');

  lines.push(`🔹 *গ্রুপ-এ:*`);
  groupA.forEach((s, idx) => {
    const entry = records[s.id];
    const status =
      entry?.status === 'absent'
        ? `❌ অনুপস্থিত${entry?.remarks ? ` [কারণ: ${entry.remarks}]` : ''}`
        : entry?.status === 'leave'
        ? '🏖️ ছুটি (অফিস অনুমোদিত - বেতন কর্তনমুক্ত)'
        : '✅ উপস্থিত';
    lines.push(`${toBengaliNumber(idx + 1)}. ${s.name} (${s.phone}) ➔ ${status}`);
  });

  lines.push('');
  lines.push(`🔸 *গ্রুপ-বি:*`);
  groupB.forEach((s, idx) => {
    const entry = records[s.id];
    const status =
      entry?.status === 'absent'
        ? `❌ অনুপস্থিত${entry?.remarks ? ` [কারণ: ${entry.remarks}]` : ''}`
        : entry?.status === 'leave'
        ? '🏖️ ছুটি (অফিস অনুমোদিত - বেতন কর্তনমুক্ত)'
        : '✅ উপস্থিত';
    lines.push(`${toBengaliNumber(groupA.length + idx + 1)}. ${s.name} (${s.phone}) ➔ ${status}`);
  });

  return lines.join('\n');
}

function recordStatusIsPending(record: DayAttendance | undefined): boolean {
  return record?.approvalStatus === 'pending';
}

export function openWhatsAppShare(text: string) {
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  try {
    const newWin = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}
