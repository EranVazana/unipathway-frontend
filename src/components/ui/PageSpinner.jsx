export default function PageSpinner({ message = 'Loading...' }) {
  return (
    <div className="page-spinner">
      <div className="page-spinner__ring">
        <div /><div /><div /><div />
      </div>
      <p className="page-spinner__text">{message}</p>
    </div>
  );
}