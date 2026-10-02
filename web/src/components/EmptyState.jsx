import { SearchX } from 'lucide-react';

export default function EmptyState({ title = 'ยังไม่พบรายการ', description = 'ลองเปลี่ยนคำค้นหาหรือตัวกรองอีกครั้ง' }) {
  return (
    <div className="empty-state">
      <SearchX size={34} strokeWidth={1.5} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

