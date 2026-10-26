import { Supervisor, DayAttendance, MonthlySalaryReport, AbsentDateDetail } from '../types';
import {
  DEDUCTION_PER_DAY,
  MONTHLY_ALLOWED_LEAVE,
  BENGALI_MONTHS,
  BENGALI_DAYS,
  toBengaliNumber,
} from './bengaliUtils';
import { getShiftInfoForDate } from './shiftCalculator';

export function calculateMonthlyReport(
  supervisors: Supervisor[],
  attendanceData: Record<string, DayAttendance>,
  year: number,
  month: number
): MonthlySalaryReport[] {
  // Days in month
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;

  // Filter day entries for this year and month that are officially approved by office
  const monthDates = Object.keys(attendanceData).filter((d) => {
    if (!d.startsWith(monthPrefix)) return false;
    const record = attendanceData[d];
    // Must be approved by office
    return record && (record.approvalStatus === 'approved' || !record.approvalStatus);
  }).sort();
  const daysRecorded = monthDates.length;

  return supervisors.map((supervisor) => {
    let presentDays = 0;
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
        } else if (entry.status === 'absent' || entry.status === 'leave') {
          const parts = dateKey.split('-').map(Number);
          const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
          const dayNum = parts[2];
          const dName = BENGALI_DAYS[dObj.getDay()] || '';
          const mName = BENGALI_MONTHS[parts[1] - 1] || '';
          const formattedBengaliDate = `${toBengaliNumber(dayNum)} ${mName}, ${toBengaliNumber(parts[0])} (${dName})`;
          const shortBengaliDate = `${toBengaliNumber(dayNum)} ${mName} (${dName})`;

          // যদি সোমবারে এই সুপারভাইজারের ২৪ ঘণ্টা ডিউটি ছিল এবং তিনি অনুপস্থিত থাকেন:
          // ২ দিনের বেতন কর্তন প্রযোজ্য
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

    // মোট কার্যকর অনুপস্থিতির দিন সংখ্যা (সোমবারের ২৪ ঘণ্টার ১টি অনুপস্থিতি = ২ দিন কর্তন হিসাব)
    const effectiveAbsentDays = regularAbsentDays + monday24hAbsentDays * 2;
    const actualMissedDays = regularAbsentDays + monday24hAbsentDays;

    // মাসিক নির্ধারিত অনুমোদিত ছুটি: ১ দিন ফ্রি (কর্তনমুক্ত)
    const allowedLeaveDays = Math.min(effectiveAbsentDays, MONTHLY_ALLOWED_LEAVE);
    // নিট বেতন কর্তনযোগ্য দিন = মোট কার্যকর অনুপস্থিতি থেকে ১ দিন বাদ
    const deductibleDays = Math.max(0, effectiveAbsentDays - MONTHLY_ALLOWED_LEAVE);

    // মোট কর্তন: দিনপ্রতি ৬৬৬.৬৭ টাকা
    const totalDeduction = Math.round(deductibleDays * DEDUCTION_PER_DAY * 100) / 100;
    // প্রদেয় অবশিষ্ট বেতন
    const netSalary = Math.max(0, Math.round((supervisor.baseSalary - totalDeduction) * 100) / 100);

    return {
      supervisor,
      totalDaysInMonth,
      daysRecorded,
      presentDays,
      regularAbsentDays,
      monday24hAbsentDays,
      effectiveAbsentDays,
      actualMissedDays,
      allowedLeaveDays,
      deductibleDays,
      deductionRate: DEDUCTION_PER_DAY,
      totalDeduction,
      netSalary,
      absentDates,
    };
  });
}

