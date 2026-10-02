import { profileAvatarUrl } from '../services/api.js';

export default function ProfileAvatar({ profile, size = 'medium' }) {
  if (!profile) return null;
  const custom = profile.has_avatar || profile.avatar_kind === 'CUSTOM';
  const source = custom
    ? profileAvatarUrl(profile.id)
    : profile.avatar_kind === 'DOG' ? '/avatars/dog.svg' : '/avatars/cat.svg';
  return <img className={`profile-avatar profile-avatar-${size}`} src={source} alt={`รูปโปรไฟล์ของ ${profile.nickname || profile.owner_name}`} />;
}
