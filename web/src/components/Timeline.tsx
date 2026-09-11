import { StrandEvent } from "../api";

export function Timeline({ events }: { events: StrandEvent[] }) {
  if (events.length === 0) {
    return <p className="empty">No events to show.</p>;
  }

  return (
    <ul className="timeline">
      {events.map((event) => (
        <li key={event.id} className="event">
          <span className={`badge badge-${event.type}`}>{event.type}</span>
          <div className="event-body">
            <div className="event-title">{event.title}</div>
            <div className="event-content">{event.content}</div>
            <div className="event-timestamp">{new Date(event.timestamp).toLocaleString()}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
