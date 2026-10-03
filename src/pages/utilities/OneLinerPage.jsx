import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";

function toOneLiner(raw) {
  return raw
    .split("\n")
    .map((l) => l.replace(/\\\s*$/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCommand(raw) {
  const line = toOneLiner(raw);
  const tokens = line.split(/\s+/);
  const envStart = tokens.findIndex((t) => /^[A-Z][A-Z0-9_]+=/.test(t));
  if (envStart === -1) return { base: line, envVars: [] };
  const base = tokens.slice(0, envStart).join(" ");
  const envVars = tokens.slice(envStart).map((t) => {
    const idx = t.indexOf("=");
    return { key: t.slice(0, idx), value: t.slice(idx + 1) };
  });
  return { base, envVars };
}

function buildOneLiner({ base, envVars }) {
  const envPart = envVars.map((e) => `${e.key}=${e.value}`).join(" ");
  return base + (envPart ? " " + envPart : "");
}

const area = {
  width: "100%",
  fontFamily: "monospace",
  fontSize: 12,
  padding: "10px 12px",
  border: "1px solid #eee",
  borderRadius: 6,
  resize: "vertical",
  outline: "none",
  color: "#111",
};

const headCell = {
  fontSize: 11,
  color: "#aaa",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export default function OneLinerPage() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const oneliner = parsed ? buildOneLiner(parsed) : "";

  function handleConvert() {
    if (!input.trim()) return;
    setParsed(parseCommand(input));
    setCopied(false);
    setSearch("");
  }

  function handleClear() {
    setInput("");
    setParsed(null);
    setCopied(false);
    setSearch("");
  }

  function handleEditValue(idx, value) {
    setParsed((prev) => ({
      ...prev,
      envVars: prev.envVars.map((e, i) => (i === idx ? { ...e, value } : e)),
    }));
  }

  function handleCopy() {
    if (!oneliner) return;
    navigator.clipboard?.writeText(oneliner).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const q = search.toLowerCase();
  const filteredEnvVars = parsed
    ? parsed.envVars
        .map((e, i) => ({ ...e, idx: i }))
        .filter(
          (e) =>
            !q || e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q),
        )
    : [];

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="One-liner"
        subtitle="Join a multi-line command (lines ending in \) into a single line, and edit its KEY=VALUE pairs"
      />

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Input</div>
        <textarea
          style={{ ...area, minHeight: 200, background: "#fafafa" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) handleConvert();
          }}
          placeholder={
            "Paste a multi-line command here, then Convert (or Ctrl+Enter)\n\n" +
            "kubectl set env deployment/orders-api -n staging \\\n" +
            "  LOG_LEVEL=debug \\\n" +
            "  PAYMENTS_URL=https://payments.example.com"
          }
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={handleConvert}
          style={{
            padding: "7px 18px",
            borderRadius: 6,
            border: "none",
            background: "#1a1a1a",
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Convert
        </button>
        <button
          onClick={handleClear}
          style={{
            padding: "7px 16px",
            borderRadius: 6,
            border: "1px solid #ddd",
            background: "#fff",
            fontSize: 13,
            cursor: "pointer",
            color: "#888",
          }}
        >
          Clear
        </button>
      </div>

      {parsed && (
        <>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#888" }}>One-liner</span>
              <span
                style={{
                  fontSize: 11,
                  color: copied ? "#16a34a" : "#bbb",
                  transition: "color 0.2s",
                }}
              >
                {copied ? "copied!" : "click to copy"}
              </span>
            </div>
            <textarea
              style={{
                ...area,
                minHeight: 80,
                border: copied ? "1px solid #86efac" : "1px solid #eee",
                background: copied ? "#dcfce7" : "#f5f5f5",
                cursor: "pointer",
                transition: "background 0.25s, border-color 0.25s",
              }}
              value={oneliner}
              readOnly
              onClick={handleCopy}
            />
          </div>

          {parsed.envVars.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#888", flexShrink: 0 }}>
                  KEY=VALUE pairs
                </span>
                <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search key or value..."
                    style={{
                      width: "100%",
                      fontSize: 12,
                      padding: "5px 28px 5px 10px",
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      outline: "none",
                      background: "#fff",
                      color: "#111",
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      style={{
                        position: "absolute",
                        right: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "#aaa",
                        fontSize: 14,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      x
                    </button>
                  )}
                </div>
                <span style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }}>
                  {search
                    ? `${filteredEnvVars.length} / ${parsed.envVars.length}`
                    : parsed.envVars.length}
                </span>
              </div>

              <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    background: "#f5f5f5",
                    borderBottom: "1px solid #eee",
                    padding: "6px 12px",
                  }}
                >
                  <span style={headCell}>Key</span>
                  <span style={headCell}>Value</span>
                </div>

                {filteredEnvVars.length === 0 ? (
                  <div
                    style={{ padding: "16px 12px", fontSize: 12, color: "#bbb", textAlign: "center" }}
                  >
                    No results
                  </div>
                ) : (
                  filteredEnvVars.map((ev, rowI) => (
                    <div
                      key={ev.idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        borderBottom:
                          rowI < filteredEnvVars.length - 1 ? "1px solid #f0f0f0" : "none",
                        alignItems: "stretch",
                      }}
                    >
                      <div
                        title={ev.key}
                        style={{
                          padding: "7px 12px",
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: "#666",
                          borderRight: "1px solid #f0f0f0",
                          display: "flex",
                          alignItems: "center",
                          overflow: "hidden",
                          background: "#fafafa",
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.key}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={ev.value}
                        onChange={(e) => handleEditValue(ev.idx, e.target.value)}
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          padding: "7px 12px",
                          border: "none",
                          outline: "none",
                          background: "#fff",
                          color: "#111",
                          width: "100%",
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
