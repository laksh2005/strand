export type EventType = "conversation" | "location" | "physiological" | "note";

export interface StrandEvent {
  id: string;
  userId: string;
  type: EventType;
  title: string;
  content: string;
  timestamp: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  userId: string;
  type: EventType;
  enabled: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  eventType: EventType | null;
  result: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function listEvents(type?: EventType) {
  const query = type ? `?type=${type}` : "";
  return request<{ events: StrandEvent[]; total: number }>(`/events${query}`);
}

export function listPermissions() {
  return request<Permission[]>("/permissions");
}

export function setPermission(type: EventType, enabled: boolean) {
  return request<Permission>(`/permissions/${type}`, {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
}

export function listAuditLog() {
  return request<{ entries: AuditEntry[]; total: number }>("/audit-log?limit=50");
}
