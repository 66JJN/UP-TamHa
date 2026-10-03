import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ItemDetailPage from './pages/ItemDetailPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { useProfile } from './context/ProfileContext.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function ProfileRequired({ children }) {
  const { profile, loading } = useProfile();
  const location = useLocation();
  if (loading) return <div className="page-state">กำลังโหลดโปรไฟล์...</div>;
  return profile ? children : <Navigate to="/profile" replace state={{ returnTo: location.pathname }} />;
}

export default function App() {
  const { authMethod } = useProfile();
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Header />
      {authMethod === 'legacy' && <div className="legacy-account-banner"><span>ป้องกันประกาศและบทสนทนาของคุณก่อนข้อมูลเบราว์เซอร์หาย</span><Link to="/profile">ตั้งชื่อผู้ใช้และรหัสผ่าน</Link></div>}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/report" element={<ProfileRequired><ReportPage /></ProfileRequired>} />
        <Route path="/dashboard" element={<ProfileRequired><DashboardPage /></ProfileRequired>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

