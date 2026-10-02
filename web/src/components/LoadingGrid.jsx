export default function LoadingGrid() {
  return (
    <div className="items-grid" aria-label="กำลังโหลดข้อมูล">
      {[1, 2, 3, 4, 5, 6].map((key) => <div className="skeleton-card" key={key}><span /><div><i /><i /><i /></div></div>)}
    </div>
  );
}

