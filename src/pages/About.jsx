import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🎓',
    title: 'Smart Admission Insights',
    description: 'Compare your Sekem score against historical admission thresholds across every department in Israel.'
  },
  {
    icon: '📊',
    title: 'Academic Score Tracking',
    description: 'Enter your Bagrut and Psychometric scores once — we calculate your Sekem automatically.'
  },
  {
    icon: '🔖',
    title: 'Personal Watchlist',
    description: 'Save departments you&apos;re interested in and track your admission likelihood as thresholds update.'
  },
  {
    icon: '🏛️',
    title: 'Full University Coverage',
    description: 'Browse all Israeli universities and their departments, with real-time data on faculties and degree types.'
  },
  {
    icon: '🔒',
    title: 'Role-Based Access',
    description: 'Students manage their own data. Editors keep information up to date. Admins oversee the platform.'
  },
  {
    icon: '⚡',
    title: 'Built for Speed',
    description: 'Fast, responsive, and works on any device — whether you&apos;re on a laptop or your phone.'
  }
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <img src="/logo.svg?v=2" alt="UniPathway" className="about-hero__logo" />
        <h1 className="about-hero__title">About UniPathway</h1>
        <p className="about-hero__subtitle">Your Smart Academic Consultant</p>
        <p className="about-hero__desc">
          UniPathway helps Israeli students make confident university decisions.
          We combine your academic scores with real admission data to show you
          exactly where you stand — so you can apply smarter, not harder.
        </p>
        <button type="button" className="btn-primary" onClick={() => navigate('/home')}>
          Get Started
        </button>
      </section>

      {/* Features */}
      <section className="about-features">
        <h2>What We Offer</h2>
        <div className="about-features__grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="about-feature-card">
              <span className="about-feature-card__icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <section className="about-footer-note">
        <p>Built as part of the Web Development Environments course at Ben-Gurion University of the Negev.</p>
      </section>

    </div>
  );
}