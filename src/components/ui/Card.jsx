export default function Card({ title, subtitle, meta, description, actions, logo, onClick, footer }) {
  const clickable = Boolean(onClick);
  return (
    <div
      className={`card${clickable ? ' card--clickable' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {logo && (
        <div className="card-logo">
          <img src={logo} alt={`${title} logo`} />
        </div>
      )}
      <h3 className="card__title">{title}</h3>
      {subtitle && <p className="card__subtitle">{subtitle}</p>}
      {meta && <p>{meta}</p>}
      {description && <p className="card-description card__clamp">{description}</p>}
      {actions && <div className="card-actions">{actions}</div>}
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}