import { Building2, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import ItemVisual from './ItemVisual.jsx';
import { ReportBadge, StatusBadge } from './StatusBadge.jsx';

const shortDate = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

export default function ItemCard({ item }) {
  return (
    <article className="item-card">
      <Link className="item-card-visual" to={`/items/${item.id}`} aria-label={`ดูรายละเอียด ${item.title}`}>
        <ItemVisual item={item} />
        <ReportBadge type={item.report_type} />
      </Link>
      <div className="item-card-body">
        <div className="item-card-status"><StatusBadge status={item.status} /></div>
        <Link className="item-card-title" to={`/items/${item.id}`}>{item.title}</Link>
        <p className="item-card-description">{item.description}</p>
        <dl className="item-card-meta">
          <div><Building2 size={16} /><dt>ตึก</dt><dd>{item.building_code}</dd></div>
          <div><MapPin size={16} /><dt>จุด</dt><dd>{item.room}</dd></div>
          <div><CalendarDays size={16} /><dt>วันที่</dt><dd>{shortDate.format(new Date(item.event_date))}</dd></div>
        </dl>
      </div>
    </article>
  );
}

