import { ArrowLeft, Building2, CalendarDays, Check, Clock3, MapPin, MessageCircle, Send, ShieldCheck, UserRound, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import ItemVisual from '../components/ItemVisual.jsx';
import ProfileAvatar from '../components/ProfileAvatar.jsx';
import { ClaimBadge, ReportBadge, StatusBadge } from '../components/StatusBadge.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../services/api.js';

const fullDate = new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeStyle: 'short' });

export default function ItemDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { profile } = useProfile();
  const [item, setItem] = useState(null);
  const [claims, setClaims] = useState([]);
  const [proof, setProof] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.created ? 'เผยแพร่ประกาศเรียบร้อยแล้ว' : '');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api(`/items/${id}`);
      setItem(result.item);
      if (profile) {
        const claimResult = await api(`/claims/item/${id}`);
        setClaims(claimResult.claims);
      } else setClaims([]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [id, profile]);

  useEffect(() => { load(); }, [load]);

  async function submitClaim(event) {
    event.preventDefault();
    setSubmitting(true); setError(''); setNotice('');
    try {
      await api(`/claims/item/${id}`, { method: 'POST', body: JSON.stringify({ proofDetails: proof }) });
      setProof(''); setNotice('ส่งคำขอแล้ว ผู้ประกาศจะตรวจสอบรายละเอียดของคุณ'); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  async function reviewClaim(claimId, decision) {
    setSubmitting(true); setError('');
    try {
      await api(`/claims/${claimId}`, { method: 'PATCH', body: JSON.stringify({ decision }) });
      setNotice(decision === 'APPROVED' ? 'ยืนยันเจ้าของแล้ว' : 'ปฏิเสธคำขอแล้ว'); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  async function submitReply(event, claimId) {
    event.preventDefault();
    const message = String(replyDrafts[claimId] || '').trim();
    if (!message) return;
    setSubmitting(true); setError(''); setNotice('');
    try {
      await api(`/claims/${claimId}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
      setReplyDrafts((current) => ({ ...current, [claimId]: '' }));
      setNotice('ส่งข้อความตอบกลับแล้ว');
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  async function markReturned() {
    setSubmitting(true);
    try {
      await api(`/items/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'RETURNED' }) });
      setNotice('บันทึกการส่งคืนเรียบร้อยแล้ว'); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <main className="page-state">กำลังโหลดรายละเอียด...</main>;
  if (!item) return <main className="page-state"><h1>ไม่พบประกาศ</h1><p>{error}</p><Link className="button button-primary" to="/">กลับหน้าหลัก</Link></main>;
  const isOwner = profile && profile.id === String(item.owner_profile_id);
  const myClaim = !isOwner ? claims[0] : null;
  const canClaim = profile && !isOwner && !myClaim && ['OPEN', 'CLAIM_PENDING'].includes(item.status);
  const ownerProfile = { id: item.owner_profile_id, nickname: item.owner_name, avatar_kind: item.owner_avatar_kind, has_avatar: item.owner_has_avatar };

  const renderClaim = (claim) => (
    <article className="claim-card" key={claim.id}>
      <div className="claim-card-top"><strong>{claim.claimant_name}</strong><ClaimBadge status={claim.status} /></div>
      <div className="claim-proof"><span>รายละเอียดที่ส่งเพื่อยืนยันความเป็นเจ้าของ</span><p>{claim.proof_details}</p></div>
      <small>ส่งเมื่อ {fullDate.format(new Date(claim.created_at))}</small>
      {isOwner && claim.status === 'PENDING' && <div className="claim-actions"><button className="button button-primary button-small" onClick={() => reviewClaim(claim.id, 'APPROVED')} disabled={submitting}><Check size={16} /> ยืนยัน</button><button className="button button-ghost button-small" onClick={() => reviewClaim(claim.id, 'REJECTED')} disabled={submitting}><X size={16} /> ไม่ใช่เจ้าของ</button></div>}
      <div className="claim-conversation">
        <div className="conversation-title"><MessageCircle size={17} /><strong>การตอบกลับ</strong><span>{claim.messages?.length || 0} ข้อความ</span></div>
        {claim.messages?.length ? <div className="message-list">{claim.messages.map((message) => {
          const isMine = profile && String(message.sender_profile_id) === profile.id;
          return <div className={`claim-message ${isMine ? 'is-mine' : ''}`} key={message.id}><div><strong>{isMine ? 'คุณ' : message.sender_name}</strong><small>{fullDate.format(new Date(message.created_at))}</small></div><p>{message.message}</p></div>;
        })}</div> : <p className="conversation-empty">ยังไม่มีข้อความตอบกลับ คุณสามารถถามหรือให้รายละเอียดเพิ่มเติมได้ที่นี่</p>}
        <form className="reply-form" onSubmit={(event) => submitReply(event, claim.id)}>
          <label htmlFor={`reply-${claim.id}`}>ตอบกลับ</label>
          <div><textarea id={`reply-${claim.id}`} value={replyDrafts[claim.id] || ''} onChange={(event) => setReplyDrafts((current) => ({ ...current, [claim.id]: event.target.value }))} maxLength="1500" rows="2" placeholder="พิมพ์ข้อความหรือสอบถามรายละเอียดเพิ่มเติม..." required /><button className="button button-primary button-small" type="submit" disabled={submitting || !String(replyDrafts[claim.id] || '').trim()}><Send size={16} /> ส่ง</button></div>
        </form>
      </div>
    </article>
  );

  return (
    <main className="detail-page">
      <div className="container">
        <Link className="back-link" to="/"><ArrowLeft size={17} /> กลับไปหน้าค้นหา</Link>
        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <div className="detail-grid">
          <section className="detail-visual"><ItemVisual item={item} large />{item.images?.length > 1 && <div className="image-count">มีทั้งหมด {item.images.length} รูป</div>}</section>
          <section className="detail-content">
            <div className="detail-badges"><ReportBadge type={item.report_type} /><StatusBadge status={item.status} /></div>
            <p className="detail-category">{item.category}</p>
            <h1>{item.title}</h1>
            <p className="detail-description">{item.description}</p>
            <dl className="detail-meta">
              <div><Building2 /><dt>ตึก</dt><dd>{item.building_code}</dd></div>
              <div><MapPin /><dt>บริเวณ</dt><dd>{item.room}</dd></div>
              <div><CalendarDays /><dt>วันที่เกิดเหตุ</dt><dd>{fullDate.format(new Date(item.event_date))}</dd></div>
              <div><Clock3 /><dt>ลงประกาศ</dt><dd>{fullDate.format(new Date(item.created_at))}</dd></div>
            </dl>
            <div className="reporter-line"><span>ผู้ประกาศ</span><span className="reporter-profile"><ProfileAvatar profile={ownerProfile} size="small" /><strong>{item.owner_name}</strong></span></div>
            {isOwner && item.contact_note && <div className="private-note"><ShieldCheck /><div><strong>ข้อมูลส่วนตัวของประกาศ</strong><p>{item.contact_note}</p></div></div>}
            {isOwner && item.status === 'MATCHED' && <button className="button button-primary" type="button" onClick={markReturned} disabled={submitting}><Check size={18} /> ยืนยันว่าส่งคืนแล้ว</button>}
          </section>
        </div>

        <section className="claim-section">
          {canClaim && <div className="claim-form-wrap"><div><span className="eyebrow">คิดว่าเป็นของคุณ?</span><h2>ส่งรายละเอียดเพื่อยืนยัน</h2><p>เขียนรายละเอียดที่พิสูจน์ว่าคุณเป็นเจ้าของให้ได้มากที่สุด เช่น ตำหนิ สิ่งของด้านใน หรือจุดและเวลาที่ทำหาย ข้อมูลและบทสนทนานี้เห็นเฉพาะคุณกับผู้ประกาศ</p></div><form onSubmit={submitClaim}><label><span>รายละเอียดที่ใช้พิสูจน์</span><textarea value={proof} onChange={(event) => setProof(event.target.value)} minLength="10" maxLength="1500" rows="5" placeholder="ระบุลักษณะเฉพาะ ตำหนิ สิ่งของด้านใน จุดและเวลาที่คาดว่าทำหาย..." required /></label><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'กำลังส่ง...' : 'ส่งคำขอรับของ'}</button></form></div>}
          {!profile && ['OPEN', 'CLAIM_PENDING'].includes(item.status) && <div className="login-callout"><UserRound /><div><h2>คิดว่าเป็นของคุณ?</h2><p>ตั้งชื่อเล่นสั้น ๆ ก่อนส่งรายละเอียดให้ผู้ประกาศ</p></div><Link className="button button-primary" to="/profile" state={{ returnTo: location.pathname }}>ตั้งชื่อเล่น</Link></div>}
          {isOwner && <div className="owner-claims"><div className="section-heading"><div><span className="eyebrow">เฉพาะผู้ประกาศ</span><h2>คำขอรับสิ่งของ</h2></div><p>{claims.length} คำขอ</p></div>{claims.length ? <div className="claim-list">{claims.map(renderClaim)}</div> : <p className="muted-box">ยังไม่มีคำขอรับสิ่งของ</p>}</div>}
          {myClaim && <div className="owner-claims my-claim"><div className="section-heading"><div><span className="eyebrow">เห็นเฉพาะคุณและผู้ประกาศ</span><h2>คำขอรับของของฉัน</h2></div><ClaimBadge status={myClaim.status} /></div><div className="claim-list">{renderClaim(myClaim)}</div></div>}
        </section>
      </div>
    </main>
  );
}

