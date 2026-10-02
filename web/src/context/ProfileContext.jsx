import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getProfileId, setProfileId } from '../services/api.js';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(getProfileId()));

  useEffect(() => {
    const id = getProfileId();
    if (!id) return;
    api(`/profiles/${id}`)
      .then(({ profile: saved }) => setProfile(saved))
      .catch(() => setProfileId(null))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile({ nickname, avatarKind, avatarFile }) {
    let saved;
    if (profile) {
      ({ profile: saved } = await api(`/profiles/${profile.id}`, { method: 'PATCH', body: JSON.stringify({ nickname, avatarKind }) }));
    } else {
      ({ profile: saved } = await api('/profiles', { method: 'POST', body: JSON.stringify({ nickname, avatarKind }) }));
      setProfileId(saved.id);
    }
    if (avatarFile) {
      const upload = new FormData();
      upload.append('avatar', avatarFile);
      ({ profile: saved } = await api(`/profiles/${saved.id}/avatar`, { method: 'POST', body: upload }));
    }
    setProfile(saved);
    return saved;
  }

  function clearProfile() {
    setProfileId(null);
    setProfile(null);
  }

  const value = useMemo(() => ({ profile, loading, saveProfile, clearProfile }), [profile, loading]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
