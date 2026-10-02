import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <main className="page-state"><span className="error-number">404</span><h1>ไม่พบหน้าที่ต้องการ</h1><p>ลิงก์อาจไม่ถูกต้องหรือประกาศถูกปิดไปแล้ว</p><Link className="button button-primary" to="/"><ArrowLeft size={17} /> กลับหน้าหลัก</Link></main>;
}

