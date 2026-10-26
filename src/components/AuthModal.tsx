import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Phone,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  HardHat,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Supervisor } from '../types';
import {
  findSupervisorByPhone,
  normalizePhoneNumber,
  saveAuthSession,
} from '../utils/authUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisors: Supervisor[];
  onOfficeLogin: (pin: string) => boolean;
  onSupervisorLogin: (supervisor: Supervisor) => void;
  onUpdateSupervisorPassword: (supervisorId: string, newPassword: string) => Promise<void> | void;
  initialTab?: 'office' | 'supervisor';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  supervisors,
  onOfficeLogin,
  onSupervisorLogin,
  onUpdateSupervisorPassword,
  initialTab = 'supervisor',
}) => {
  const [activeTab, setActiveTab] = useState<'office' | 'supervisor'>(initialTab);

  // Office state
  const [officePin, setOfficePin] = useState('');
  const [showOfficePin, setShowOfficePin] = useState(false);
  const [officeError, setOfficeError] = useState('');
  const [officeSuccess, setOfficeSuccess] = useState(false);

  // Supervisor state
  const [phoneInput, setPhoneInput] = useState('');
  const [matchedSupervisor, setMatchedSupervisor] = useState<Supervisor | null>(null);
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSupervisorPassword, setShowSupervisorPassword] = useState(false);
  const [supervisorError, setSupervisorError] = useState('');
  const [supervisorSuccess, setSupervisorSuccess] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset tab on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setOfficeError('');
      setSupervisorError('');
      setOfficeSuccess(false);
      setSupervisorSuccess(false);
      setOfficePin('');
      setSupervisorPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, initialTab]);

  // Real-time phone matching
  useEffect(() => {
    const trimmed = phoneInput.trim();
    const normalized = normalizePhoneNumber(trimmed);
    if (normalized.length >= 10) {
      const match = findSupervisorByPhone(supervisors, normalized);
      if (match) {
        setMatchedSupervisor(match);
        setSupervisorError('');
        // Check if supervisor already has a password set
        if (!match.password || match.password.trim() === '') {
          setIsSettingPassword(true);
        } else {
          setIsSettingPassword(false);
        }
      } else {
        setMatchedSupervisor(null);
        setIsSettingPassword(false);
      }
    } else {
      setMatchedSupervisor(null);
      setIsSettingPassword(false);
    }
  }, [phoneInput, supervisors]);

  if (!isOpen) return null;

  // Handle Office Form Submit
  const handleOfficeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOfficeError('');

    if (!officePin.trim()) {
      setOfficeError('⚠️ অনুগ্রহ করে অফিস পিন (PIN) লিখুন।');
      return;
    }

    const isValid = onOfficeLogin(officePin.trim());
    if (isValid) {
      setOfficeSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setOfficeError('❌ ভুল অফিস পিন! সঠিক ৪ সংখ্যার পিন প্রদান করুন।');
    }
  };

  // Handle Supervisor Form Submit
  const handleSupervisorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupervisorError('');

    if (!phoneInput.trim()) {
      setSupervisorError('⚠️ অনুগ্রহ করে আপনার নিবন্ধিত মোবাইল নম্বর লিখুন।');
      return;
    }

    const normInput = normalizePhoneNumber(phoneInput);
    const supervisor = matchedSupervisor || findSupervisorByPhone(supervisors, normInput);

    if (!supervisor) {
      setSupervisorError(
        '❌ এই মোবাইল নম্বরটি নিবন্ধিত সুপারভাইজারদের তালিকায় পাওয়া যায়নি। সঠিক মোবাইল নম্বর দিন।'
      );
      return;
    }

    // Case 1: First-time password creation
    if (!supervisor.password || isSettingPassword) {
      if (!newPassword.trim()) {
        setSupervisorError('⚠️ অনুগ্রহ করে আপনার নতুন পাসওয়ার্ড লিখুন।');
        return;
      }
      if (newPassword.trim().length < 4) {
        setSupervisorError('⚠️ পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
        return;
      }
      if (newPassword !== confirmPassword) {
        setSupervisorError('⚠️ নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না!');
        return;
      }

      try {
        setIsSubmitting(true);
        await onUpdateSupervisorPassword(supervisor.id, newPassword.trim());
        setSupervisorSuccess(true);
        const updatedSupervisor: Supervisor = {
          ...supervisor,
          password: newPassword.trim(),
          passwordSet: true,
        };
        setTimeout(() => {
          onSupervisorLogin(updatedSupervisor);
          onClose();
        }, 700);
      } catch (err) {
        setSupervisorError('পাসওয়ার্ড সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Case 2: Regular password login
    if (!supervisorPassword.trim()) {
      setSupervisorError('⚠️ অনুগ্রহ করে আপনার গোপন পাসওয়ার্ড লিখুন।');
      return;
    }

    if (supervisor.password.trim() !== supervisorPassword.trim()) {
      setSupervisorError('❌ ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
      return;
    }

    // Success
    setSupervisorSuccess(true);
    setTimeout(() => {
      onSupervisorLogin(supervisor);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950 via-blue-950 to-slate-900 text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                চট্টগ্রাম ড্রেজার মালিক সমিতি (CDMS)
              </span>
              <h3 className="text-lg font-bold text-white">নিরাপদ লগইন পোর্টাল</h3>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-900/80 p-1 rounded-xl border border-cyan-800/40">
            <button
              type="button"
              onClick={() => {
                setActiveTab('supervisor');
                setSupervisorError('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'supervisor'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardHat className="w-4 h-4 text-cyan-300" />
              <span>সুপারভাইজার লগইন</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('office');
                setOfficeError('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'office'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span>অফিস লগইন</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* ==================================== */}
          {/* TAB 1: SUPERVISOR LOGIN */}
          {/* ==================================== */}
          {activeTab === 'supervisor' && (
            <form onSubmit={handleSupervisorSubmit} className="space-y-4">
              {supervisorSuccess ? (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">সফলভাবে লগইন হয়েছে!</h4>
                    <p className="text-xs text-emerald-800">
                      স্বাগতম {matchedSupervisor?.name}! আপনাকে সিস্টেমে রিডাইরেক্ট করা হচ্ছে...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-cyan-50/80 border border-cyan-200 rounded-xl p-3 text-xs text-cyan-950 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5 text-cyan-900">
                      <Sparkles className="w-4 h-4 text-cyan-600" />
                      সুপারভাইজার লগইন নির্দেশিকা:
                    </p>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      আপনার নিবন্ধিত মোবাইল নম্বর দিন। প্রথমবার লগইন করলে নিজের পছন্দমতো নতুন পাসওয়ার্ড
                      সেট করতে পারবেন (কোনো পূর্বনির্ধারিত বা ডিফল্ট পাসওয়ার্ড নেই)।
                    </p>
                  </div>

                  {/* Mobile Number Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      নিবন্ধিত মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="যেমন: 01889-267527 অথবা 01812372906"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:bg-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Matched Supervisor Card */}
                  {matchedSupervisor && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                          {matchedSupervisor.name.charAt(matchedSupervisor.name.indexOf(' ') + 1) || 'স'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-blue-950">
                            {matchedSupervisor.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded border border-blue-200">
                            {matchedSupervisor.group} • {matchedSupervisor.designation}
                          </span>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    </div>
                  )}

                  {/* Password Section */}
                  {matchedSupervisor && (
                    <>
                      {isSettingPassword ? (
                        /* First Time: Set New Password */
                        <div className="space-y-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                          <div className="flex items-start gap-2">
                            <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-bold text-xs text-amber-950">
                                প্রথমবার লগইন: নতুন পাসওয়ার্ড নির্ধারণ
                              </h5>
                              <p className="text-[11px] text-amber-800 leading-relaxed">
                                আপনার কোনো ডিফল্ট পাসওয়ার্ড নেই। ভবিষ্যতে লগইন করার জন্য একটি গোপন পাসওয়ার্ড সেট করুন।
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-700">
                              নতুন পাসওয়ার্ড লিখুন <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type={showSupervisorPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-700">
                              পাসওয়ার্ড নিশ্চিত করুন <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showSupervisorPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="পুনরায় একই পাসওয়ার্ড লিখুন"
                                className="w-full px-3 py-2 pr-9 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSupervisorPassword(!showSupervisorPassword)}
                                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                              >
                                {showSupervisorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Existing Password Login */
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              আপনার গোপন পাসওয়ার্ড <span className="text-rose-500">*</span>
                            </label>
                          </div>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                              type={showSupervisorPassword ? 'text' : 'password'}
                              value={supervisorPassword}
                              onChange={(e) => setSupervisorPassword(e.target.value)}
                              placeholder="আপনার পাসওয়ার্ড লিখুন"
                              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:bg-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowSupervisorPassword(!showSupervisorPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showSupervisorPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Error display */}
                  {supervisorError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p>{supervisorError}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {isSettingPassword
                        ? 'পাসওয়ার্ড সংরক্ষণ ও লগইন করুন'
                        : 'সুপারভাইজার হিসেবে প্রবেশ করুন'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Quick helper list of registered supervisors */}
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-600 mb-2">
                      অনুমোদিত সুপারভাইজারদের নামের তালিকা (নম্বর স্বয়ংক্রিয় বসাতে চাপুন):
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {supervisors.slice(0, 10).map((sup) => {
                        const firstPhone = sup.phones?.[0] || sup.phone.split('/')[0].trim();
                        return (
                          <button
                            key={sup.id}
                            type="button"
                            onClick={() => {
                              setPhoneInput(firstPhone);
                            }}
                            className="text-left px-2 py-1 rounded bg-slate-100 hover:bg-cyan-100 hover:text-cyan-900 text-slate-700 transition-colors truncate border border-slate-200"
                            title={`${sup.name} (${sup.phone})`}
                          >
                            <span className="font-semibold">{sup.name}</span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {sup.phone}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </form>
          )}

          {/* ==================================== */}
          {/* TAB 2: OFFICE LOGIN */}
          {/* ==================================== */}
          {activeTab === 'office' && (
            <form onSubmit={handleOfficeSubmit} className="space-y-4">
              {officeSuccess ? (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">অফিস পিন যাচাই সফল!</h4>
                    <p className="text-xs text-emerald-800">
                      অফিস নিয়ন্ত্রণ প্যানেল আনলক করা হয়েছে...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5 text-emerald-900">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      অফিস কর্তৃপক্ষ নিয়ন্ত্রণ ক্ষমতা:
                    </p>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      অফিস লগইন করলে মাঠপর্যায়ের সুপারভাইজারদের প্রেরিত হাজিরা অনুমোদন/বাতিল, চূড়ান্ত মাসিক
                      বেতন শিট ব্যবস্থাপনা ও সুপারভাইজারদের তথ্য পরিবর্তন করার পূর্ণ অধিকার পাওয়া যায়।
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        অফিস সিক্রেট পিন (PIN) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-500">ডিফল্ট: 1234</span>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type={showOfficePin ? 'text' : 'password'}
                        value={officePin}
                        onChange={(e) => setOfficePin(e.target.value)}
                        placeholder="৪ সংখ্যার পিন লিখুন"
                        maxLength={10}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm sm:text-base tracking-widest text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowOfficePin(!showOfficePin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showOfficePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {officeError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p>{officeError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>অফিস কর্তৃপক্ষ হিসেবে প্রবেশ করুন</span>
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="text-[11px] text-slate-500">
            চট্টগ্রাম ড্রেজার মালিক সমিতি
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded cursor-pointer"
          >
            বাতিল / বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
