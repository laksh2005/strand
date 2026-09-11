import { EventType } from "../api";

const TYPES: EventType[] = ["conversation", "location", "physiological", "note"];

export function TypeFilter({
  value,
  onChange,
}: {
  value: EventType | undefined;
  onChange: (type: EventType | undefined) => void;
}) {
  return (
    <div className="type-filter">
      <button className={value === undefined ? "active" : ""} onClick={() => onChange(undefined)}>
        All
      </button>
      {TYPES.map((type) => (
        <button key={type} className={value === type ? "active" : ""} onClick={() => onChange(type)}>
          {type}
        </button>
      ))}
    </div>
  );
}
