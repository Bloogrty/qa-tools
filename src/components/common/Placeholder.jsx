export default function Placeholder({ children }) {
  return (
    <div
      style={{
        background: "#f9f9f9",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: 14,
        fontSize: 12,
        color: "#aaa",
        fontStyle: "italic",
      }}
    >
      {children}
    </div>
  );
}
