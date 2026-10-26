import { Supervisor } from '../types';

export type UserRole = 'office' | 'supervisor';

export interface AuthSession {
  role: UserRole;
  supervisorId?: string;
  loginTime: string;
}

const STORAGE_KEY_AUTH = 'cdms_auth_session_v1';

/**
 * Converts Bengali digits to English digits and extracts all continuous numeric sequences.
 */
export function normalizePhoneNumber(raw: string | undefined | null): string {
  if (!raw) return '';
  const bengaliToEnglish: Record<string, string> = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  };
  const converted = raw.replace(/[০-৯]/g, (d) => bengaliToEnglish[d] || d);
  // Keep only digits
  return converted.replace(/\D/g, '');
}

/**
 * Extracts individual phone numbers from a combined string (e.g. "01889-267527 / 01812-372906").
 */
export function extractPhoneNumbers(phoneStr: string | undefined | null): string[] {
  if (!phoneStr) return [];
  const parts = phoneStr.split(/[/,;\n|\\]+/);
  return parts
    .map((p) => normalizePhoneNumber(p))
    .filter((digits) => digits.length >= 10);
}

/**
 * Check if the input phone matches a supervisor's registered phone numbers.
 * Matches by exact 11 digits (e.g. 01889267527) or by ending 10/11 digits.
 */
export function matchesSupervisorPhone(supervisor: Supervisor, input: string): boolean {
  const normInput = normalizePhoneNumber(input);
  if (!normInput || normInput.length < 8) return false;

  // Collect all known numbers for this supervisor
  const candidates: string[] = [];
  if (supervisor.phone) {
    candidates.push(...extractPhoneNumbers(supervisor.phone));
  }
  if (supervisor.phones && Array.isArray(supervisor.phones)) {
    supervisor.phones.forEach((p) => {
      candidates.push(normalizePhoneNumber(p));
    });
  }

  return candidates.some((cand) => {
    if (!cand) return false;
    if (cand === normInput) return true;
    // Handle leading 880 vs 01
    const cleanCand = cand.startsWith('880') ? cand.slice(2) : cand;
    const cleanInput = normInput.startsWith('880') ? normInput.slice(2) : normInput;
    if (cleanCand === cleanInput) return true;
    if (cleanCand.length >= 10 && cleanInput.length >= 10) {
      return cleanCand.endsWith(cleanInput) || cleanInput.endsWith(cleanCand);
    }
    return false;
  });
}

/**
 * Find a supervisor matching the entered phone number.
 */
export function findSupervisorByPhone(
  supervisors: Supervisor[],
  input: string
): Supervisor | undefined {
  return supervisors.find((sup) => matchesSupervisorPhone(sup, input));
}

/**
 * Session persistence
 */
export function getStoredAuthSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_AUTH) || localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession, persist = true): void {
  try {
    const serialized = JSON.stringify(session);
    sessionStorage.setItem(STORAGE_KEY_AUTH, serialized);
    if (persist) {
      localStorage.setItem(STORAGE_KEY_AUTH, serialized);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearAuthSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch {
    // Ignore
  }
}
