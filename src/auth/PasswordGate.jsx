import { useState } from "react";
import { checkPassword } from "./appAuth";

export default function PasswordGate({ onSuccess }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (checkPassword(input)) {
      setError(false);
      onSuccess?.();
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#fff",
      }}
    >
      <div
        style={{
          width: 320,
          padding: 28,
          border: "1px solid #e5e5e5",
          borderRadius: 10,
          background: "#fff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
            QA Tools <span style={{ fontWeight: 400, color: "#aaa" }}>Lite</span>
          </div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
            Enter password to continue
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Password"
            autoFocus
            style={{
              padding: "8px 12px",
              fontSize: 13,
              border: `1px solid ${error ? "#fca5a5" : "#e0e0e0"}`,
              borderRadius: 6,
              outline: "none",
              background: error ? "#fff5f5" : "#fafafa",
              color: "#1a1a1a",
              transition: "border 0.15s, background 0.15s",
            }}
          />
          {error && (
            <div style={{ fontSize: 11, color: "#dc2626" }}>
              Wrong password, try again.
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={!input.trim()}
          style={{
            padding: "8px",
            fontSize: 13,
            fontWeight: 500,
            background: input.trim() ? "#1a1a1a" : "#e5e5e5",
            color: input.trim() ? "#fff" : "#aaa",
            border: "none",
            borderRadius: 6,
            cursor: input.trim() ? "pointer" : "default",
            transition: "background 0.15s",
          }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
