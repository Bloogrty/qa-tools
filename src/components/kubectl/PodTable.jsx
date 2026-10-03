export default function PodTable({ pods, selected, onSelect, copiedName }) {
  const cell = {
    padding: "7px 10px",
    fontSize: 12,
    borderBottom: "1px solid #f0f0f0",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Name", "Ready", "Status", "Restarts", "Age"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#888",
                  padding: "6px 10px",
                  borderBottom: "1px solid #eee",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pods.map((p) => (
            <tr
              key={p.name}
              onClick={() => onSelect(p)}
              style={{
                cursor: "pointer",
                background:
                  copiedName === p.name
                    ? "#dcfce7"
                    : selected?.name === p.name
                      ? "#eff6ff"
                      : "transparent",
                transition: "background .15s",
              }}
            >
              <td style={{ ...cell, fontFamily: "monospace" }}>{p.name}</td>
              <td style={cell}>{p.ready}</td>
              <td style={cell}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 500,
                    background: p.status === "Running" ? "#f0fdf4" : "#fffbeb",
                    color: p.status === "Running" ? "#16a34a" : "#b45309",
                  }}
                >
                  {p.status}
                </span>
              </td>
              <td style={cell}>{p.restarts}</td>
              <td style={cell}>{p.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
