export default function Card({ title, subtitle, meta, description, actions }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {meta && <p>{meta}</p>}
      {description && <p className="card-description">{description}</p>}
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  );
}