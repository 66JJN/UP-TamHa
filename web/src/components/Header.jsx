import { Menu, Plus, Search, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.jsx';
import ProfileAvatar from './ProfileAvatar.jsx';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { profile } = useProfile();
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/" onClick={close} aria-label="UP TamHa หน้าหลัก">
          <span className="brand-mark" aria-hidden="true">UP</span>
          <span><strong>TamHa</strong><small>ศูนย์รวมของหาย ม.พะเยา</small></span>
        </Link>

        <button className="icon-button menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="เปิดเมนู" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="เมนูหลัก">
          <NavLink to="/" onClick={close}><Search size={18} /> ค้นหาของ</NavLink>
          {profile && <NavLink to="/dashboard" onClick={close}><UserRound size={18} /> รายการของฉัน</NavLink>}
          {profile ? (
            <>
              <Link className="button button-primary button-small" to="/report" onClick={close}><Plus size={18} /> ลงประกาศ</Link>
              <Link className="nav-profile" to="/profile" onClick={close}><ProfileAvatar profile={profile} size="small" /><span>{profile.nickname}</span></Link>
            </>
          ) : (
            <Link className="button button-primary button-small" to="/profile" onClick={close}>ตั้งชื่อเล่น</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

