import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  CheckCheck,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileCheck2,
  MessageCircle,
  ShieldCheck,
  Lock,
  Zap,
  Sun,
  Moon,
  Coffee,
  AlertTriangle,
  User,
  Phone,
  Sparkles,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import {
  Supervisor,
  DayAttendance,
  AttendanceEntry,
  AttendanceStatus,
  PendingAttendanceSubmission,
} from '../types';
import {
  formatBengaliDate,
  toBengaliNumber,
  getTodayDateString,
  DEDUCTION_PER_DAY,
} from '../utils/bengaliUtils';
import { getShiftInfoForDate } from '../utils/shiftCalculator';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface DailyAttendanceFormProps {
  supervisors: Supervisor[];
  attendanceData: Record<string, DayAttendance>;
  onSaveAttendance: (date: string, dayAttendance: DayAttendance) => void;
  onSubmitForApproval: (
    submission: Omit<PendingAttendanceSubmission, 'id' | 'status' | 'submittedAt'>
  ) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isOfficeAuthenticated: boolean;
  onOpenOfficeLogin: () => void;
  onVerifyOfficePin?: (pin: string) => boolean;
  onLogoutOffice?: () => void;
  pendingCount?: number;
  loggedInSupervisor?: Supervisor | null;
  onOpenSupervisorLogin?: () => void;
  onLogoutSupervisor?: () => void;
  onSupervisorLogin?: (supervisor: Supervisor) => void;
  onUpdateSupervisorPassword?: (supervisorId: string, newPassword: string) => Promise<void> | void;
}

export const DailyAttendanceForm: React.FC<DailyAttendanceFormProps> = ({
  supervisors,
  attendanceData,
  onSaveAttendance,
  onSubmitForApproval,
  selectedDate,
  setSelectedDate,
  isOfficeAuthenticated,
  onOpenOfficeLogin,
  onVerifyOfficePin,
  onLogoutOffice,
  pendingCount = 0,
  loggedInSupervisor = null,
  onOpenSupervisorLogin,
  onLogoutSupervisor,
  onSupervisorLogin,
  onUpdateSupervisorPassword,
}) => {
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [selectedSupervisorSubmitterId, setSelectedSupervisorSubmitterId] = useState<string>('');
  const [submittedBy, setSubmittedBy] = useState<string>('');
  const [supervisorPhone, setSupervisorPhone] = useState<string>('');
  const [dayNotes, setDayNotes] = useState<string>('');
  const [supervisorSubmittedSuccess, setSupervisorSubmittedSuccess] = useState<boolean>(false);
  const [officeSavedSuccess, setOfficeSavedSuccess] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Submission Notice & Form advance state
  interface LastSubmissionRecord {
    submittedDate: string;
    nextDate: string;
    submittedBy: string;
    mode: 'office' | 'supervisor';
    recordCount: number;
    absentCount: number;
    time: string;
  }
  const [lastSubmissionNotice, setLastSubmissionNotice] = useState<LastSubmissionRecord | null>(null);
  const [formValidationError, setFormValidationError] = useState<string>('');

  // Mode: Office Authority or Supervisor Submitter
  const [roleMode, setRoleMode] = useState<'office' | 'supervisor'>(
    isOfficeAuthenticated ? 'office' : loggedInSupervisor ? 'supervisor' : 'supervisor'
  );
  const [inlinePin, setInlinePin] = useState<string>('');
  const [inlinePinError, setInlinePinError] = useState<string>('');

  // Inline supervisor login state
  const [inlineSupervisorPassword, setInlineSupervisorPassword] = useState<string>('');
  const [inlineSupervisorNewPassword, setInlineSupervisorNewPassword] = useState<string>('');
  const [inlineSupervisorConfirmPassword, setInlineSupervisorConfirmPassword] = useState<string>('');
  const [showInlinePassword, setShowInlinePassword] = useState<boolean>(false);
  const [inlineSupervisorError, setInlineSupervisorError] = useState<string>('');
  const [inlineSupervisorSuccess, setInlineSupervisorSuccess] = useState<string>('');

  // Submit Password Verification Modal state
  const [showSubmitPasswordModal, setShowSubmitPasswordModal] = useState<boolean>(false);
  const [modalSupervisorId, setModalSupervisorId] = useState<string>('');
  const [modalPassword, setModalPassword] = useState<string>('');
  const [modalNewPassword, setModalNewPassword] = useState<string>('');
  const [modalConfirmPassword, setModalConfirmPassword] = useState<string>('');
  const [showModalPassword, setShowModalPassword] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');
  const [isModalSubmitting, setIsModalSubmitting] = useState<boolean>(false);

  // Shift & Rotation information for selectedDate
  const shiftInfo = getShiftInfoForDate(selectedDate);

  // Sync with Office Authentication & Logged in Supervisor state
  useEffect(() => {
    if (isOfficeAuthenticated) {
      setRoleMode('office');
      setSubmittedBy('অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)');
      setSupervisorPhone('অফিস নিয়ন্ত্রণ কক্ষ (০১৮১২-১০০২০১)');
    } else if (loggedInSupervisor) {
      setRoleMode('supervisor');
      setSubmittedBy(`${loggedInSupervisor.name} (সুপারভাইজার)`);
      setSupervisorPhone(loggedInSupervisor.phone);
      setSelectedSupervisorSubmitterId(loggedInSupervisor.id);
    }
  }, [isOfficeAuthenticated, loggedInSupervisor]);

  // Load existing records or initialize defaults for selected date
  useEffect(() => {
    const existing = attendanceData[selectedDate];
    const initialEntries: Record<string, AttendanceEntry> = {};

    supervisors.forEach((sup) => {
      if (existing?.records?.[sup.id]) {
        initialEntries[sup.id] = { ...existing.records[sup.id] };
      } else {
        initialEntries[sup.id] = {
          supervisorId: sup.id,
          status: 'present',
          remarks: '',
          isMonday24hDuty: shiftInfo.isGroupOn24hDuty(sup.group),
        };
      }
    });

    setEntries(initialEntries);

    if (existing?.submittedBy) {
      setSubmittedBy(existing.submittedBy);
    } else if (isOfficeAuthenticated || roleMode === 'office') {
      setSubmittedBy('অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)');
      setSupervisorPhone('অফিস নিয়ন্ত্রণ কক্ষ (০১৮১২-১০০২০১)');
    } else if (loggedInSupervisor) {
      setSubmittedBy(`${loggedInSupervisor.name} (সুপারভাইজার)`);
      setSupervisorPhone(loggedInSupervisor.phone);
    } else {
      setSubmittedBy((prev) => prev || '');
    }

    setDayNotes(existing?.notes || '');
    setSupervisorSubmittedSuccess(false);
    setOfficeSavedSuccess(false);
  }, [selectedDate, attendanceData, supervisors, isOfficeAuthenticated, roleMode]);

  // Quick inline PIN / Password verification
  const handleInlineLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInlinePinError('');
    if (!inlinePin.trim()) {
      setInlinePinError('দয়া করে অফিস পাসওয়ার্ড বা পিন লিখুন।');
      return;
    }
    if (onVerifyOfficePin) {
      const ok = onVerifyOfficePin(inlinePin.trim());
      if (ok) {
        setInlinePin('');
        setInlinePinError('');
        setRoleMode('office');
        setSubmittedBy('অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)');
        setSupervisorPhone('অফিস নিয়ন্ত্রণ কক্ষ (০১৮১২-১০০২০১)');
      } else {
        setInlinePinError('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন (ডিফল্ট: 1234)।');
      }
    } else {
      onOpenOfficeLogin();
    }
  };

  // Whether this date has already been saved/approved in official storage
  const isExistingSaved = !!attendanceData[selectedDate];

  // When supervisor is selected from dropdown, autofill name and phone
  const handleSelectSupervisorDropdown = (supId: string) => {
    setSelectedSupervisorSubmitterId(supId);
    setInlineSupervisorPassword('');
    setInlineSupervisorNewPassword('');
    setInlineSupervisorConfirmPassword('');
    setInlineSupervisorError('');
    setInlineSupervisorSuccess('');
    if (!supId) return;
    const matched = supervisors.find((s) => s.id === supId);
    if (matched) {
      setSubmittedBy(matched.name);
      setSupervisorPhone(matched.phone);
    }
  };

  // Inline Supervisor Login and password validation
  const handleInlineSupervisorLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInlineSupervisorError('');
    setInlineSupervisorSuccess('');

    const targetSup = supervisors.find((s) => s.id === selectedSupervisorSubmitterId);
    if (!targetSup) {
      setInlineSupervisorError('⚠️ দয়া করে আগে তালিকা থেকে আপনার নাম নির্বাচন করুন।');
      return;
    }

    // Case 1: First-time password set
    if (!targetSup.password || targetSup.password.trim() === '') {
      if (!inlineSupervisorNewPassword.trim()) {
        setInlineSupervisorError('⚠️ দয়া করে একটি নতুন পাসওয়ার্ড লিখুন।');
        return;
      }
      if (inlineSupervisorNewPassword.trim().length < 4) {
        setInlineSupervisorError('⚠️ পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
        return;
      }
      if (inlineSupervisorNewPassword !== inlineSupervisorConfirmPassword) {
        setInlineSupervisorError('⚠️ নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না!');
        return;
      }

      if (onUpdateSupervisorPassword) {
        await onUpdateSupervisorPassword(targetSup.id, inlineSupervisorNewPassword.trim());
      }
      const updatedSup = { ...targetSup, password: inlineSupervisorNewPassword.trim(), passwordSet: true };
      if (onSupervisorLogin) {
        onSupervisorLogin(updatedSup);
      }
      setInlineSupervisorSuccess('পাসওয়ার্ড সফলভাবে সংরক্ষিত এবং লগইন হয়েছে!');
      return;
    }

    // Case 2: Existing password verify
    if (!inlineSupervisorPassword.trim()) {
      setInlineSupervisorError('⚠️ দয়া করে আপনার পাসওয়ার্ড লিখুন।');
      return;
    }

    if (inlineSupervisorPassword.trim() === targetSup.password.trim()) {
      if (onSupervisorLogin) {
        onSupervisorLogin(targetSup);
      }
      setInlineSupervisorSuccess('সফলভাবে লগইন হয়েছে!');
      setInlineSupervisorPassword('');
    } else {
      setInlineSupervisorError('❌ ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।');
    }
  };

  // Handle individual status change
  const handleStatusChange = (supervisorId: string, status: AttendanceStatus) => {
    if (status === 'leave' && !isOfficeAuthenticated && roleMode !== 'office') {
      alert('🔒 "ছুটি" মঞ্জুর করার ক্ষমতা শুধুমাত্র অফিস কর্তৃপক্ষের।\nমাঠ পর্যায়ের সুপারভাইজার অনুপস্থিত থাকলে "অনুপস্থিত" সিলেক্ট করে কারণ উল্লেখ করুন। অফিস কর্তৃপক্ষ কারণ যাচাই করে ছুটি বিবেচনা করবে এবং বেতন প্রদান করবে।');
      return;
    }
    const sup = supervisors.find((s) => s.id === supervisorId);
    const is24h = sup ? shiftInfo.isGroupOn24hDuty(sup.group) : false;

    setEntries((prev) => ({
      ...prev,
      [supervisorId]: {
        ...(prev[supervisorId] || { supervisorId }),
        status,
        isMonday24hDuty: is24h,
      },
    }));
  };

  // Handle remarks change - FREELY ACCESSIBLE TO ALL
  const handleRemarksChange = (supervisorId: string, remarks: string) => {
    setEntries((prev) => ({
      ...prev,
      [supervisorId]: {
        ...(prev[supervisorId] || { supervisorId, status: 'present' }),
        remarks,
      },
    }));
  };

  // Bulk actions - FREELY ACCESSIBLE TO ALL
  const markAllStatus = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceEntry> = {};
    supervisors.forEach((sup) => {
      updated[sup.id] = {
        supervisorId: sup.id,
        status,
        remarks: entries[sup.id]?.remarks || '',
        isMonday24hDuty: shiftInfo.isGroupOn24hDuty(sup.group),
      };
    });
    setEntries(updated);
  };

  const markGroupStatus = (group: 'গ্রুপ-এ' | 'গ্রুপ-বি', status: AttendanceStatus) => {
    const updated: Record<string, AttendanceEntry> = { ...entries };
    supervisors
      .filter((s) => s.group === group)
      .forEach((sup) => {
        updated[sup.id] = {
          ...(updated[sup.id] || { supervisorId: sup.id }),
          status,
          isMonday24hDuty: shiftInfo.isGroupOn24hDuty(sup.group),
        };
      });
    setEntries(updated);
  };

  // Date Navigation
  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString());
  };

  // Direct Jump to September 01 as requested by user
  const handleJumpToSeptemberFirst = () => {
    const year = selectedDate.split('-')[0] || new Date().getFullYear().toString();
    setSelectedDate(`${year}-09-01`);
  };

  // Helper to calculate the next calendar date (YYYY-MM-DD)
  const getNextCalendarDate = (dateStr: string): string => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      dateObj.setDate(dateObj.getDate() + 1);
      const nextY = dateObj.getFullYear();
      const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const nextD = String(dateObj.getDate()).padStart(2, '0');
      return `${nextY}-${nextM}-${nextD}`;
    } catch {
      return dateStr;
    }
  };

  // Reset current form entries to fresh blank state
  const handleResetToFreshForm = () => {
    const initialEntries: Record<string, AttendanceEntry> = {};
    supervisors.forEach((sup) => {
      initialEntries[sup.id] = {
        supervisorId: sup.id,
        status: 'present',
        remarks: '',
        isMonday24hDuty: shiftInfo.isGroupOn24hDuty(sup.group),
      };
    });
    setEntries(initialEntries);
    setDayNotes('');
    setFormValidationError('');
  };

  // Helper to validate mandatory absence remarks
  const validateAbsenceRemarks = (): boolean => {
    const missingRemarkSupervisors: string[] = [];
    supervisors.forEach((sup) => {
      const ent = entries[sup.id];
      if (ent && ent.status === 'absent' && (!ent.remarks || ent.remarks.trim() === '')) {
        missingRemarkSupervisors.push(sup.name);
      }
    });

    if (missingRemarkSupervisors.length > 0) {
      setFormValidationError(
        `⚠️ অনুপস্থিতি চিহ্নিত করার পর মন্তব্যের ঘরে কারণ লেখা বাধ্যতামূলক! অনুগ্রহ করে "${missingRemarkSupervisors.join('", "')}"-এর অনুপস্থিতির কারণ লিখুন।`
      );
      const firstMissing = supervisors.find(
        (s) => entries[s.id]?.status === 'absent' && !entries[s.id]?.remarks?.trim()
      );
      if (firstMissing) {
        const el = document.getElementById(`input-remarks-${firstMissing.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
      return false;
    }
    return true;
  };

  // Core function: Submit attendance for official approval under authenticated supervisor
  const doSubmitForApproval = (supervisorObj: Supervisor) => {
    if (!validateAbsenceRemarks()) {
      return false;
    }

    const prevDate = selectedDate;
    const nextDate = getNextCalendarDate(prevDate);
    const countAbsent = (Object.values(entries) as AttendanceEntry[]).filter((item) => item.status === 'absent').length;

    onSubmitForApproval({
      date: prevDate,
      submittedBy: `${supervisorObj.name} (সুপারভাইজার)`,
      supervisorPhone: supervisorObj.phone,
      records: entries,
      notes: dayNotes.trim(),
    });

    setLastSubmissionNotice({
      submittedDate: prevDate,
      nextDate: nextDate,
      submittedBy: `${supervisorObj.name} (সুপারভাইজার)`,
      mode: 'supervisor',
      recordCount: Object.keys(entries).length,
      absentCount: countAbsent,
      time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    });

    setDayNotes('');
    setSupervisorSubmittedSuccess(true);
    setSelectedDate(nextDate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  };

  // 1. Action: Supervisor Submits for Approval (Strict Login & Password Enforced)
  const handleSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError('');

    // If already authenticated as supervisor
    if (loggedInSupervisor) {
      doSubmitForApproval(loggedInSupervisor);
      return;
    }

    // If not logged in yet, check chosen supervisor & inline password
    const chosenSup = supervisors.find((s) => s.id === selectedSupervisorSubmitterId);
    if (chosenSup) {
      // If supervisor already has a password and inline password was typed:
      if (chosenSup.password && inlineSupervisorPassword.trim()) {
        if (inlineSupervisorPassword.trim() === chosenSup.password.trim()) {
          if (onSupervisorLogin) onSupervisorLogin(chosenSup);
          setInlineSupervisorPassword('');
          setInlineSupervisorError('');
          doSubmitForApproval(chosenSup);
          return;
        } else {
          setInlineSupervisorError('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।');
          setFormValidationError(`❌ ভুল পাসওয়ার্ড! "${chosenSup.name}"-এর জন্য সঠিক পাসওয়ার্ড দিন। পাসওয়ার্ড ছাড়া হাজিরা জমা হবে না।`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      // Password not entered inline yet -> Open prompt modal for password
      setModalSupervisorId(chosenSup.id);
      setModalError('');
      setModalPassword('');
      setShowSubmitPasswordModal(true);
      return;
    }

    // No supervisor chosen -> Open modal to pick and enter password
    setFormValidationError('🔒 হাজিরা জমা দিতে অনুগ্রহ করে আপনি কোন সুপারভাইজার তা নির্বাচন করুন এবং পাসওয়ার্ড দিন।');
    setModalSupervisorId(supervisors[0]?.id || '');
    setModalError('');
    setModalPassword('');
    setShowSubmitPasswordModal(true);
  };

  // Submit Password Verification Modal Handler
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const supId = modalSupervisorId || selectedSupervisorSubmitterId;
    const targetSup = supervisors.find((s) => s.id === supId);
    if (!targetSup) {
      setModalError('দয়া করে একজন সুপারভাইজার নির্বাচন করুন।');
      return;
    }

    // Case 1: First-time password set
    if (!targetSup.password || targetSup.password.trim() === '') {
      if (!modalNewPassword.trim()) {
        setModalError('দয়া করে নতুন পাসওয়ার্ড লিখুন।');
        return;
      }
      if (modalNewPassword.trim().length < 4) {
        setModalError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
        return;
      }
      if (modalNewPassword !== modalConfirmPassword) {
        setModalError('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না!');
        return;
      }

      setIsModalSubmitting(true);
      try {
        if (onUpdateSupervisorPassword) {
          await onUpdateSupervisorPassword(targetSup.id, modalNewPassword.trim());
        }
        const updatedSup = { ...targetSup, password: modalNewPassword.trim(), passwordSet: true };
        if (onSupervisorLogin) {
          onSupervisorLogin(updatedSup);
        }
        setShowSubmitPasswordModal(false);
        setModalPassword('');
        setModalNewPassword('');
        setModalConfirmPassword('');
        doSubmitForApproval(updatedSup);
      } catch (err) {
        setModalError('পাসওয়ার্ড সেট করতে ত্রুটি হয়েছে।');
      } finally {
        setIsModalSubmitting(false);
      }
      return;
    }

    // Case 2: Existing password verify
    if (!modalPassword.trim()) {
      setModalError('দয়া করে আপনার গোপন পাসওয়ার্ড লিখুন।');
      return;
    }

    if (modalPassword.trim() === targetSup.password.trim()) {
      if (onSupervisorLogin) {
        onSupervisorLogin(targetSup);
      }
      setShowSubmitPasswordModal(false);
      setModalPassword('');
      doSubmitForApproval(targetSup);
    } else {
      setModalError('❌ ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড ছাড়া হাজিরা অনুমোদনের জন্য দাখিল করা যাবে না।');
    }
  };

  // 2. Action: Office Authority Direct Save
  const handleDirectOfficeSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormValidationError('');

    if (!validateAbsenceRemarks()) {
      return;
    }

    const name = submittedBy.trim() || 'অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)';
    const phone = supervisorPhone.trim() || 'অফিস নিয়ন্ত্রণ কক্ষ (০১৮১২-১০০২০১)';

    const prevDate = selectedDate;
    const nextDate = getNextCalendarDate(prevDate);
    const countAbsent = (Object.values(entries) as AttendanceEntry[]).filter((item) => item.status === 'absent').length;

    const dayRecord: DayAttendance = {
      date: prevDate,
      records: entries,
      submittedAt: new Date().toISOString(),
      submittedBy: name,
      notes: dayNotes.trim(),
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: 'অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)',
    };

    onSaveAttendance(prevDate, dayRecord);
    setOfficeSavedSuccess(true);

    setLastSubmissionNotice({
      submittedDate: prevDate,
      nextDate: nextDate,
      submittedBy: name,
      mode: 'office',
      recordCount: Object.keys(entries).length,
      absentCount: countAbsent,
      time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    });

    setDayNotes('');

    // Automatically transition to next date: the filled-up form clears and fresh form appears!
    setSelectedDate(nextDate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Unified Form Submit Handler based on mode / authentication
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError('');

    if (isOfficeAuthenticated) {
      handleDirectOfficeSave(e);
      return;
    }

    // Supervisor submission (requires password verification)
    handleSupervisorSubmit(e);
  };

  // Stats for this date
  const entryList = Object.values(entries) as AttendanceEntry[];
  const presentCount = entryList.filter((e) => e.status === 'present').length;
  const absentCount = entryList.filter((e) => e.status === 'absent').length;
  const leaveCount = entryList.filter((e) => e.status === 'leave').length;

  // Split supervisors into groups
  const groupA = supervisors.filter((s) => s.group === 'গ্রুপ-এ');
  const groupB = supervisors.filter((s) => s.group === 'গ্রুপ-বি');

  // Helper row component for a supervisor
  const renderSupervisorRow = (sup: Supervisor, index: number) => {
    const entry = entries[sup.id] || { supervisorId: sup.id, status: 'present' };
    const isPresent = entry.status === 'present';
    const isAbsent = entry.status === 'absent';
    const isLeave = entry.status === 'leave';

    // Monday 24h duty indicators
    const is24hDuty = shiftInfo.isGroupOn24hDuty(sup.group);

    return (
      <div
        key={sup.id}
        id={`supervisor-card-${sup.id}`}
        className={`bg-white rounded-xl border transition-all p-4 sm:p-5 shadow-2xs ${
          isAbsent
            ? is24hDuty
              ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-400'
              : 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200'
            : isPresent
            ? 'border-slate-200 hover:border-cyan-300'
            : 'border-amber-200 bg-amber-50/20'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Supervisor Identity & Group */}
          <div className="flex items-start gap-3.5 min-w-64">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                isPresent
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : isAbsent
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {toBengaliNumber(index + 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {sup.name}
                </h3>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    sup.group === 'গ্রুপ-এ'
                      ? 'bg-cyan-50 text-cyan-900 border-cyan-200'
                      : 'bg-blue-50 text-blue-900 border-blue-200'
                  }`}
                >
                  {sup.group}
                </span>

                {/* Duty Tag */}
                {shiftInfo.isMonday ? (
                  is24hDuty ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-700" />
                      ২৪ ঘণ্টা ডিউটি
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <Coffee className="w-3 h-3 text-emerald-700" />
                      ২৪ ঘণ্টা শিফটিং ছুটি
                    </span>
                  )
                ) : sup.group === shiftInfo.dayShiftGroup ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-600" />
                    দিনের ডিউটি
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                    <Moon className="w-3 h-3 text-indigo-600" />
                    রাতের ডিউটি
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                মোবাইল: <span className="font-semibold text-slate-800">{sup.phone}</span>
              </div>

              {/* Special Warning if absent on Monday 24h shift */}
              {isAbsent && is24hDuty && (
                <div className="mt-2 text-xs font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                  <span>
                    সোমবারে ২৪ ঘণ্টা ডিউটিতে অনুপস্থিত: ২ দিনের বেতন কর্তন হবে (৳ ১,৩৩৩.৩৩)!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Middle: Attendance Status Selection Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                id={`status-present-${sup.id}`}
                type="button"
                onClick={() => handleStatusChange(sup.id, 'present')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                  isPresent
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600 ring-offset-1'
                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>উপস্থিত</span>
              </button>

              <button
                id={`status-absent-${sup.id}`}
                type="button"
                onClick={() => handleStatusChange(sup.id, 'absent')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                  isAbsent
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600 ring-offset-1'
                    : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-800 border border-slate-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>অনুপস্থিত</span>
              </button>

              {/* Leave Button: Controlled by Office Authority */}
              {isOfficeAuthenticated || roleMode === 'office' ? (
                <button
                  id={`status-leave-${sup.id}`}
                  type="button"
                  onClick={() => handleStatusChange(sup.id, 'leave')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                    isLeave
                      ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600 ring-offset-1'
                      : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-slate-200'
                  }`}
                  title="অফিস কর্তৃক অনুমোদিত ছুটি (টাকা কাটবে না, সম্পূর্ণ বেতন ধরা হবে)"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>ছুটি (বেতনযুক্ত)</span>
                </button>
              ) : isLeave ? (
                <span
                  className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-xs bg-amber-100 text-amber-900 border border-amber-300"
                  title="অফিস কর্তৃপক্ষ কর্তৃক ছুটি মঞ্জুরকৃত (বেতন কর্তনমুক্ত)"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-700" />
                  <span>অফিস ছুটি (বেতনযুক্ত)</span>
                </span>
              ) : (
                <button
                  id={`status-leave-disabled-${sup.id}`}
                  type="button"
                  onClick={() => {
                    alert('🔒 "ছুটি" কেবল অফিস কর্তৃপক্ষ মঞ্জুর করতে পারেন।\nসুপারভাইজার অনুপস্থিত থাকলে "অনুপস্থিত" সিলেক্ট করে মন্তব্যের ঘরে কারণ উল্লেখ করুন। অফিস কর্তৃপক্ষ কারণ যাচাই করে ছুটি বিবেচনা করবে এবং বেতন প্রদান করবে।');
                  }}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-lg font-medium text-xs bg-slate-100 text-slate-400 border border-dashed border-slate-300 hover:bg-slate-200/60 cursor-pointer"
                  title="ছুটি দেওয়ার এখতিয়ার কেবল অফিস কর্তৃপক্ষের (ক্লিক করে জানুন)"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>ছুটি (অফিস মঞ্জুরি)</span>
                </button>
              )}
            </div>

            {/* Micro Badge for Leave */}
            {isLeave && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                বেতন কর্তন হবে না
              </span>
            )}
          </div>

          {/* Right: Note / Remarks Details */}
          <div className="flex flex-col gap-1 lg:w-72">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">
                {isAbsent ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    অনুপস্থিতির কারণ (বাধ্যতামূলক *)
                  </span>
                ) : isLeave ? (
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <Coffee className="w-3 h-3 text-amber-700" />
                    ছুটি বিবেচনার বিবরণ / রেফারেন্স:
                  </span>
                ) : (
                  <span className="text-slate-500">মন্তব্য (ঐচ্ছিক):</span>
                )}
              </span>
            </div>
            <input
              id={`input-remarks-${sup.id}`}
              type="text"
              value={entry.remarks || ''}
              onChange={(e) => handleRemarksChange(sup.id, e.target.value)}
              placeholder={
                isAbsent
                  ? 'অনুপস্থিতির কারণ লিখুন (বাধ্যতামূলক)...'
                  : isLeave
                  ? 'ছুটির কারণ / অফিস রেফারেন্স লিখুন...'
                  : 'মন্তব্য (ঐচ্ছিক)...'
              }
              className={`w-full px-3 py-2 text-xs rounded-lg focus:outline-hidden transition-all bg-white ${
                isAbsent && !entry.remarks?.trim()
                  ? 'border-2 border-rose-400 bg-rose-50/50 ring-2 ring-rose-200 placeholder:text-rose-400 font-medium'
                  : isAbsent
                  ? 'border border-rose-300 focus:ring-2 focus:ring-rose-500'
                  : isLeave
                  ? 'border border-amber-300 focus:ring-2 focus:ring-amber-500 bg-amber-50/30'
                  : 'border border-slate-300 focus:ring-2 focus:ring-cyan-600'
              }`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Form Validation Error Alert Banner */}
      {formValidationError && (
        <div className="bg-rose-50 border-2 border-rose-400 text-rose-950 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{formValidationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormValidationError('')}
            className="text-xs text-rose-700 hover:text-rose-900 font-bold p-1 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Success Notice: Automatically advances to new date */}
      {lastSubmissionNotice && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xl">
              ✓
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                  {lastSubmissionNotice.mode === 'office' ? '🛡️ অফিস সরাসরি অনুমোদিত' : '📩 অফিস অনুমোদনের জন্য দাখিলকৃত'}
                </span>
                <span className="text-xs text-emerald-800 font-medium">
                  সময়: {lastSubmissionNotice.time}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-emerald-950 mt-1">
                {formatBengaliDate(lastSubmissionNotice.submittedDate)}-এর হাজিরা সফলভাবে জমা হয়েছে!
              </h4>
              <p className="text-xs sm:text-sm text-emerald-900 mt-0.5 leading-relaxed">
                পূরণকৃত পূর্বের ফর্মটি সফলভাবে সংরক্ষণ করা হয়েছে এবং এখন নতুন তারিখ{' '}
                <strong className="text-cyan-950 font-bold bg-white/80 px-2 py-0.5 rounded border border-emerald-300 inline-block">
                  {formatBengaliDate(lastSubmissionNotice.nextDate)}
                </strong>
                -এর জন্য সম্পূর্ণ নতুন ফাঁকা ফর্ম ওপেন হয়েছে।
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end">
            <button
              id="btn-return-to-submitted-date"
              type="button"
              onClick={() => setSelectedDate(lastSubmissionNotice.submittedDate)}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="জমা দেওয়া ফর্মটি পুনরায় দেখুন বা সম্পাদনা করুন"
            >
              <span>🔍 {formatBengaliDate(lastSubmissionNotice.submittedDate).split(' ')[0]} {formatBengaliDate(lastSubmissionNotice.submittedDate).split(' ')[1]}-এ ফিরে যান</span>
            </button>
            <button
              type="button"
              onClick={() => setLastSubmissionNotice(null)}
              className="text-xs text-emerald-800 hover:text-emerald-950 p-2 rounded-lg hover:bg-emerald-200/50 transition-colors cursor-pointer"
              title="বিজ্ঞপ্তি বন্ধ করুন"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Policy Banner Regarding Office Approval Workflow */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 text-white border border-cyan-700/40 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>হাজিরা ও অফিস অনুমোদন ব্যবস্থা (লগইন সংরক্ষিত)</span>
                <span className="text-[11px] bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-2 py-0.5 rounded-full font-semibold">
                  কঠোর নিয়ম
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-0.5">
                সুপারভাইজারদের হাজিরা জমা দিতে তাদের <strong>নিবন্ধিত মোবাইল নম্বর ও ব্যক্তিগত পাসওয়ার্ড</strong> দিয়ে লগইন করতে হবে। লগইন ছাড়া কোনো হাজিরা দাখিল করা যাবে না।
                <strong className="text-cyan-200"> অফিস কর্তৃপক্ষ অফিস পাসওয়ার্ড দিয়ে যাচাই করে অনুমোদন করবেন।</strong>
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
            {isOfficeAuthenticated ? (
              <span className="flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1.5 rounded-lg border border-emerald-400/40">
                <ShieldCheck className="w-4 h-4" />
                <span>🏢 অফিস সেশন সক্রিয়</span>
              </span>
            ) : loggedInSupervisor ? (
              <span className="flex items-center gap-1.5 text-xs bg-cyan-500/20 text-cyan-200 font-bold px-3 py-1.5 rounded-lg border border-cyan-400/40">
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                <span>👷 {loggedInSupervisor.name} (লগইনকৃত)</span>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onOpenSupervisorLogin}
                  className="flex items-center gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg border border-cyan-400/40 transition-colors cursor-pointer shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>সুপারভাইজার লগইন</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenOfficeLogin}
                  className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg border border-slate-600 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-200" />
                  <span>অফিস লগইন (PIN)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Existing Saved Notice */}
      {isExistingSaved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
              <FileCheck2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                {formatBengaliDate(selectedDate)}-এর হাজিরা অফিস কর্তৃপক্ষ দ্বারা অনুমোদিত ও সংরক্ষিত
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                প্রস্তুতকারী: <strong>{attendanceData[selectedDate]?.submittedBy || 'অফিস'}</strong> | অনুমোদিত: {attendanceData[selectedDate]?.approvedBy || 'অফিস কর্তৃপক্ষ'}।
                {isOfficeAuthenticated
                  ? ' অফিস কর্তৃপক্ষ হিসেবে আপনি যেকোনো রেকর্ড পরিবর্তন বা সংশোধন করতে পারবেন।'
                  : ' এটি চূড়ান্ত অনুমোদিত রেকর্ড। সুপারভাইজারগণ শুধুমাত্র তাদের দৈনিক হাজিরা অনুমোদনের জন্য দাখিল করতে পারবেন, চূড়ান্ত তথ্য সরাসরি পরিবর্তনের অধিকার অফিস কর্তৃপক্ষের সংরক্ষিত।'}
              </p>
            </div>
          </div>

          {isOfficeAuthenticated && (
            <span className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-2xs shrink-0 self-start sm:self-auto">
              অফিস এডিট সক্রিয়
            </span>
          )}
        </div>
      )}

      {/* Dynamic Shift & Rotation Status Banner */}
      <div
        className={`rounded-xl border p-4 sm:p-5 shadow-xs transition-colors ${
          shiftInfo.isMonday
            ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border-amber-300'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {shiftInfo.isMonday ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-600 text-white shadow-xs">
                  <Zap className="w-3.5 h-3.5" />
                  আজ সোমবার: ২৪ ঘণ্টা ডাবল ডিউটি ও সাপ্তাহিক শিফট বদল
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  আজকের নিয়মিত শিফট রোস্টার ({shiftInfo.dayName})
                </span>
              )}
            </div>

            {shiftInfo.isMonday ? (
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                ⚡ <strong className="text-amber-950 font-bold">২৪ ঘণ্টা ডাবল ডিউটি:</strong>{' '}
                <span className="font-extrabold text-amber-900 underline underline-offset-2">
                  {shiftInfo.monday24hDutyGroup}
                </span>{' '}
                (সোমবার সকাল ৮টা থেকে মঙ্গলবার সকাল ৮টা —{' '}
                <span className="text-rose-700 font-bold">অনুপস্থিতিতে ২ দিনের বেতন কর্তন</span>)
                <br />
                🛋️ <strong className="text-emerald-950 font-bold">২৪ ঘণ্টা শিফটিং ছুটি:</strong>{' '}
                <span className="font-bold text-emerald-800">{shiftInfo.monday24hRestGroup}</span>{' '}
                (সবেতন উপস্থিত হিসেবে গণ্য)
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                ☀️ <strong>দিনের শিফট (সকাল ৮টা - রাত ৮টা):</strong>{' '}
                <span className="font-bold text-cyan-950">{shiftInfo.dayShiftGroup}</span>
                {'  '}|{'  '}
                🌙 <strong>রাতের শিফট (রাত ৮টা - সকাল ৮টা):</strong>{' '}
                <span className="font-bold text-indigo-950">{shiftInfo.nightShiftGroup}</span>
                {'  '}(নিয়মিত অনুপস্থিতিতে ১ দিনের বেতন কর্তন)
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              id="btn-wa-open-modal"
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপ রিপোর্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date & Quick Navigation Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date Selector */}
          <div>
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              হাজিরার তারিখ ও দিন
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-prev-day"
                type="button"
                onClick={handlePrevDay}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="পূর্ববর্তী দিন"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="relative flex items-center">
                <input
                  id="input-attendance-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 bg-white"
                />
              </div>

              <button
                id="btn-next-day"
                type="button"
                onClick={handleNextDay}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="পরবর্তী দিন"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Quick Jump to September 01 button */}
              <button
                id="btn-sept-first"
                type="button"
                onClick={handleJumpToSeptemberFirst}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="১ সেপ্টেম্বর থেকে হাজিরা শুরু করুন"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>১ সেপ্টেম্বর (শুরু)</span>
              </button>

              <button
                id="btn-today"
                type="button"
                onClick={handleToday}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer"
              >
                আজকে যান
              </button>

              <button
                id="btn-next-new-form"
                type="button"
                onClick={() => {
                  handleNextDay();
                  setLastSubmissionNotice(null);
                }}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="পরবর্তী দিনের নতুন ফর্ম খুলুন"
              >
                <span>➕ পরবর্তী দিনের ফর্ম</span>
              </button>
            </div>
            <p className="text-sm font-semibold text-cyan-900 mt-2 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-cyan-600" />
              {formatBengaliDate(selectedDate)} ({shiftInfo.dayName})
            </p>
          </div>

          {/* Quick Counter Badges & Status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>উপস্থিত: {toBengaliNumber(presentCount)} জন</span>
            </div>
            {leaveCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg text-sm font-medium" title="অফিস কর্তৃক অনুমোদিত বিবেচনাধীন ছুটি (বেতন কর্তনমুক্ত)">
                <Coffee className="w-4 h-4 text-amber-700" />
                <span>ছুটি (বেতনযুক্ত): {toBengaliNumber(leaveCount)} জন</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-lg text-sm font-medium">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>অনুপস্থিত: {toBengaliNumber(absentCount)} জন</span>
            </div>

            {isExistingSaved ? (
              <div className="flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-md border border-emerald-300 font-bold">
                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                <span>অফিস অনুমোদিত সংরক্ষিত</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-900 px-3 py-1.5 rounded-md border border-amber-300 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>অনুমোদনের অপেক্ষায় / খসড়া</span>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-700 font-semibold">এক ক্লিকে হাজিরা:</span>
            <button
              id="btn-mark-all-present"
              type="button"
              onClick={() => markAllStatus('present')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded bg-emerald-100/80 text-emerald-900 hover:bg-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              সবাই উপস্থিত
            </button>
            <button
              id="btn-mark-group-a-present"
              type="button"
              onClick={() => markGroupStatus('গ্রুপ-এ', 'present')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded bg-cyan-100 text-cyan-900 hover:bg-cyan-200 transition-colors cursor-pointer"
            >
              গ্রুপ-এ উপস্থিত
            </button>
            <button
              id="btn-mark-group-b-present"
              type="button"
              onClick={() => markGroupStatus('গ্রুপ-বি', 'present')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded bg-blue-100 text-blue-900 hover:bg-blue-200 transition-colors cursor-pointer"
            >
              গ্রুপ-বি উপস্থিত
            </button>
            <button
              id="btn-mark-all-absent"
              type="button"
              onClick={() => markAllStatus('absent')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded bg-rose-100/80 text-rose-900 hover:bg-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              সবাই অনুপস্থিত
            </button>
          </div>

          <div className="text-xs text-slate-600 font-medium">
            * দিনপ্রতি বেতন কর্তন: ৬৬৬.৬৭ ৳ | ১ দিন ফ্রি ছুটি | সোমবারে অনুপস্থিতি: ২ দিনের কর্তন
          </div>
        </div>
      </div>

      {/* Role & Submitter Details Section */}
      <div className="bg-white rounded-xl border-2 border-cyan-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Role Toggle Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>হাজিরা এন্ট্রি ও ভূমিকা নির্ধারণ</span>
              <span className="text-xs font-normal text-slate-500">(কে ফরম পূরণ করছেন?)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              অফিস কর্তৃপক্ষ পাসওয়ার্ড দিয়ে সরাসরি এন্ট্রি ও অনুমোদন দিতে পারবেন, অথবা সুপারভাইজার অনুমোদনের জন্য জমা দিতে পারবেন।
            </p>
          </div>

          {/* Quick Toggle Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              id="tab-role-office"
              type="button"
              onClick={() => {
                setRoleMode('office');
                if (!isOfficeAuthenticated) {
                  // Prompt password focus
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleMode === 'office'
                  ? 'bg-cyan-800 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>🏢 অফিস কর্তৃপক্ষ</span>
              {isOfficeAuthenticated && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              id="tab-role-supervisor"
              type="button"
              onClick={() => setRoleMode('supervisor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleMode === 'supervisor'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>👤 অন-ডিউটি সুপারভাইজার</span>
            </button>
          </div>
        </div>

        {/* Role Content 1: Office Authority Mode */}
        {roleMode === 'office' ? (
          isOfficeAuthenticated ? (
            /* Logged in as Office Authority */
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-emerald-950">
                      অফিস কর্তৃপক্ষ লগইন সক্রিয় (সরাসরি অনুমোদন ও এন্ট্রি মোড)
                    </h4>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                      অনুমোদিত
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1">
                    হাজিরা প্রস্তুতকারী: <strong>অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)</strong>। আপনার পূরণকৃত তথ্য কোনো অপেক্ষমাণ রাখা ছাড়াই সরাসরি চূড়ান্ত বেতন রেজিস্টারে সংরক্ষিত হবে।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onLogoutOffice && (
                  <button
                    type="button"
                    onClick={onLogoutOffice}
                    className="text-xs font-semibold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    লগআউট
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Not yet authenticated as Office Authority -> Prompt for Password */
            <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 border border-cyan-700/50 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                      <span>অফিস কর্তৃপক্ষ পাসওয়ার্ড দিয়ে লগইন করুন</span>
                      <span className="text-[11px] bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 px-2 py-0.5 rounded-full font-medium">
                        ডিফল্ট পাসওয়ার্ড: 1234
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      পাসওয়ার্ড দিয়ে লগইন করলে সুপারভাইজারের নাম বা মোবাইল ছাড়াও সরাসরি হাজিরা এন্ট্রি ও অফিসিয়াল অনুমোদন দিতে পারবেন।
                    </p>
                  </div>
                </div>

                {/* Inline Password Entry Form */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-inline-office-password"
                      type="password"
                      value={inlinePin}
                      onChange={(e) => {
                        setInlinePin(e.target.value);
                        setInlinePinError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInlineLogin();
                        }
                      }}
                      placeholder="পাসওয়ার্ড (1234)..."
                      className="w-40 pl-8 pr-3 py-2 text-xs font-mono font-bold bg-white text-slate-900 rounded-lg border border-cyan-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <button
                    id="btn-inline-office-login"
                    type="button"
                    onClick={() => handleInlineLogin()}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>লগইন</span>
                  </button>
                  <button
                    id="btn-open-pin-modal-from-card"
                    type="button"
                    onClick={onOpenOfficeLogin}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-lg border border-white/20 transition-colors cursor-pointer"
                  >
                    পাসওয়ার্ড বক্স
                  </button>
                </div>
              </div>

              {inlinePinError && (
                <div className="mt-3 text-xs text-rose-300 font-semibold flex items-center gap-1.5 bg-rose-950/60 p-2 rounded-lg border border-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{inlinePinError}</span>
                </div>
              )}
            </div>
          )
        ) : (
          /* Role Content 2: Supervisor fill-up mode (Strict Login Gated) */
          <div className="space-y-3">
            {loggedInSupervisor ? (
              <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border-2 border-cyan-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-cyan-800 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                    {loggedInSupervisor.name.charAt(loggedInSupervisor.name.indexOf(' ') + 1) || 'স'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-cyan-950">
                        {loggedInSupervisor.name}
                      </h4>
                      <span className="text-xs bg-cyan-700 text-white px-2.5 py-0.5 rounded-full font-bold">
                        {loggedInSupervisor.group}
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        লগইন যাচাইকৃত
                      </span>
                    </div>
                    <p className="text-xs text-cyan-900 mt-1">
                      মোবাইল নম্বর: <strong className="font-mono">{loggedInSupervisor.phone}</strong> • এই অফিসিয়াল পরিচয়ে হাজিরা জমা হবে।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onLogoutSupervisor && (
                    <button
                      type="button"
                      onClick={onLogoutSupervisor}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      লগআউট
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* When not yet logged in: Select Supervisor + Password verification box */
              <div className="bg-gradient-to-br from-slate-50 to-cyan-50/50 border-2 border-cyan-300 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cyan-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-800 text-white flex items-center justify-center text-xs font-bold">
                      👤
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        সুপারভাইজার নির্বাচন ও পাসওয়ার্ড যাচাই (হাজিরা জমার জন্য বাধ্যতামূলক)
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        তালিকা থেকে নিজের নাম নির্বাচন করুন এবং আপনার গোপন পাসওয়ার্ড দিন। পাসওয়ার্ড ছাড়া হাজিরা দাখিল করা যাবে না।
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" />
                    <span>পাসওয়ার্ড আবশ্যক</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1: Pick Supervisor */}
                  <div>
                    <label htmlFor="select-supervisor-submitter" className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                      <span>১. আপনি কোন সুপারভাইজার? *</span>
                    </label>
                    <select
                      id="select-supervisor-submitter"
                      value={selectedSupervisorSubmitterId}
                      onChange={(e) => handleSelectSupervisorDropdown(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-cyan-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-600 bg-white font-medium cursor-pointer shadow-2xs"
                    >
                      <option value="">-- নিজের নাম বেছে নিন --</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.group} - {s.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Registered Mobile Display */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-cyan-700" />
                      <span>২. নিবন্ধিত অফিসিয়াল মোবাইল</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={supervisorPhone || 'উপরে নাম নির্বাচন করলে নম্বর দেখাবে'}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold cursor-not-allowed"
                    />
                  </div>

                  {/* Step 3: Password Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-cyan-700" />
                        <span>৩. আপনার পাসওয়ার্ড *</span>
                      </span>
                      {selectedSupervisorSubmitterId && !supervisors.find((s) => s.id === selectedSupervisorSubmitterId)?.password && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          প্রথমবার: নতুন সেট করুন
                        </span>
                      )}
                    </label>

                    {selectedSupervisorSubmitterId && !supervisors.find((s) => s.id === selectedSupervisorSubmitterId)?.password ? (
                      /* First time password creation */
                      <div className="space-y-2 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                        <input
                          type="password"
                          value={inlineSupervisorNewPassword}
                          onChange={(e) => {
                            setInlineSupervisorNewPassword(e.target.value);
                            setInlineSupervisorError('');
                          }}
                          placeholder="নতুন পাসওয়ার্ড দিন (কমপক্ষে ৪ অক্ষর)..."
                          className="w-full px-2.5 py-1.5 text-xs font-bold border border-amber-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                        <input
                          type="password"
                          value={inlineSupervisorConfirmPassword}
                          onChange={(e) => {
                            setInlineSupervisorConfirmPassword(e.target.value);
                            setInlineSupervisorError('');
                          }}
                          placeholder="নতুন পাসওয়ার্ড নিশ্চিত করুন..."
                          className="w-full px-2.5 py-1.5 text-xs font-bold border border-amber-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleInlineSupervisorLogin()}
                          className="w-full py-1.5 bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-xs rounded-md transition-colors cursor-pointer shadow-xs"
                        >
                          পাসওয়ার্ড সেট ও লগইন
                        </button>
                      </div>
                    ) : (
                      /* Existing Password Verification */
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <input
                            id="input-inline-sup-password"
                            type={showInlinePassword ? 'text' : 'password'}
                            value={inlineSupervisorPassword}
                            onChange={(e) => {
                              setInlineSupervisorPassword(e.target.value);
                              setInlineSupervisorError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleInlineSupervisorLogin();
                              }
                            }}
                            placeholder="পাসওয়ার্ড লিখুন..."
                            className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm font-bold border border-cyan-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowInlinePassword(!showInlinePassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                            title={showInlinePassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                          >
                            {showInlinePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInlineSupervisorLogin()}
                          className="px-3.5 py-2 bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
                        >
                          লগইন
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {inlineSupervisorError && (
                  <div className="text-xs text-rose-700 font-bold bg-rose-50 border border-rose-300 p-2.5 rounded-lg flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{inlineSupervisorError}</span>
                  </div>
                )}
                {inlineSupervisorSuccess && (
                  <div className="text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 p-2.5 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{inlineSupervisorSuccess}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cyan-100/80 text-[11px] text-slate-600">
                  <span>* কোনো ডিফল্ট পাসওয়ার্ড দেওয়া হয়নি। আপনি নিজেই প্রথমবার আপনার পাসওয়ার্ড সেট করবেন।</span>
                  {onOpenSupervisorLogin && (
                    <button
                      type="button"
                      onClick={onOpenSupervisorLogin}
                      className="text-cyan-800 hover:text-cyan-950 font-bold underline cursor-pointer"
                    >
                      অথবা পূর্ণ লগইন ডায়ালগ খুলুন →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Supervisor Pending Submission Banner */}
      {supervisorSubmittedSuccess && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-emerald-100 shrink-0" />
            <div>
              <p className="font-bold text-sm sm:text-base">
                {formatBengaliDate(selectedDate)}-এর হাজিরা সফলভাবে অফিস অনুমোদনের জন্য জমা দেওয়া হয়েছে!
              </p>
              <p className="text-xs text-emerald-100 leading-relaxed mt-0.5">
                প্রস্তুতকারী: <strong>{submittedBy}</strong> ({supervisorPhone})। অফিস কর্তৃপক্ষ অনুমোদন দিলে এটি মূল বেতন শিট ও রেজিস্টারে যুক্ত হবে।
              </p>
            </div>
          </div>
          <button
            onClick={() => setSupervisorSubmittedSuccess(false)}
            className="text-xs bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg text-white font-semibold cursor-pointer shrink-0"
          >
            বুঝেছি
          </button>
        </div>
      )}

      {/* Office Approved Banner */}
      {officeSavedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
            <div>
              <p className="font-bold text-sm">অফিস কর্তৃপক্ষ দ্বারা হাজিরা চূড়ান্ত অনুমোদন ও সংরক্ষিত হয়েছে!</p>
              <p className="text-xs text-emerald-100">
                {formatBengaliDate(selectedDate)} তারিখের উপস্থিতি স্থায়ীভাবে ডেটাবেজে যুক্ত হয়েছে।
              </p>
            </div>
          </div>
          <button
            onClick={() => setOfficeSavedSuccess(false)}
            className="text-xs bg-emerald-800 hover:bg-emerald-900 px-3 py-1.5 rounded-lg text-white font-semibold cursor-pointer"
          >
            ঠিক আছে
          </button>
        </div>
      )}

      {/* Attendance Form Container */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* গ্রুপ-এ সেকশন */}
        <div className="space-y-3">
          <div className="bg-cyan-950 text-white px-4 py-3 rounded-xl shadow-xs flex items-center justify-between border border-cyan-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
              <h3 className="font-bold text-sm sm:text-base">গ্রুপ-এ ({toBengaliNumber(groupA.length)} জন)</h3>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-900 text-cyan-200 border border-cyan-700">
              {shiftInfo.isMonday
                ? shiftInfo.monday24hDutyGroup === 'গ্রুপ-এ'
                  ? '⚡ আজ ২৪ ঘণ্টা ডাবল ডিউটি'
                  : '🛋️ আজ ২৪ ঘণ্টা শিফটিং বিশ্রাম'
                : shiftInfo.dayShiftGroup === 'গ্রুপ-এ'
                ? '☀️ দিনের শিফট (সকাল ৮টা - রাত ৮টা)'
                : '🌙 রাতের শিফট (রাত ৮টা - সকাল ৮টা)'}
            </div>
          </div>

          <div className="space-y-3">
            {groupA.map((sup, index) => renderSupervisorRow(sup, index))}
          </div>
        </div>

        {/* গ্রুপ-বি সেকশন */}
        <div className="space-y-3">
          <div className="bg-blue-950 text-white px-4 py-3 rounded-xl shadow-xs flex items-center justify-between border border-blue-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <h3 className="font-bold text-sm sm:text-base">গ্রুপ-বি ({toBengaliNumber(groupB.length)} জন)</h3>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-900 text-blue-200 border border-blue-700">
              {shiftInfo.isMonday
                ? shiftInfo.monday24hDutyGroup === 'গ্রুপ-বি'
                  ? '⚡ আজ ২৪ ঘণ্টা ডাবল ডিউটি'
                  : '🛋️ আজ ২৪ ঘণ্টা শিফটিং বিশ্রাম'
                : shiftInfo.dayShiftGroup === 'গ্রুপ-বি'
                ? '☀️ দিনের শিফট (সকাল ৮টা - রাত ৮টা)'
                : '🌙 রাতের শিফট (রাত ৮টা - সকাল ৮টা)'}
            </div>
          </div>

          <div className="space-y-3">
            {groupB.map((sup, index) => renderSupervisorRow(sup, groupA.length + index))}
          </div>
        </div>

        {/* Day Notes & Submit Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div>
            <label htmlFor="input-day-notes" className="block text-xs font-bold text-slate-700 mb-1">
              দিনের বিশেষ কাজের নোট বা মন্তব্য (ঐচ্ছিক)
            </label>
            <input
              id="input-day-notes"
              type="text"
              value={dayNotes}
              onChange={(e) => setDayNotes(e.target.value)}
              placeholder="যেমন: ড্রেজার অপারেশন স্বাভাবিক, নদী চ্যানেল ড্রেজিং অব্যাহত"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
            />
          </div>

          {/* Submission and Approval Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-700 leading-relaxed">
              {isOfficeAuthenticated ? (
                <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
                  অফিস সেশন সক্রিয়: সংরক্ষণ করলে হাজিরা সরাসরি অনুমোদিত হয়ে <strong>চূড়ান্ত বেতন শিট ও রেজিস্টারে যোগ হবে</strong>।
                </span>
              ) : loggedInSupervisor ? (
                <span className="text-cyan-900 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                  সুপারভাইজার সেশন সক্রিয়: <strong>{loggedInSupervisor.name}</strong> ({loggedInSupervisor.phone}) হিসেবে অফিসে অনুমোদনের জন্য দাখিল হবে।
                </span>
              ) : (
                <span className="text-amber-800 font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600 inline" />
                  লগইন আবশ্যক: হাজিরা জমা দিতে অবশ্যই সুপারভাইজার লগইন অথবা অফিস পাসওয়ার্ড দিন।
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {isOfficeAuthenticated ? (
                <>
                  {/* Office Authenticated Direct Save Primary Button */}
                  <button
                    id="btn-direct-office-approve-primary"
                    type="button"
                    onClick={handleDirectOfficeSave}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-emerald-400/40"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-100" />
                    <span>🛡️ অফিস অনুমোদনসহ সরাসরি সংরক্ষণ করুন</span>
                  </button>

                  <button
                    id="btn-submit-pending-secondary"
                    type="submit"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    পেন্ডিং হিসেবে দাখিল
                  </button>
                </>
              ) : loggedInSupervisor ? (
                <>
                  {/* Primary Submit Button for Logged in Supervisor */}
                  <button
                    id="btn-supervisor-submit-approval"
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-3 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-cyan-200" />
                    <span>অফিস অনুমোদনের জন্য হাজিরা জমা দিন ({loggedInSupervisor.name})</span>
                  </button>

                  {/* Quick Office Login to direct save */}
                  <button
                    id="btn-office-login-to-save"
                    type="button"
                    onClick={() => {
                      setRoleMode('office');
                      if (onOpenOfficeLogin) onOpenOfficeLogin();
                    }}
                    className="flex-1 sm:flex-none px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-cyan-500/40"
                  >
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span>🔑 অফিস পাসওয়ার্ড দিয়ে সেভ</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Unauthenticated User: Prompt Password / Login on Submit */}
                  <button
                    id="btn-login-to-submit"
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-3 bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-cyan-500/30"
                  >
                    <Send className="w-4 h-4 text-cyan-200" />
                    <span>পাসওয়ার্ড দিয়ে হাজিরা জমা দিন (অনুমোদন আবেদন)</span>
                  </button>

                  <button
                    id="btn-office-login-to-save"
                    type="button"
                    onClick={() => {
                      setRoleMode('office');
                      if (onOpenOfficeLogin) onOpenOfficeLogin();
                    }}
                    className="flex-1 sm:flex-none px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-cyan-500/40"
                  >
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span>🔑 অফিস পাসওয়ার্ড দিয়ে লগইন</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Submit Password Verification Modal */}
      {showSubmitPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-cyan-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-900 via-slate-900 to-cyan-950 text-white p-5 text-center relative">
              <button
                type="button"
                onClick={() => setShowSubmitPasswordModal(false)}
                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mx-auto mb-2 text-cyan-300">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">সুপারভাইজার পাসওয়ার্ড দিয়ে সাবমিট করুন</h3>
              <p className="text-xs text-cyan-200/90 mt-0.5">
                হাজিরা অফিস অনুমোদনের জন্য দাখিল করতে পাসওয়ার্ড যাচাই আবশ্যক
              </p>
            </div>

            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              <div className="text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  পাসওয়ার্ড দিয়ে লগইন না করে কোনো সুপারভাইজারের নামেই হাজিরা অনুমোদনের জন্য দাখিল করা সম্ভব নয়।
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ১. আপনি কোন সুপারভাইজার? (নাম বাছুন) *
                </label>
                <select
                  value={modalSupervisorId || selectedSupervisorSubmitterId}
                  onChange={(e) => {
                    setModalSupervisorId(e.target.value);
                    setSelectedSupervisorSubmitterId(e.target.value);
                    const matched = supervisors.find((s) => s.id === e.target.value);
                    if (matched) {
                      setSubmittedBy(matched.name);
                      setSupervisorPhone(matched.phone);
                    }
                    setModalError('');
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 font-bold bg-white cursor-pointer"
                >
                  <option value="">-- নিজের নাম বেছে নিন --</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.group} - {s.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Show selected supervisor phone & password field */}
              {(() => {
                const targetSup = supervisors.find(
                  (s) => s.id === (modalSupervisorId || selectedSupervisorSubmitterId)
                );
                if (!targetSup) return null;
                const hasPassword = Boolean(targetSup.password && targetSup.password.trim() !== '');

                return (
                  <div className="space-y-3 pt-1">
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">অফিসিয়াল মোবাইল:</span>
                      <span className="font-mono font-bold text-cyan-900">{targetSup.phone}</span>
                    </div>

                    {!hasPassword ? (
                      /* Set new password */
                      <div className="space-y-2 bg-cyan-50/60 p-3 rounded-xl border border-cyan-200">
                        <p className="text-xs font-bold text-cyan-950">
                          💡 প্রথমবার সাবমিট: আপনার নতুন পাসওয়ার্ড সেট করুন
                        </p>
                        <div>
                          <input
                            type="password"
                            value={modalNewPassword}
                            onChange={(e) => {
                              setModalNewPassword(e.target.value);
                              setModalError('');
                            }}
                            placeholder="নতুন পাসওয়ার্ড দিন (কমপক্ষে ৪ অক্ষর)..."
                            className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <input
                            type="password"
                            value={modalConfirmPassword}
                            onChange={(e) => {
                              setModalConfirmPassword(e.target.value);
                              setModalError('');
                            }}
                            placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন..."
                            className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Enter existing password */
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                          <span>২. আপনার গোপন পাসওয়ার্ড লিখুন:</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showModalPassword ? 'text' : 'password'}
                            autoFocus
                            value={modalPassword}
                            onChange={(e) => {
                              setModalPassword(e.target.value);
                              setModalError('');
                            }}
                            placeholder="পাসওয়ার্ড লিখুন..."
                            className="w-full pl-3 pr-9 py-2.5 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowModalPassword(!showModalPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {modalError && (
                <div className="text-xs text-rose-700 font-bold bg-rose-50 border border-rose-300 p-2.5 rounded-lg flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitPasswordModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isModalSubmitting}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>যাচাই ও হাজিরা জমা দিন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {showShareModal && (
        <WhatsAppShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          selectedDate={selectedDate}
          supervisors={supervisors}
          attendanceData={attendanceData}
        />
      )}
    </div>
  );
};
