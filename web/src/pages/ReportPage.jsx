import { ArrowLeft, ImagePlus, Info, Send } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import { BUILDINGS, CATEGORIES, ROOMS_BY_BUILDING } from '../constants/appData.js';
import { api } from '../services/api.js';

const emptyForm = {
  reportType: 'LOST', title: '', description: '', category: '', buildingCode: 'ICT', room: '',
  eventDate: new Date().toISOString().slice(0, 16),
};

export default function ReportPage() {
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value, ...(name === 'buildingCode' ? { room: '' } : {}) }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { item } = await api('/items', { method: 'POST', body: JSON.stringify(form) });
      if (files.length) {
        const upload = new FormData();
        files.forEach((file) => upload.append('images', file));
        await api(`/items/${item.id}/images`, { method: 'POST', body: upload });
      }
      navigate(`/items/${item.id}`, { state: { created: true } });
    } catch (requestError) {
      setError(requestError.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="form-page">
      <div className="container form-page-grid">
        <section className="form-main">
          <Link className="back-link" to="/"><ArrowLeft size={17} /> กลับหน้าหลัก</Link>
          <span className="eyebrow">สร้างประกาศใหม่</span>
          <h1>แจ้งรายละเอียดสิ่งของ</h1>
          <p className="form-lead">ข้อมูลที่ชัดเจนช่วยให้ค้นหาและส่งคืนได้เร็วขึ้น โดยไม่ต้องเปิดเผยข้อมูลสำคัญ</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form className="report-form" onSubmit={submit}>
            <fieldset className="type-selector">
              <legend>ประเภทประกาศ</legend>
              <label className={form.reportType === 'LOST' ? 'selected' : ''}><input type="radio" name="reportType" value="LOST" checked={form.reportType === 'LOST'} onChange={(event) => update('reportType', event.target.value)} /><span><strong>ของหาย</strong><small>กำลังตามหาสิ่งของของฉัน</small></span></label>
              <label className={form.reportType === 'FOUND' ? 'selected' : ''}><input type="radio" name="reportType" value="FOUND" checked={form.reportType === 'FOUND'} onChange={(event) => update('reportType', event.target.value)} /><span><strong>พบของ</strong><small>ต้องการส่งคืนให้เจ้าของ</small></span></label>
            </fieldset>

            <div className="form-section"><h2>ข้อมูลสิ่งของ</h2>
              <FormField label="ชื่อประกาศ" hint="ระบุลักษณะสำคัญ แต่ไม่เปิดเผยจุดพิสูจน์ทั้งหมด" required><input value={form.title} onChange={(event) => update('title', event.target.value)} minLength="3" maxLength="160" placeholder="เช่น กระเป๋าสตางค์สีดำ" required /></FormField>
              <FormField label="รายละเอียด" required><textarea value={form.description} onChange={(event) => update('description', event.target.value)} minLength="10" maxLength="2000" rows="5" placeholder="สี ลักษณะ จุดที่คาดว่าหายหรือพบ..." required /></FormField>
              <FormField label="หมวดหมู่" required><select value={form.category} onChange={(event) => update('category', event.target.value)} required><option value="">เลือกหมวดหมู่</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></FormField>
            </div>

            <div className="form-section"><h2>สถานที่และเวลา</h2>
              <div className="form-row">
                <FormField label="ตึก" required><select value={form.buildingCode} onChange={(event) => update('buildingCode', event.target.value)}>{BUILDINGS.map((building) => <option key={building.code} value={building.code}>{building.code} — {building.name}</option>)}</select></FormField>
                <FormField label="ห้องหรือบริเวณ" required><select value={form.room} onChange={(event) => update('room', event.target.value)} required><option value="">เลือกบริเวณ</option>{ROOMS_BY_BUILDING[form.buildingCode].map((room) => <option key={room}>{room}</option>)}</select></FormField>
              </div>
              <FormField label={form.reportType === 'LOST' ? 'วันที่คาดว่าทำหาย' : 'วันที่พบ'} required><input type="datetime-local" value={form.eventDate} max={new Date().toISOString().slice(0, 16)} onChange={(event) => update('eventDate', event.target.value)} required /></FormField>
            </div>

            <div className="form-section"><h2>รูปภาพ (ไม่บังคับ)</h2>
              <FormField label="รูปภาพ" hint="JPG, PNG หรือ WebP ไม่เกิน 5 MB ต่อรูป สูงสุด 3 รูป"><div className="file-picker"><ImagePlus /><span>{files.length ? `เลือกแล้ว ${files.length} รูป` : 'เลือกรูปภาพ'}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 3))} /></div></FormField>
            </div>
            <button className="button button-primary submit-button" type="submit" disabled={submitting}><Send size={18} />{submitting ? 'กำลังบันทึก...' : 'เผยแพร่ประกาศ'}</button>
          </form>
        </section>
        <aside className="form-aside"><Info /><h2>ก่อนเผยแพร่</h2><ul><li>อย่าแสดงรหัสนิสิต เลขบัตร หรือเบอร์โทรเต็ม</li><li>เก็บรายละเอียดหนึ่งจุดไว้ใช้ตรวจสอบเจ้าของ</li><li>ใช้ภาพที่ไม่เปิดเผยข้อมูลส่วนบุคคล</li><li>ปิดประกาศเมื่อได้รับของคืนแล้ว</li></ul></aside>
      </div>
    </main>
  );
}

