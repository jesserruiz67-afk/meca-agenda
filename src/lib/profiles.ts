import { normalizeCurrency, type CurrencyCode } from './currency';
import { migrateLegacyData } from './storage';

const PROFILES_KEY = 'meca-agenda:profiles:v1';
const SESSION_KEY = 'meca-agenda:session:v1';

export const TRIAL_DAYS = 7;
export const PLAN_PRICE_USD = 7.99;
export const ACTIVATION_CODE = 'MECA-ANUAL-799';

export type Profile = {
  id: string;
  name: string;
  shopName: string;
  currency: CurrencyCode;
  pinSalt: string;
  pinHash: string;
  createdAt: string;
  trialStart: string;
  subscription?: {
    activatedAt: string;
    expiresAt: string;
    code: string;
  };
};

export type NewProfileInput = {
  name: string;
  shopName: string;
  currency: CurrencyCode;
  pin: string;
};

export type Access = {
  state: 'trial' | 'active' | 'expired';
  daysLeft: number;
  trialEndsAt: string;
  expiresAt?: string;
};

function loadProfilesRaw(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeProfile);
  } catch {
    return [];
  }
}

function normalizeProfile(raw: Profile): Profile {
  const createdAt = raw.createdAt || new Date().toISOString();
  return {
    ...raw,
    name: raw.name || 'Sin nombre',
    shopName: raw.shopName || 'Mi taller',
    currency: normalizeCurrency(raw.currency),
    createdAt,
    trialStart: raw.trialStart || createdAt,
    pinSalt: raw.pinSalt || '',
    pinHash: raw.pinHash || '',
  };
}

export function loadProfiles(): Profile[] {
  return loadProfilesRaw();
}

function saveProfiles(profiles: Profile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function getSessionProfileId(): string {
  try {
    return localStorage.getItem(SESSION_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setSessionProfileId(profileId: string): void {
  try {
    localStorage.setItem(SESSION_KEY, profileId);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function fallbackHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

async function hashPin(pin: string, salt: string): Promise<string> {
  if (!crypto.subtle) {
    return fallbackHash(`${salt}:${pin}`);
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 120_000,
      hash: 'SHA-256',
    },
    key,
    256,
  );
  return `pbkdf2:${bytesToHex(new Uint8Array(bits))}`;
}

export async function verifyPin(profile: Profile, pin: string): Promise<boolean> {
  if (!profile.pinHash || !profile.pinSalt) return false;
  if (profile.pinHash.startsWith('fnv:')) {
    return fallbackHash(`${profile.pinSalt}:${pin}`) === profile.pinHash;
  }
  const hash = await hashPin(pin, profile.pinSalt);
  return hash === profile.pinHash;
}

export async function createProfile(
  input: NewProfileInput,
): Promise<Profile> {
  const now = new Date().toISOString();
  const salt = randomSalt();
  const profile: Profile = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    shopName: input.shopName.trim(),
    currency: normalizeCurrency(input.currency),
    pinSalt: salt,
    pinHash: await hashPin(input.pin, salt),
    createdAt: now,
    trialStart: now,
  };
  const profiles = loadProfilesRaw();
  const isFirst = profiles.length === 0;
  saveProfiles([...profiles, profile]);
  if (isFirst) migrateLegacyData(profile.id);
  return profile;
}

export function updateProfile(profile: Profile): void {
  const profiles = loadProfilesRaw();
  saveProfiles(
    profiles.map((entry) => (entry.id === profile.id ? profile : entry)),
  );
}

function dayMs(): number {
  return 86_400_000;
}

export function getAccess(profile: Profile, now = new Date()): Access {
  const trialEnd = new Date(
    new Date(profile.trialStart).getTime() + TRIAL_DAYS * dayMs(),
  );

  if (profile.subscription) {
    const expires = new Date(profile.subscription.expiresAt);
    if (expires.getTime() > now.getTime()) {
      return {
        state: 'active',
        daysLeft: Math.max(
          1,
          Math.ceil((expires.getTime() - now.getTime()) / dayMs()),
        ),
        trialEndsAt: trialEnd.toISOString(),
        expiresAt: expires.toISOString(),
      };
    }
    return {
      state: 'expired',
      daysLeft: 0,
      trialEndsAt: trialEnd.toISOString(),
      expiresAt: expires.toISOString(),
    };
  }

  const remaining = trialEnd.getTime() - now.getTime();
  return {
    state: remaining > 0 ? 'trial' : 'expired',
    daysLeft: Math.max(0, Math.ceil(remaining / dayMs())),
    trialEndsAt: trialEnd.toISOString(),
  };
}

function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function activateProfile(
  profile: Profile,
  code: string,
): Profile | null {
  if (normalizeCode(code) !== normalizeCode(ACTIVATION_CODE)) return null;
  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  const updated: Profile = {
    ...profile,
    subscription: {
      activatedAt: activatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      code,
    },
  };
  updateProfile(updated);
  return updated;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
