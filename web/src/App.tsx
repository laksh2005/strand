import { useEffect, useState } from "react";
import {
  AuditEntry,
  EventType,
  Permission,
  StrandEvent,
  listAuditLog,
  listEvents,
  listPermissions,
  setPermission,
} from "./api";
import { Timeline } from "./components/Timeline";
import { TypeFilter } from "./components/TypeFilter";
import { PrivacyToggles } from "./components/PrivacyToggles";
import { AuditLogView } from "./components/AuditLogView";

export default function App() {
  const [events, setEvents] = useState<StrandEvent[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState<EventType | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  async function refreshEvents(type?: EventType) {
    const { events } = await listEvents(type);
    setEvents(events);
  }

  async function refreshAll() {
    try {
      const [permissions, audit] = await Promise.all([listPermissions(), listAuditLog()]);
      setPermissions(permissions);
      setAuditEntries(audit.entries);
      await refreshEvents(typeFilter);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshEvents(typeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  async function handleToggle(type: EventType, enabled: boolean) {
    await setPermission(type, enabled);
    await refreshAll();
  }

  return (
    <div className="app">
      <header>
        <h1>Strand</h1>
        <p className="subtitle">Your day, on your terms.</p>
      </header>

      {error && <div className="error">{error}</div>}

      <section>
        <h2>Privacy</h2>
        <PrivacyToggles permissions={permissions} onToggle={handleToggle} />
      </section>

      <section>
        <h2>Timeline</h2>
        <TypeFilter value={typeFilter} onChange={setTypeFilter} />
        <Timeline events={events} />
      </section>

      <section>
        <h2>Audit Log</h2>
        <AuditLogView entries={auditEntries} />
      </section>
    </div>
  );
}
