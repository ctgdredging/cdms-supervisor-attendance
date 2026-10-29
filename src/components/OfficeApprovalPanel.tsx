import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  MapPin,
  FileCheck,
  Trash2,
  Eye,
  LogOut,
  Calendar,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Supervisor, PendingAttendanceSubmission, DayAttendance, AttendanceEntry } from '../types';
import { formatBengaliDate, toBengaliNumber } from '../utils/bengaliUtils';

interface OfficeApprovalPanelProps {
  supervisors: Supervisor[];
  pendingSubmissions: PendingAttendanceSubmission[];
  isOfficeAuthenticated: boolean;
  onAuthenticate: (pin: string) => boolean;
  onLogout: () => void;
  onApproveSubmission: (submissionId: string, updatedRecord?: DayAttendance) => void;
  onRejectSubmission: (submissionId: string, reason?: string) => void;
  currentPin: string;
  onChangePin: (oldPin: string, newPin: string) => boolean;
}

export const OfficeApprovalPanel: React.FC<OfficeApprovalPanelProps> = ({
  supervisors,
  pendingSubmissions,
  isOfficeAuthenticated,
  onAuthenticate,
  onLogout,
  onApproveSubmission,
  onRejectSubmission,
  currentPin,
  onChangePin,
}) => {
  // Login PIN state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Selected submission to review details
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    pendingSubmissions.length > 0 ? pendingSubmissions[0].id : null
  );

  // Office record adjustments (e.g. converting absence to paid leave)
  const [editedRecords, setEditedRecords] = useState<Record<string, Record<string, AttendanceEntry>>>({});

  // Change PIN modal state
  const [showChangePin, setShowChangePin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changePinMsg, setChangePinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rejection modal
  const [rejectionSubmissionId, setRejectionSubmissionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const getSubmissionRecords = (sub: PendingAttendanceSubmission) => {
    return editedRecords[sub.id] || sub.records;
  };

  const handleUpdateSupervisorStatusInReview = (
    submissionId: string,
    supervisorId: string,
    newStatus: 'present' | 'absent' | 'leave'
  ) => {
    const targetSub = pendingSubmissions.find((s) => s.id === submissionId);
    if (!targetSub) return;
    setEditedRecords((prev) => {
      const currentSubRecords = prev[submissionId] || { ...targetSub.records };
      const currentEntry = currentSubRecords[supervisorId] || {
        supervisorId,
        status: 'present',
      };
      return {
        ...prev,
        [submissionId]: {
          ...currentSubRecords,
          [supervisorId]: {
            ...currentEntry,
            status: newStatus,
          },
        },
      };
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (!pinInput.trim()) {
      setPinError('দয়া করে অফিস পিন কোড প্রবেশ করান।');
      return;
    }
    const success = onAuthenticate(pinInput.trim());
    if (!success) {
      setPinError('ভুল পিন কোড! সঠিক পিন দিয়ে পুনরায় চেষ্টা করুন।');
    } else {
      setPinInput('');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMsg(null);
    if (newPin.length < 4) {
      setChangePinMsg({ type: 'error', text: 'নতুন পিন কমপক্ষে ৪ সংখ্যার হতে হবে।' });
      return;
    }
    if (newPin !== confirmPin) {
      setChangePinMsg({ type: 'error', text: 'নতুন পিন এবং নিশ্চিতকরণ পিন মেলেনি।' });
      return;
    }
    const success = onChangePin(oldPin, newPin);
    if (!success) {
      setChangePinMsg({ type: 'error', text: 'বর্তমান পুরাতন পিন কোডটি সঠিক নয়।' });
    } else {
      setChangePinMsg({ type: 'success', text: 'পিন কোড সফলভাবে পরিবর্তন করা হয়েছে!' });
      setTimeout(() => {
        setShowChangePin(false);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setChangePinMsg(null);
      }, 2000);
    }
  };

  const handleConfirmReject = () => {
    if (rejectionSubmissionId) {
      onRejectSubmission(rejectionSubmissionId, rejectReason);
      setRejectionSubmissionId(null);
      setRejectReason('');
    }
  };

  // If not authenticated, show secure PIN login screen
  if (!isOfficeAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-slate-900 to-cyan-950 text-white p-6 text-center">
          <div className="w-14 h-14 bg-cyan-500/20 border border-cyan-400/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-cyan-300" />
          </div>
          <h2 className="text-lg font-bold text-white">অফিস কর্তৃপক্ষ অনুমোদন গেটওয়ে</h2>
          <p className="text-xs text-cyan-200/80 mt-1">
            চট্টগ্রাম ড্রেজার মালিক সমিতি
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
            🔒 <strong>অনুমোদনের নিরাপত্তা পলিসি:</strong> সুপারভাইজাররা হাজিরা ফর্ম পূরণ করতে পারেন, কিন্তু অফিস কর্তৃপক্ষ পিন কোড দিয়ে অনুমোদন না করা পর্যন্ত তা স্থায়ী স্টোরেজে যুক্ত হয় না।
          </div>

          <div>
            <label htmlFor="input-office-pin" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              অফিস পাসওয়ার্ড / পিন (PIN) কোড:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-office-pin"
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                placeholder="পিন কোড লিখুন..."
                className="w-full pl-10 pr-4 py-2.5 text-center text-lg font-mono tracking-widest border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-600 focus:outline-hidden bg-slate-50 font-bold"
              />
            </div>
            {pinError && (
              <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pinError}
              </p>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            ডিফল্ট অফিস পিন কোড: <strong className="text-slate-800 font-mono">1234</strong>
            <br />
            (প্রবেশ করার পর যেকোনো সময় আপনি পিন পরিবর্তন করতে পারবেন)
          </div>

          <button
            id="btn-login-office"
            type="submit"
            className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>প্রবেশ করুন ও অনুমোদন ড্যাশবোর্ড খুলুন</span>
          </button>
        </form>
      </div>
    );
  }

  // Once authenticated:
  const activeSubmission = pendingSubmissions.find((s) => s.id === selectedSubmissionId) || pendingSubmissions[0];

  return (
    <div className="space-y-6">
      {/* Authenticated Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                অফিস কর্তৃপক্ষ অনুমোদন ড্যাশবোর্ড
              </h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                লগইন সক্রিয়
              </span>
            </div>
            <p className="text-xs text-slate-600">
              সুপারভাইজারদের পাঠানো অপেক্ষমাণ হাজিরা পর্যালোচনা ও চূড়ান্ত অনুমোদন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-change-pin-modal"
            type="button"
            onClick={() => setShowChangePin(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>পিন পরিবর্তন</span>
          </button>

          <button
            id="btn-office-logout"
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লক / লগআউট</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {pendingSubmissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            বর্তমানে কোনো নতুন হাজিরা অনুমোদনের অপেক্ষায় নেই!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            সুপারভাইজাররা &quot;দৈনিক হাজিরা ফরম&quot; পূরণ করে সাবমিট করলে তা সরাসরি এখানে অনুমোদনের জন্য জমা হবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Submissions Queue List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                অপেক্ষমাণ তালিকা ({toBengaliNumber(pendingSubmissions.length)} টি):
              </span>
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                অনুমোদন আবশ্যক
              </span>
            </div>

            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {pendingSubmissions.map((sub) => {
                const isSelected = activeSubmission?.id === sub.id;
                const recList = Object.values(sub.records) as import('../types').AttendanceEntry[];
                const pCount = recList.filter((r) => r.status === 'present').length;
                const aCount = recList.filter((r) => r.status === 'absent').length;

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubmissionId(sub.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-50/80 border-cyan-500 shadow-sm ring-1 ring-cyan-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatBengaliDate(sub.date)}
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                        অপেক্ষমাণ
                      </span>
                    </div>

                    <div className="text-slate-600 flex items-center gap-1 mb-2">
                      <span>সাবমিটকারী:</span>
                      <strong className="text-slate-800">{sub.submittedBy}</strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/70">
                      <span className="text-emerald-700 font-semibold">
                        উপস্থিত: {toBengaliNumber(pCount)} জন
                      </span>
                      <span className="text-rose-700 font-semibold">
                        অনুপস্থিত: {toBengaliNumber(aCount)} জন
                      </span>
                      <span className="text-slate-500">
                        {new Date(sub.submittedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Review & Approval Actions */}
          {activeSubmission && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                      হাজিরা বিশদ পর্যালোচনা
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(activeSubmission.submittedAt).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    তারিখ: {formatBengaliDate(activeSubmission.date)}
                  </h3>
                  <p className="text-xs text-slate-600">
                    আবেদনকারী: <strong>{activeSubmission.submittedBy}</strong> {activeSubmission.supervisorPhone && `(${activeSubmission.supervisorPhone})`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`btn-reject-${activeSubmission.id}`}
                    type="button"
                    onClick={() => setRejectionSubmissionId(activeSubmission.id)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>প্রত্যাখ্যান</span>
                  </button>

                  <button
                    id={`btn-approve-${activeSubmission.id}`}
                    type="button"
                    onClick={() => {
                      const finalRecords = getSubmissionRecords(activeSubmission);
                      const updatedDayAttendance: DayAttendance = {
                        date: activeSubmission.date,
                        records: finalRecords,
                        submittedAt: activeSubmission.submittedAt,
                        submittedBy: activeSubmission.submittedBy,
                        notes: activeSubmission.notes,
                        approvalStatus: 'approved',
                        approvedAt: new Date().toISOString(),
                        approvedBy: 'অফিস কর্তৃপক্ষ (চট্টগ্রাম ড্রেজার মালিক সমিতি)',
                      };
                      onApproveSubmission(activeSubmission.id, updatedDayAttendance);
                    }}
                    className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>অনুমোদন ও সংরক্ষণ করুন</span>
                  </button>
                </div>
              </div>

              {/* Office Leave Review Instruction Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>অফিস ছুটি মঞ্জুরির নীতিমালা:</strong> ফিল্ড সুপারভাইজাররা কেবল &apos;উপস্থিত&apos; বা &apos;অনুপস্থিত&apos; তথ্য জমা দিতে পারেন।
                  অনুপস্থিতির কারণ যাচাই করে অফিস কর্তৃপক্ষ যদি তা যুক্তিযুক্ত মনে করেন, তবে নিচের তালিকায় সেই সুপারভাইজারের জন্য <strong className="text-amber-900 underline">&apos;ছুটি (বেতনযুক্ত)&apos;</strong> সিলেক্ট করুন। <strong>ছুটি হিসেবে সিলেক্ট করলে তার বেতন কাটা হবে না (সম্পূর্ণ বেতন প্রাপ্য হবে)।</strong>
                </div>
              </div>

              {/* Quick status count pill bar */}
              {(() => {
                const curRecords = getSubmissionRecords(activeSubmission);
                const pCount = supervisors.filter((s) => curRecords[s.id]?.status === 'present').length;
                const lCount = supervisors.filter((s) => curRecords[s.id]?.status === 'leave').length;
                const aCount = supervisors.filter((s) => curRecords[s.id]?.status === 'absent').length;
                return (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      উপস্থিত: {toBengaliNumber(pCount)} জন
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 font-bold border border-amber-300">
                      ছুটি (বেতনযুক্ত): {toBengaliNumber(lCount)} জন
                    </span>
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-900 font-bold border border-rose-300">
                      অনুপস্থিত (কর্তন হবে): {toBengaliNumber(aCount)} জন
                    </span>
                  </div>
                );
              })()}

              {/* Note if provided */}
              {activeSubmission.notes && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800">
                  <strong>সুপারভাইজার কর্তৃক প্রেরিত সাধারণ নোট:</strong> {activeSubmission.notes}
                </div>
              )}

              {/* Table of supervisors in this submission */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">নাম ও গ্রুপ</th>
                      <th className="py-2.5 px-3">ডিউটির স্থান</th>
                      <th className="py-2.5 px-3">অনুপস্থিতির কারণ / মন্তব্য</th>
                      <th className="py-2.5 px-3 text-center">অফিস বিবেচনা ও স্ট্যাটাস নির্ধারণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supervisors.map((sup) => {
                      const curRecords = getSubmissionRecords(activeSubmission);
                      const entry = curRecords[sup.id] || { supervisorId: sup.id, status: 'present' };
                      const isPresent = entry?.status === 'present';
                      const isAbsent = entry?.status === 'absent';
                      const isLeave = entry?.status === 'leave';
                      const dutyBlock = entry?.dutyBlock || sup.dutyBlock || 'বন্দর ব্লক';

                      return (
                        <tr
                          key={sup.id}
                          className={
                            isAbsent
                              ? 'bg-rose-50/40'
                              : isLeave
                              ? 'bg-amber-50/40'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{sup.name}</div>
                            <span className="text-[10px] text-slate-500 font-medium">{sup.group}</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-cyan-950">
                            {dutyBlock}
                          </td>
                          <td className="py-2.5 px-3">
                            {entry?.remarks ? (
                              <span className={isAbsent ? 'text-rose-700 font-medium' : 'text-slate-700'}>
                                {entry.remarks}
                              </span>
                            ) : isAbsent ? (
                              <span className="text-rose-500 italic">কারণ উল্লেখ নেই</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSupervisorStatusInReview(activeSubmission.id, sup.id, 'present')
                                }
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-600'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                                }`}
                              >
                                उपस्थित
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSupervisorStatusInReview(activeSubmission.id, sup.id, 'absent')
                                }
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                                  isAbsent
                                    ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-600'
                                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
                                }`}
                              >
                                অনুপস্থিত
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSupervisorStatusInReview(activeSubmission.id, sup.id, 'leave')
                                }
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                                  isLeave
                                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                                    : 'bg-amber-50 text-amber-950 border border-amber-300 hover:bg-amber-100'
                                }`}
                                title="অফিস বিবেচনা করে ছুটি মঞ্জুর করতে পারেন (বেতন কাটা হবে না)"
                              >
                                <span>ছুটি (বেতনযুক্ত)</span>
                              </button>
                            </div>

                            {/* Micro Indicator */}
                            {isLeave && (
                              <span className="text-[10px] text-emerald-800 font-bold block text-center mt-1">
                                ✓ অফিস ছুটি: বেতন কর্তন হবে না
                              </span>
                            )}
                            {isAbsent && (
                              <span className="text-[10px] text-rose-700 font-semibold block text-center mt-1">
                                অননুমোদিত: বেতন কাটা হবে
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionSubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <span>হাজিরা আবেদন প্রত্যাখ্যান নিশ্চিতকরণ</span>
            </h3>
            <p className="text-xs text-slate-600">
              আপনি কি এই হাজিরাটি বাতিল করতে চান? সুপারভাইজারকে সংশোধনের কারণ লিখে জানাতে পারেন:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="যেমন: বন্দর ব্লক নং-০৩ এর সুপারভাইজারের উপস্থিতি তথ্য ভুল রয়েছে..."
              rows={3}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionSubmissionId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer"
              >
                প্রত্যাখ্যান নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {showChangePin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-700" />
                <span>অফিস পাসওয়ার্ড / পিন পরিবর্তন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePin(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePinSubmit} className="space-y-3.5 text-xs">
              {changePinMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold ${
                    changePinMsg.type === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {changePinMsg.text}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  বর্তমান পুরাতন পিন কোড *
                </label>
                <input
                  type="password"
                  required
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-widest"
                  placeholder="পুরাতন পিন"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  নতুন পিন কোড (কমপক্ষে ৪ সংখ্যা) *
                </label>
                <input
                  type="password"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-widest"
                  placeholder="যেমন: 4321"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  নতুন পিন কোড নিশ্চিত করুন *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-widest"
                  placeholder="পুনরায় নতুন পিন লিখুন"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowChangePin(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
