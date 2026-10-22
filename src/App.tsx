import { useEffect, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import Paywall from './components/Paywall';
import WorkshopApp from './components/WorkshopApp';
import {
  activateProfile,
  clearSession,
  createProfile,
  getAccess,
  getSessionProfileId,
  loadProfiles,
  revokeProfileAccess,
  setProfileAccess,
  setProfilePin,
  setProfileRole,
  setSessionProfileId,
  updateProfile,
  type NewProfileInput,
  type Profile,
  type ProfileRole,
} from './lib/profiles';
import { hasLegacyData } from './lib/storage';
import {
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
} from './lib/settings';

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles);
  const [appSettings, setAppSettings] = useState<AppSettings>(
    loadAppSettings,
  );
  const [profile, setProfile] = useState<Profile | null>(() => {
    const sessionId = getSessionProfileId();
    return loadProfiles().find((entry) => entry.id === sessionId) ?? null;
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), 60_000);
    const onVisibility = () => setTick((tick) => tick + 1);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  async function handleCreate(input: NewProfileInput) {
    const created = await createProfile(input);
    setProfiles(loadProfiles());
    setSessionProfileId(created.id);
    setProfile(created);
  }

  function handleLogin(next: Profile) {
    setSessionProfileId(next.id);
    setProfile(next);
  }

  function handleLogout() {
    clearSession();
    setProfile(null);
    setProfiles(loadProfiles());
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
  }

  function handleUpdateProfile(next: Profile) {
    updateProfile(next);
    setProfile(next);
    setProfiles(loadProfiles());
  }

  function handleSaveAppSettings(next: AppSettings) {
    setAppSettings(next);
    saveAppSettings(next);
  }

  function handleAdminUpdateProfile(next: Profile) {
    updateProfile(next);
    setProfiles(loadProfiles());
    setProfile((current) => (current?.id === next.id ? next : current));
  }

  function handleAdminSetAccess(
    profileId: string,
    action: 'activate' | 'revoke',
  ) {
    const target = loadProfiles().find((entry) => entry.id === profileId);
    if (!target) return;
    const updated =
      action === 'activate'
        ? setProfileAccess(target, 12)
        : revokeProfileAccess(target);
    setProfiles(loadProfiles());
    setProfile((current) => (current?.id === updated.id ? updated : current));
  }

  async function handleAdminResetPin(profileId: string, pin: string) {
    const target = loadProfiles().find((entry) => entry.id === profileId);
    if (!target) return;
    const updated = await setProfilePin(target, pin);
    setProfiles(loadProfiles());
    setProfile((current) => (current?.id === updated.id ? updated : current));
  }

  function handleAdminSetRole(profileId: string, role: ProfileRole) {
    const target = loadProfiles().find((entry) => entry.id === profileId);
    if (!target) return;
    const updated = setProfileRole(target, role);
    setProfiles(loadProfiles());
    setProfile((current) => (current?.id === updated.id ? updated : current));
  }

  async function handleActivate(code: string): Promise<boolean> {
    if (!profile) return false;
    const updated = activateProfile(profile, code);
    if (!updated) return false;
    setProfile(updated);
    setProfiles(loadProfiles());
    return true;
  }

  if (!profile) {
    return (
      <LoginScreen
        profiles={profiles}
        initialMode={profiles.length > 0 ? 'list' : 'create'}
        hasLegacyData={hasLegacyData()}
        onLogin={handleLogin}
        onCreate={handleCreate}
      />
    );
  }

  const access = getAccess(profile);

  if (access.state === 'expired') {
    return (
      <Paywall
        profile={profile}
        appSettings={appSettings}
        onActivate={handleActivate}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <WorkshopApp
      key={profile.id}
      profile={profile}
      profiles={profiles}
      access={access}
      appSettings={appSettings}
      onUpdateProfile={handleUpdateProfile}
      onActivate={handleActivate}
      onLogout={handleLogout}
      onSaveAppSettings={handleSaveAppSettings}
      onAdminUpdateProfile={handleAdminUpdateProfile}
      onAdminSetAccess={handleAdminSetAccess}
      onAdminResetPin={handleAdminResetPin}
      onAdminSetRole={handleAdminSetRole}
    />
  );
}
