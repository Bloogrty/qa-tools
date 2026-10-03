const COLORS = {
  green: { bg: "#f0fdf4", text: "#16a34a", border: "#86efac" },
  red: { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5" },
  amber: { bg: "#fffbeb", text: "#b45309", border: "#fcd34d" },
  blue: { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
};

export default function Badge({ color, children }) {
  const c = COLORS[color] || COLORS.blue;
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 99,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}
