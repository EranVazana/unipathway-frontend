import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="layout">
      <Navbar />
      <main key={pathname} className="page-transition">
        {children}
      </main>
      <Footer />
    </div>
  );
}