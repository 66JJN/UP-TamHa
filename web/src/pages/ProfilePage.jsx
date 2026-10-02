import { Camera, Cat, Dog, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileAvatar from '../components/ProfileAvatar.jsx';
import { useProfile } from '../context/ProfileContext.jsx';

export default function ProfilePage() {
  const { profile, saveProfile, clearProfile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [avatarKind, setAvatarKind] = useState(profile?.avatar_kind === 'DOG' ? 'DOG' : 'CAT');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!avatarFile) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(avatarFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveProfile({ nickname: nickname.trim(), avatarKind, avatarFile });
      navigate(location.state?.returnTo || '/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function resetProfile() {
    clearProfile();
    setNickname('');
    setAvatarKind('CAT');
    setAvatarFile(null);
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-card-copy">
          <span className="profile-icon"><UserRound /></span>
          <span className="eyebrow">โปรไฟล์แบบง่าย</span>
          <h1>{profile ? 'แก้ไขโปรไฟล์' : 'ก่อนเริ่ม ขอชื่อเล่นหน่อย'}</h1>
          <p>ไม่ต้องสมัครสมาชิกหรือจำรหัสผ่าน ใช้ชื่อเล่นสำหรับลงประกาศและขอรับของเท่านั้น</p>
        </div>

        <form className="profile-form" onSubmit={submit}>
          <label className="form-field">
            <span className="field-label">ชื่อเล่น <span>*</span></span>
            <input autoFocus maxLength="60" minLength="2" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="เช่น มิน, นนท์, ฟ้า" required />
          </label>

          <fieldset className="avatar-fieldset">
            <legend>เลือกรูปโปรไฟล์</legend>
            <div className="avatar-options">
              <label className={avatarKind === 'CAT' && !avatarFile ? 'selected' : ''}>
                <input type="radio" name="avatar" checked={avatarKind === 'CAT' && !avatarFile} onChange={() => { setAvatarKind('CAT'); setAvatarFile(null); }} />
                <img src="/avatars/cat.svg" alt="รูปแมว" /><span><Cat size={17} /> แมว</span>
              </label>
              <label className={avatarKind === 'DOG' && !avatarFile ? 'selected' : ''}>
                <input type="radio" name="avatar" checked={avatarKind === 'DOG' && !avatarFile} onChange={() => { setAvatarKind('DOG'); setAvatarFile(null); }} />
                <img src="/avatars/dog.svg" alt="รูปหมา" /><span><Dog size={17} /> หมา</span>
              </label>
              <label className={`avatar-upload ${avatarFile ? 'selected' : ''}`}>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
                {preview ? <img src={preview} alt="ตัวอย่างรูปที่เลือก" /> : profile?.has_avatar ? <ProfileAvatar profile={profile} size="large" /> : <Camera />}
                <span>{avatarFile ? 'เปลี่ยนรูป' : 'อัปโหลดเอง'}</span>
              </label>
            </div>
            <small>ไม่อัปโหลดก็ใช้รูปหมาหรือแมวได้ · JPG, PNG, WebP ไม่เกิน 3 MB</small>
          </fieldset>

          {error && <div className="alert alert-error">{error}</div>}
          <button className="button button-primary profile-submit" type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : profile ? 'บันทึกโปรไฟล์' : 'เริ่มใช้งาน'}</button>
          {profile && <button className="profile-reset" type="button" onClick={resetProfile}>เปลี่ยนเป็นโปรไฟล์ใหม่บนเครื่องนี้</button>}
        </form>
      </section>
    </main>
  );
}
