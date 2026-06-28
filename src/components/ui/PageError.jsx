export default function PageError({ message }) {
  return (
    <div className="page-error">
      <div className="page-error__icon">⚠️</div>
      <p className="page-error__title">Something went wrong</p>
      <p className="page-error__message">{message}</p>
    </div>
  );
}