import React, { useState } from 'react';
import {
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  Coins,
  Check,
  X,
  Users,
  RotateCcw,
  Lock,
  ShieldCheck,
  PhoneCall,
  Copy,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Supervisor, SupervisorGroup } from '../types';
import { toBengaliNumber, formatTaka } from '../utils/bengaliUtils';

interface SupervisorManagerProps {
  supervisors: Supervisor[];
  onAddSupervisor: (supervisor: Omit<Supervisor, 'id'>) => void;
  onUpdateSupervisor: (supervisor: Supervisor) => void;
  onDeleteSupervisor: (id: string) => void;
  onResetToDefaults?: () => void;
  isOfficeAuthenticated?: boolean;
  onOpenOfficeLogin?: () => void;
  onResetSupervisorPassword?: (supervisorId: string) => void;
}

export const SupervisorManager: React.FC<SupervisorManagerProps> = ({
  supervisors,
  onAddSupervisor,
  onUpdateSupervisor,
  onDeleteSupervisor,
  onResetToDefaults,
  isOfficeAuthenticated = false,
  onOpenOfficeLogin,
  onResetSupervisorPassword,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<'all' | 'গ্রুপ-এ' | 'গ্রুপ-বি'>('all');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // New supervisor form state
  const [formData, setFormData] = useState({
    name: '',
    group: 'গ্রুপ-এ' as SupervisorGroup,
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '',
    baseSalary: 20000,
  });

  // Edit supervisor form state
  const [editFormData, setEditFormData] = useState<Supervisor | null>(null);

  const handleStartAdd = () => {
    if (!isOfficeAuthenticated) {
      if (onOpenOfficeLogin) onOpenOfficeLogin();
      return;
    }
    setFormData({
      name: '',
      group: 'গ্রুপ-এ',
      designation: 'ড্রেজার সুপারভাইজার',
      phone: '',
      baseSalary: 20000,
    });
    setIsAdding(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAddSupervisor({
      name: formData.name.trim(),
      group: formData.group,
      designation: formData.designation.trim() || 'ড্রেজার সুপারভাইজার',
      phone: formData.phone.trim() || '০১৮১২-০০০০০০',
      baseSalary: Number(formData.baseSalary) || 20000,
      joinDate: new Date().toISOString().split('T')[0],
    });

    setIsAdding(false);
  };

  const handleStartEdit = (sup: Supervisor) => {
    if (!isOfficeAuthenticated) {
      if (onOpenOfficeLogin) onOpenOfficeLogin();
      return;
    }
    setEditingId(sup.id);
    setEditFormData({
      ...sup,
      group: sup.group || 'গ্রুপ-এ',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !editFormData.name.trim()) return;
    onUpdateSupervisor({
      ...editFormData,
    });
    setEditingId(null);
    setEditFormData(null);
  };

  const handleCopyPhone = async (phone: string, id: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2500);
    } catch {
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2500);
    }
  };

  const displayedSupervisors = supervisors.filter((s) => {
    if (filterGroup === 'all') return true;
    return s.group === filterGroup;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-800" />
              <span>সুপারভাইজার রোস্টার ও মোবাইল ডিরেক্টরি</span>
            </h2>
            <span className="text-xs font-bold bg-cyan-50 border border-cyan-200 text-cyan-900 px-2.5 py-0.5 rounded-full">
              মোট ১০ জন
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            চট্টগ্রাম ড্রেজার মালিক সমিতি — গ্রুপ-এ ও গ্রুপ-বি সুপারভাইজারদের সংরক্ষিত মোবাইল নম্বর ও তথ্য
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onResetToDefaults && isOfficeAuthenticated && (
            <button
              id="btn-reset-default-supervisors"
              type="button"
              onClick={() => {
                if (window.confirm('আপনি কি নির্ধারিত ১০ জন সুপারভাইজারের মূল তালিকা (আপডেটকৃত মোবাইল নম্বর সহ) রিস্টোর করতে চান?')) {
                  onResetToDefaults();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="ডিফল্ট তালিকা রিস্টোর"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>তালিকা রিস্টোর</span>
            </button>
          )}

          {!isAdding && (
            <button
              id="btn-open-add-supervisor"
              type="button"
              onClick={handleStartAdd}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
                isOfficeAuthenticated
                  ? 'bg-cyan-800 hover:bg-cyan-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {isOfficeAuthenticated ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>নতুন সুপারভাইজার যোগ করুন</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>সুপারভাইজার যোগ (অফিস লকড)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Office Authority Status Banner */}
      {!isOfficeAuthenticated ? (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-800 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                🔒 তথ্য সুরক্ষানীতি: কোনো কিছু পরিবর্তন শুধুমাত্র অফিস কর্তৃপক্ষ করতে পারবে
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                সুপারভাইজারদের তালিকা ও সংরক্ষিত মোবাইল নম্বর নিরাপদ রাখা হয়েছে। কোনো তথ্য সংযোজন, সংশোধন বা মুছে ফেলার জন্য অফিস পিন দিয়ে আনলক করুন।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenOfficeLogin}
            className="self-start sm:self-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>অফিস পিন দিয়ে আনলক করুন</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300/80 flex items-center justify-center text-emerald-800 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                🛡️ অফিস কর্তৃপক্ষ পূর্ণ নিয়ন্ত্রণ সক্রিয়
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                আপনি সুপারভাইজারদের তথ্য ও মোবাইল নম্বর সংশোধন বা নতুন সদস্য সংযোজন করতে পারবেন।
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-emerald-200/80 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300 shrink-0 hidden sm:inline-block">
            অনুমোদিত এডমিন
          </span>
        </div>
      )}

      {/* Filter Tabs by Group */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setFilterGroup('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterGroup === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          সবাই ({toBengaliNumber(supervisors.length)} জন)
        </button>
        <button
          type="button"
          onClick={() => setFilterGroup('গ্রুপ-এ')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterGroup === 'গ্রুপ-এ'
              ? 'bg-cyan-800 text-white shadow-xs'
              : 'bg-cyan-50 text-cyan-900 hover:bg-cyan-100 border border-cyan-200'
          }`}
        >
          গ্রুপ-এ ({toBengaliNumber(supervisors.filter((s) => s.group === 'গ্রুপ-এ').length)} জন)
        </button>
        <button
          type="button"
          onClick={() => setFilterGroup('গ্রুপ-বি')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterGroup === 'গ্রুপ-বি'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          গ্রুপ-বি ({toBengaliNumber(supervisors.filter((s) => s.group === 'গ্রুপ-বি').length)} জন)
        </button>
      </div>

      {/* Add New Supervisor Form Card */}
      {isAdding && isOfficeAuthenticated && (
        <form
          onSubmit={handleSaveAdd}
          className="bg-cyan-50/40 border-2 border-cyan-600 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-cyan-200 pb-3">
            <h3 className="font-bold text-cyan-950 text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-800" />
              <span>নতুন সুপারভাইজারের তথ্য নিবন্ধন করুন</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="input-new-name" className="block text-xs font-bold text-slate-700 mb-1">
                সুপারভাইজারের পুরো নাম *
              </label>
              <input
                id="input-new-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="যেমন: মোঃ জসিম"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            <div>
              <label htmlFor="input-new-group" className="block text-xs font-bold text-slate-700 mb-1">
                গ্রুপ নির্বাচন করুন *
              </label>
              <select
                id="input-new-group"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value as SupervisorGroup })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-600 font-medium"
              >
                <option value="গ্রুপ-এ">গ্রুপ-এ</option>
                <option value="গ্রুপ-বি">গ্রুপ-বি</option>
              </select>
            </div>

            <div>
              <label htmlFor="input-new-phone" className="block text-xs font-bold text-slate-700 mb-1">
                মোবাইল নম্বর *
              </label>
              <input
                id="input-new-phone"
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="যেমন: ০১৮১২-১০০২০১"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-600 font-mono"
              />
            </div>

            <div>
              <label htmlFor="input-new-salary" className="block text-xs font-bold text-slate-700 mb-1">
                মাসিক মূল বেতন (টাকা)
              </label>
              <input
                id="input-new-salary"
                type="number"
                min="0"
                step="500"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-600 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              id="btn-save-new-supervisor"
              type="submit"
              className="px-5 py-2 bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {/* Supervisors List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedSupervisors.map((sup, idx) => {
          const isEditing = editingId === sup.id;

          if (isEditing && editFormData && isOfficeAuthenticated) {
            return (
              <form
                key={sup.id}
                onSubmit={handleSaveEdit}
                className="bg-white rounded-2xl border-2 border-cyan-600 p-5 shadow-sm space-y-3.5 animate-fade-in"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-cyan-700" />
                    <span>তথ্য সম্পাদনা: {sup.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label htmlFor={`edit-name-${sup.id}`} className="block text-slate-700 font-bold mb-1">নাম:</label>
                    <input
                      id={`edit-name-${sup.id}`}
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor={`edit-group-${sup.id}`} className="block text-slate-700 font-bold mb-1">গ্রুপ:</label>
                      <select
                        id={`edit-group-${sup.id}`}
                        value={editFormData.group}
                        onChange={(e) => setEditFormData({ ...editFormData, group: e.target.value as SupervisorGroup })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                      >
                        <option value="গ্রুপ-এ">গ্রুপ-এ</option>
                        <option value="গ্রুপ-বি">গ্রুপ-বি</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`edit-phone-${sup.id}`} className="block text-slate-700 font-bold mb-1">মোবাইল:</label>
                      <input
                        id={`edit-phone-${sup.id}`}
                        type="text"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, phone: e.target.value })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor={`edit-salary-${sup.id}`} className="block text-slate-700 font-bold mb-1">মূল বেতন:</label>
                      <input
                        id={`edit-salary-${sup.id}`}
                        type="number"
                        value={editFormData.baseSalary}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            baseSalary: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    id={`btn-save-edit-${sup.id}`}
                    type="submit"
                    className="px-4 py-1.5 bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>আপডেট সম্পন্ন</span>
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div
              key={sup.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-cyan-400/80 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
                      {toBengaliNumber(idx + 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{sup.name}</h3>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          sup.group === 'গ্রুপ-এ' ? 'bg-cyan-50 text-cyan-900 border-cyan-200' : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}>
                          {sup.group}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {sup.designation}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Restricted if not Office Authenticated) */}
                  <div className="flex items-center gap-1">
                    {isOfficeAuthenticated ? (
                      <>
                        <button
                          id={`btn-edit-${sup.id}`}
                          type="button"
                          onClick={() => handleStartEdit(sup)}
                          className="p-1.5 text-slate-600 hover:text-cyan-800 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                          title="তথ্য সম্পাদনা (অফিস)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {supervisors.length > 1 && (
                          <button
                            id={`btn-delete-${sup.id}`}
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `আপনি কি নিশ্চিত যে "${sup.name}"-কে তালিকা থেকে মুছে ফেলতে চান?`
                                )
                              ) {
                                onDeleteSupervisor(sup.id);
                              }
                            }}
                            className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="মুছে ফেলুন (অফিস)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenOfficeLogin}
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="পরিবর্তন করতে অফিস পিন দিন"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Phone Card with Call and Copy */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        মোবাইল নম্বর:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sup.phone.split('/').map((p, pIdx) => {
                          const cleanP = p.trim();
                          return (
                            <div key={pIdx} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                              <a
                                href={`tel:${cleanP}`}
                                className="font-mono font-bold text-slate-800 hover:text-cyan-800 underline decoration-slate-300 hover:decoration-cyan-700"
                                title="সরাসরি কল করুন"
                              >
                                {cleanP}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(cleanP, `${sup.id}-${pIdx}`)}
                                className="text-slate-400 hover:text-cyan-700 p-0.5 ml-0.5"
                                title="নম্বর কপি করুন"
                              >
                                {copiedPhoneId === `${sup.id}-${pIdx}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Password Status & Reset */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {sup.password && sup.password.trim() ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          পাসওয়ার্ড সেট করা আছে
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          পাসওয়ার্ড এখনো সেট করেনি
                        </span>
                      )}
                    </div>

                    {isOfficeAuthenticated && onResetSupervisorPassword && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `আপনি কি "${sup.name}"-এর পাসওয়ার্ড রিসেট করতে চান? রিসেট করলে তিনি পরবর্তীতে নিজের মোবাইল দিয়ে লগইন করে নতুন পাসওয়ার্ড সেট করতে পারবেন।`
                            )
                          ) {
                            onResetSupervisorPassword(sup.id);
                          }
                        }}
                        className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        title="পাসওয়ার্ড রিসেট করুন"
                      >
                        পাসওয়ার্ড রিসেট
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">মাসিক মূল বেতন:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatTaka(sup.baseSalary)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

