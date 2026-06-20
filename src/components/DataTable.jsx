// columns: [{ key, label, render? }] — render(row) lets callers format a cell (e.g. status badges)
// rows: array of data objects from the backend
export default function DataTable({ columns, rows, emptyMessage = 'No data to display.' }) {
  if (!rows || rows.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.id ?? rowIndex}>
            {columns.map((col) => (
              <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
