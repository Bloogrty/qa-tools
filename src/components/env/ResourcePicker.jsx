import ToggleGroup from "../common/ToggleGroup";
import CliToggle from "../kubectl/CliToggle";
import { useWorkspace } from "../../hooks/useWorkspace";
import { RESOURCE_TYPES, resolveResource } from "../../utils/envList";

export default function ResourcePicker({ label, value, onChange }) {
  const ws = useWorkspace();
  const r = resolveResource(value, ws);
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 8, padding: 12 }}>
      {label && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 10,
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <CliToggle value={r.cli} onChange={(cli) => set({ cli })} />
        <ToggleGroup
          label="Namespace"
          options={ws.namespaces}
          value={r.ns}
          onChange={(ns) => set({ ns })}
        />
        <ToggleGroup
          label="Type"
          options={RESOURCE_TYPES}
          value={r.type}
          onChange={(type) => set({ type })}
        />
      </div>
      <input
        value={value.name}
        onChange={(e) => set({ name: e.target.value })}
        placeholder="Name, e.g. orders-api"
        style={{
          width: "100%",
          padding: "6px 10px",
          fontSize: 12,
          fontFamily: "monospace",
          border: "1px solid #e0e0e0",
          borderRadius: 6,
        }}
      />
    </div>
  );
}
