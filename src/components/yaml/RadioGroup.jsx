export default function RadioGroup({ name, value, onChange, options }) {
  return (
    <div style={{ display: "inline-flex", gap: 14, flexWrap: "wrap" }}>
      {options.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
            fontSize: 12,
            color: value === opt.value ? "#1a1a1a" : "#555",
            fontWeight: value === opt.value ? 600 : 400,
          }}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ cursor: "pointer" }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
