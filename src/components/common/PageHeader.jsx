export default function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: "#888" }}>{subtitle}</div>
      )}
    </div>
  );
}
