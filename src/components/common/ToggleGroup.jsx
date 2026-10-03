export default function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {label && <span style={{ fontSize: 12, color: "#888" }}>{label}</span>}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          border: "1px solid #e0e0e0",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {options.map((o, i) => {
          const v = typeof o === "object" ? o.value : o;
          const text = typeof o === "object" ? o.label : o;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontFamily: "monospace",
                cursor: "pointer",
                border: "none",
                borderLeft: i ? "1px solid #e0e0e0" : "none",
                background: value === v ? "#1a1a1a" : "#fff",
                color: value === v ? "#fff" : "#888",
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
