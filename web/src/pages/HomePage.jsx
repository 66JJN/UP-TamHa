import { ArrowRight, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import ItemCard from '../components/ItemCard.jsx';
import LoadingGrid from '../components/LoadingGrid.jsx';
import { BUILDINGS, CATEGORIES } from '../constants/appData.js';
import { api } from '../services/api.js';

const initialFilters = { q: '', reportType: '', building: '', category: '', status: '' };

export default function HomePage() {
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams(Object.entries(applied).filter(([, value]) => value));
    try {
      const result = await api(`/items?${params}`);
      setItems(result.items);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { loadItems(); }, [loadItems]);

  function submitSearch(event) {
    event.preventDefault();
    setApplied(filters);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setApplied(initialFilters);
  }

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">ศูนย์รวมของหาย มหาวิทยาลัยพะเยา</span>
            <h1>ของหาย...<br /><em>มาหาที่ TamHa</em></h1>
            <p>ค้นหาและแจ้งของหายตามตึกเรียนอย่างเป็นระบบ เพื่อให้ของทุกชิ้นมีโอกาสกลับถึงเจ้าของ</p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/report">ลงประกาศ</Link>
              <a className="text-link" href="#latest">ดูประกาศล่าสุด <ArrowRight size={17} /></a>
            </div>
          </div>
          <div className="hero-panel" aria-label="วิธีใช้งานโดยย่อ">
            <div className="hero-panel-heading"><span>เลือกจุดที่ทำหาย</span><strong>6 จุดหลัก</strong></div>
            <ol className="building-path">
              {BUILDINGS.map((building, index) => (
                <li key={building.code}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{building.code}</strong><small>{building.name}</small></div></li>
              ))}
            </ol>
            <div className="trust-note"><ShieldCheck size={20} /><span>ข้อมูลยืนยันความเป็นเจ้าของจะไม่แสดงต่อสาธารณะ</span></div>
          </div>
        </div>
      </section>

      <section className="search-section" aria-label="ค้นหาประกาศ">
        <div className="container">
          <form className="search-panel" onSubmit={submitSearch}>
            <div className="search-input-wrap"><Search size={20} /><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="ค้นหาชื่อสิ่งของหรือรายละเอียด" aria-label="คำค้นหา" /></div>
            <select value={filters.reportType} onChange={(event) => setFilters({ ...filters, reportType: event.target.value })} aria-label="ประเภทประกาศ">
              <option value="">ทุกประเภท</option><option value="LOST">ของหาย</option><option value="FOUND">พบของ</option>
            </select>
            <select value={filters.building} onChange={(event) => setFilters({ ...filters, building: event.target.value })} aria-label="ตึก">
              <option value="">ทุกตึก</option>{BUILDINGS.map((building) => <option key={building.code} value={building.code}>{building.code}</option>)}
            </select>
            <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} aria-label="หมวดหมู่">
              <option value="">ทุกหมวด</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
            <button className="button button-primary" type="submit">ค้นหา</button>
          </form>
        </div>
      </section>

      <section className="latest-section" id="latest">
        <div className="container">
          <div className="section-heading">
            <div><span className="eyebrow">อัปเดตล่าสุด</span><h2>ประกาศของหายและของที่พบ</h2></div>
            <p>{loading ? 'กำลังตรวจสอบ...' : `พบ ${total} ประกาศ`}</p>
          </div>
          {error && <div className="alert alert-error">{error}<button type="button" onClick={loadItems}>ลองใหม่</button></div>}
          {loading ? <LoadingGrid /> : items.length ? <div className="items-grid">{items.map((item) => <ItemCard item={item} key={item.id} />)}</div> : <EmptyState />}
          {Object.values(applied).some(Boolean) && !loading && <div className="center-action"><button className="button button-ghost" type="button" onClick={resetFilters}>ล้างตัวกรอง</button></div>}
        </div>
      </section>

      <section className="how-section">
        <div className="container how-grid">
          <div><span className="eyebrow">ใช้งานอย่างมั่นใจ</span><h2>คืนของให้ถูกคน โดยไม่เปิดเผยข้อมูลสำคัญ</h2></div>
          <ul>
            <li><CheckCircle2 /><span><strong>ประกาศอย่างเป็นระบบ</strong>ระบุตึก ห้อง หมวดหมู่ และวันที่</span></li>
            <li><CheckCircle2 /><span><strong>ยืนยันแบบส่วนตัว</strong>รายละเอียดการขอรับเห็นได้เฉพาะผู้เกี่ยวข้อง</span></li>
            <li><CheckCircle2 /><span><strong>ติดตามสถานะได้</strong>รู้ว่ากำลังตามหา ตรวจสอบ หรือส่งคืนแล้ว</span></li>
          </ul>
        </div>
      </section>
    </main>
  );
}

