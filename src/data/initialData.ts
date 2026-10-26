import { Supervisor, DayAttendance, PendingAttendanceSubmission } from '../types';

export const INITIAL_SUPERVISORS: Supervisor[] = [
  // গ্রুপ-এ
  {
    id: 'sup-1',
    name: 'মোঃ জসিম',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01889-267527 / 01812-372906',
    phones: ['01889267527', '01812372906'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-2',
    name: 'মোঃ খালেক',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01768-377041 / 01811-827461',
    phones: ['01768377041', '01811827461'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-3',
    name: 'মোঃ রাশেদ',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01680-423249 / 01906-290367',
    phones: ['01680423249', '01906290367'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-4',
    name: 'বিজয় চৌধুরী',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01818-253136',
    phones: ['01818253136'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-5',
    name: 'মোঃ সাকিব',
    group: 'গ্রুপ-এ',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01568-240967',
    phones: ['01568240967'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },

  // গ্রুপ-বি
  {
    id: 'sup-6',
    name: 'মোঃ মহসিন',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01812-908787',
    phones: ['01812908787'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-7',
    name: 'মোঃ বাদশা',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01820-130643',
    phones: ['01820130643'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-8',
    name: 'মোঃ মফিজ',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01850-802245 / 01902-997024',
    phones: ['01850802245', '01902997024'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-9',
    name: 'মোঃ ফজু',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01877-762419',
    phones: ['01877762419'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
  {
    id: 'sup-10',
    name: 'মোঃ মিজান',
    group: 'গ্রুপ-বি',
    designation: 'ড্রেজার সুপারভাইজার',
    phone: '01845-507443',
    phones: ['01845507443'],
    baseSalary: 20000,
    joinDate: '২০২৪-০১-০১',
  },
];

// Helper to initialize attendance data - completely clean without sample/dummy data
// User will fill up everything fresh starting from September 01
export function getInitialAttendanceData(currentYear?: number, currentMonth?: number): Record<string, DayAttendance> {
  // Return empty record as requested by user ("apatoto kono sample present diyo na. ami September 01 tarikh theke sob fill up korbo")
  return {};
}

// Helper to initialize pending submissions - start completely clean
export function getInitialPendingSubmissions(): PendingAttendanceSubmission[] {
  return [];
}


