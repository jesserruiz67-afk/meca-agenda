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
  setSessionProfileId,
  updateProfile,
  type NewProfileInput,
  type Profile,
} from './lib/profiles';
import { hasLegacyData } from './lib/storage';

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles);
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
        onActivate={handleActivate}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <WorkshopApp
      key={profile.id}
      profile={profile}
      access={access}
      onUpdateProfile={handleUpdateProfile}
      onActivate={handleActivate}
      onLogout={handleLogout}
    />
  );
}
