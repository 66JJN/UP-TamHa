import { Camera, Cat, Dog, Eye, EyeOff, LogIn, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileAvatar from '../components/ProfileAvatar.jsx';
import { useProfile } from '../context/ProfileContext.jsx';

export default function ProfilePage() {
  const { profile, authMethod, register, login, upgradeLegacy, saveProfile, logout } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState('register');
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarKind, setAvatarKind] = useState(profile?.avatar_kind === 'DOG' ? 'DOG' : 'CAT');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNickname(profile?.nickname || '');
    setAvatarKind(profile?.avatar_kind === 'DOG' ? 'DOG' : 'CAT');
  }, [profile]);

  useEffect(() => {
    if (!avatarFile) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(avatarFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  async function submitAuth(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      if (mode === 'register') await register({ nickname: nickname.trim(), username, password });
      else await login({ username, password });
      navigate(location.state?.returnTo || '/dashboard', { replace: true });
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function secureLegacyProfile(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await upgradeLegacy({ username, password });
      navigate(location.state?.returnTo || '/dashboard', { replace: true });
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function submitProfile(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await saveProfile({ nickname: nickname.trim(), avatarKind, avatarFile });
      navigate(location.state?.returnTo || '/dashboard', { replace: true });
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function signOut() {
    await logout();
    setUsername(''); setPassword(''); setMode('login');
  }

  if (!profile) return (
    <main className="profile-page">
      <section className="profile-card auth-card">
        <div className="profile-card-copy">
          <span className="profile-icon">{mode === 'register' ? <UserPlus /> : <LogIn />}</span>
          <span className="eyebrow">บัญชี TamHa</span>
          <h1>{mode === 'register' ? 'สร้างบัญชีแบบง่าย' : 'ยินดีต้อนรับกลับมา'}</h1>
          <p>{mode === 'register' ? 'มีเพียง 3 ช่อง เพื่อให้กลับมาแก้ประกาศและอ่านข้อความได้แม้เปลี่ยนเครื่องหรือล้างข้อมูลเว็บ' : 'เข้าสู่ระบบเพื่อกลับไปยังประกาศ คำขอ และบทสนทนาของคุณ'}</p>
        </div>
        <form className="profile-form" onSubmit={submitAuth}>
          <div className="auth-mode-switch" role="tablist"><button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => { setMode('register'); setError(''); }}>สร้างบัญชี</button><button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => { setMode('login'); setError(''); }}>เข้าสู่ระบบ</button></div>
          {mode === 'register' && <label className="form-field"><span className="field-label">ชื่อเล่น <span>*</span></span><input autoFocus autoComplete="nickname" maxLength="60" minLength="2" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="ชื่อที่แสดงบนเว็บ เช่น มิน" required /></label>}
          <label className="form-field"><span className="field-label">ชื่อผู้ใช้ <span>*</span></span><input autoFocus={mode === 'login'} autoCapitalize="none" autoComplete="username" maxLength="40" minLength="3" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="สำหรับเข้าสู่ระบบ" required /><small className="field-hint">3–40 ตัวอักษร และห้ามซ้ำกับผู้อื่น</small></label>
          <label className="form-field"><span className="field-label">รหัสผ่าน <span>*</span></span><span className="password-input"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength="8" maxLength="128" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" required /><button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="button button-primary profile-submit" type="submit" disabled={saving}>{saving ? 'กำลังดำเนินการ...' : mode === 'register' ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}</button>
        </form>
      </section>
    </main>
  );

  if (authMethod === 'legacy') return (
    <main className="profile-page">
      <section className="profile-card auth-card">
        <div className="profile-card-copy"><span className="profile-icon"><ShieldCheck /></span><span className="eyebrow">รักษาประกาศเดิมไว้</span><h1>ป้องกันบัญชีของ {profile.nickname}</h1><p>บัญชีนี้สร้างก่อนมีระบบเข้าสู่ระบบ ตั้งชื่อผู้ใช้และรหัสผ่านครั้งเดียว แล้วคุณจะกลับมาใช้บัญชีเดิมได้ทุกเครื่อง</p></div>
        <form className="profile-form" onSubmit={secureLegacyProfile}>
          <div className="legacy-profile"><ProfileAvatar profile={profile} size="large" /><div><strong>{profile.nickname}</strong><span>ประกาศและคำขอเดิมจะอยู่ครบ</span></div></div>
          <label className="form-field"><span className="field-label">ชื่อผู้ใช้ใหม่ <span>*</span></span><input autoFocus autoCapitalize="none" autoComplete="username" minLength="3" maxLength="40" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
          <label className="form-field"><span className="field-label">รหัสผ่านใหม่ <span>*</span></span><span className="password-input"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength="8" maxLength="128" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="button button-primary profile-submit" type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'ตั้งค่าการเข้าสู่ระบบ'}</button>
          <button className="profile-reset" type="button" onClick={signOut}>ใช้บัญชีอื่นแทน</button>
        </form>
      </section>
    </main>
  );

  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-card-copy"><span className="profile-icon"><UserRound /></span><span className="eyebrow">บัญชีของฉัน</span><h1>แก้ไขโปรไฟล์</h1><p>ปรับชื่อที่แสดงและรูปโปรไฟล์ได้โดยไม่กระทบชื่อผู้ใช้สำหรับเข้าสู่ระบบ</p></div>
        <form className="profile-form" onSubmit={submitProfile}>
          <label className="form-field"><span className="field-label">ชื่อเล่น <span>*</span></span><input autoFocus maxLength="60" minLength="2" value={nickname} onChange={(event) => setNickname(event.target.value)} required /></label>
          <fieldset className="avatar-fieldset"><legend>เลือกรูปโปรไฟล์</legend><div className="avatar-options"><label className={avatarKind === 'CAT' && !avatarFile ? 'selected' : ''}><input type="radio" name="avatar" checked={avatarKind === 'CAT' && !avatarFile} onChange={() => { setAvatarKind('CAT'); setAvatarFile(null); }} /><img src="/avatars/cat.svg" alt="รูปแมว" /><span><Cat size={17} /> แมว</span></label><label className={avatarKind === 'DOG' && !avatarFile ? 'selected' : ''}><input type="radio" name="avatar" checked={avatarKind === 'DOG' && !avatarFile} onChange={() => { setAvatarKind('DOG'); setAvatarFile(null); }} /><img src="/avatars/dog.svg" alt="รูปหมา" /><span><Dog size={17} /> หมา</span></label><label className={`avatar-upload ${avatarFile ? 'selected' : ''}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />{preview ? <img src={preview} alt="ตัวอย่างรูปที่เลือก" /> : profile?.has_avatar ? <ProfileAvatar profile={profile} size="large" /> : <Camera />}<span>{avatarFile ? 'เปลี่ยนรูป' : 'อัปโหลดเอง'}</span></label></div><small>ไม่อัปโหลดก็ใช้รูปหมาหรือแมวได้ · JPG, PNG, WebP ไม่เกิน 3 MB</small></fieldset>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="button button-primary profile-submit" type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}</button>
          <button className="profile-reset" type="button" onClick={signOut}>ออกจากระบบบนเครื่องนี้</button>
        </form>
      </section>
    </main>
  );
}
