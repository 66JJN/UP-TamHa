import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong>UP TamHa</strong>
          <p>ของหาย... มาหาที่ TamHa</p>
        </div>
        <div className="footer-meta">
          <Link to="/">ค้นหาประกาศ</Link>
          <span>Application Development with Cloud Platform</span>
        </div>
      </div>
    </footer>
  );
}

