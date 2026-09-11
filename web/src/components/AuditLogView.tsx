import { AuditEntry } from "../api";

export function AuditLogView({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="empty">No audit entries yet.</p>;
  }

  return (
    <table className="audit-log">
      <thead>
        <tr>
          <th>Time</th>
          <th>Action</th>
          <th>Category</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{new Date(entry.timestamp).toLocaleString()}</td>
            <td>{entry.action}</td>
            <td>{entry.eventType ?? "—"}</td>
            <td className={`result-${entry.result.toLowerCase()}`}>{entry.result}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
