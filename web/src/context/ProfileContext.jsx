import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getProfileId, setProfileId } from '../services/api.js';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [authMethod, setAuthMethod] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreProfile() {
      try {
        const { profile: saved } = await api('/auth/me');
        setProfile(saved); setAuthMethod('session'); setProfileId(null);
      } catch {
        const id = getProfileId();
        if (!id) return;
        try {
          const { profile: saved } = await api(`/profiles/${id}`);
          setProfile(saved); setAuthMethod('legacy');
        } catch { setProfileId(null); }
      } finally { setLoading(false); }
    }
    restoreProfile();
  }, []);

  async function register({ nickname, username, password }) {
    const { profile: saved } = await api('/auth/register', { method: 'POST', body: JSON.stringify({ nickname, username, password }) });
    setProfileId(null); setProfile(saved); setAuthMethod('session');
    return saved;
  }

  async function login({ username, password }) {
    const { profile: saved } = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    setProfileId(null); setProfile(saved); setAuthMethod('session');
    return saved;
  }

  async function upgradeLegacy({ username, password }) {
    const { profile: saved } = await api('/auth/upgrade', { method: 'POST', body: JSON.stringify({ username, password }) });
    setProfileId(null); setProfile(saved); setAuthMethod('session');
    return saved;
  }

  async function saveProfile({ nickname, avatarKind, avatarFile }) {
    let saved;
    if (profile) {
      ({ profile: saved } = await api(`/profiles/${profile.id}`, { method: 'PATCH', body: JSON.stringify({ nickname, avatarKind }) }));
    } else throw new Error('กรุณาสร้างบัญชีหรือเข้าสู่ระบบก่อน');
    if (avatarFile) {
      const upload = new FormData();
      upload.append('avatar', avatarFile);
      ({ profile: saved } = await api(`/profiles/${saved.id}/avatar`, { method: 'POST', body: upload }));
    }
    setProfile(saved);
    return saved;
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* Clear local state even if the session already expired. */ }
    setProfileId(null);
    setProfile(null);
    setAuthMethod(null);
  }

  const value = useMemo(() => ({
    profile, loading, authMethod, register, login, upgradeLegacy, saveProfile, logout,
  }), [profile, loading, authMethod]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
