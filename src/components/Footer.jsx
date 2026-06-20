export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <p>UniPathway — Eran Vazana &amp; Omri Hershkovich</p>
      <p>{year}</p>
      <p>Your smart consultant for Israeli university admissions.</p>
    </footer>
  );
}
