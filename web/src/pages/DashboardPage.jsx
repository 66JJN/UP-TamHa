import { ArrowRight, ClipboardList, Inbox, Plus, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import { ClaimBadge, ReportBadge, StatusBadge } from '../components/StatusBadge.jsx';
import ProfileAvatar from '../components/ProfileAvatar.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../services/api.js';
import { locationLabel } from '../constants/appData.js';

export default function DashboardPage() {
  const { profile } = useProfile();
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [sentClaims, setSentClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [itemResult, sentResult, receivedResult] = await Promise.all([api('/items/mine'), api('/claims/mine'), api('/claims/received')]);
      setItems(itemResult.items); setSentClaims(sentResult.claims); setReceivedClaims(receivedResult.claims);
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(itemId, status) {
    try { await api(`/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load(); }
    catch (requestError) { setError(requestError.message); }
  }

  function claimList(claims, received = false) {
    return claims.length ? <div className="dashboard-list">{claims.map((claim) => <article className="dashboard-row" key={claim.id}><div className="dashboard-row-main"><ClaimBadge status={claim.status} /><Link to={`/items/${claim.item_id}`}>{claim.item_title}</Link><p>{received ? `${claim.claimant_name} ส่งคำขอ` : 'ส่งคำขอ'}เมื่อ {new Date(claim.created_at).toLocaleDateString('th-TH')} · {claim.messages?.length || 0} ข้อความ</p></div><Link aria-label={`ดู ${claim.item_title}`} to={`/items/${claim.item_id}`}><ArrowRight /></Link></article>)}</div> : <EmptyState title={received ? 'ยังไม่มีคำขอที่ได้รับ' : 'ยังไม่มีคำขอที่ส่ง'} description={received ? 'เมื่อมีคนขอรับของจากประกาศของคุณ คำขอจะแสดงที่นี่' : 'คำขอรับของที่คุณส่งจะแสดงที่นี่'} />;
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero"><div className="container dashboard-hero-inner"><ProfileAvatar profile={profile} size="large" /><div><span className="eyebrow">พื้นที่ของฉัน</span><h1>{profile.nickname}</h1><p>ดูประกาศและคำขอรับของของคุณ</p></div><Link className="button button-primary" to="/report"><Plus size={18} /> ลงประกาศใหม่</Link></div></section>
      <section className="container dashboard-content">
        <div className="stat-row"><article><strong>{items.length}</strong><span>ประกาศทั้งหมด</span></article><article><strong>{items.filter((item) => ['OPEN', 'CLAIM_PENDING'].includes(item.status)).length}</strong><span>กำลังดำเนินการ</span></article><article><strong>{receivedClaims.length}</strong><span>คำขอที่ได้รับ</span></article><article><strong>{sentClaims.length}</strong><span>คำขอที่ส่ง</span></article></div>
        <div className="tab-list" role="tablist"><button className={tab === 'items' ? 'active' : ''} onClick={() => setTab('items')} type="button"><ClipboardList size={18} /> ประกาศของฉัน</button><button className={tab === 'received' ? 'active' : ''} onClick={() => setTab('received')} type="button"><Inbox size={18} /> คำขอที่ได้รับ ({receivedClaims.length})</button><button className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')} type="button"><Send size={18} /> คำขอที่ส่ง ({sentClaims.length})</button></div>
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? <div className="page-state">กำลังโหลดข้อมูล...</div> : tab === 'items' ? (
          items.length ? <div className="dashboard-list">{items.map((item) => <article key={item.id} className="dashboard-row"><div className="dashboard-row-main"><div className="dashboard-row-badges"><ReportBadge type={item.report_type} /><StatusBadge status={item.status} /></div><Link to={`/items/${item.id}`}>{item.title}</Link><p>{locationLabel(item.building_code)} · {item.room}</p></div><div className="dashboard-row-actions">{!['RETURNED', 'CLOSED'].includes(item.status) && <button type="button" onClick={() => changeStatus(item.id, 'CLOSED')}>ปิดประกาศ</button>}<Link aria-label={`ดู ${item.title}`} to={`/items/${item.id}`}><ArrowRight /></Link></div></article>)}</div> : <EmptyState title="ยังไม่มีประกาศ" description="เริ่มต้นด้วยการแจ้งของหายหรือของที่พบ" />
        ) : tab === 'received' ? claimList(receivedClaims, true) : claimList(sentClaims)}
      </section>
    </main>
  );
}

