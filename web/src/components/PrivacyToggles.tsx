import { EventType, Permission } from "../api";

export function PrivacyToggles({
  permissions,
  onToggle,
}: {
  permissions: Permission[];
  onToggle: (type: EventType, enabled: boolean) => void;
}) {
  return (
    <div className="privacy-toggles">
      {permissions.map((permission) => (
        <label key={permission.id} className="toggle-row">
          <span>{permission.type}</span>
          <input
            type="checkbox"
            checked={permission.enabled}
            onChange={(e) => onToggle(permission.type, e.target.checked)}
          />
        </label>
      ))}
    </div>
  );
}
