import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function renumber(input, { prefix, start, digits }) {
  const lines = input.split("\n");
  const pattern = new RegExp(`^(${escapeRegex(prefix)}\\d+)(.*)`, "i");
  const seen = new Map();

  for (const line of lines) {
    const m = line.match(pattern);
    if (m) {
      const key = m[1].toUpperCase();
      if (!seen.has(key)) seen.set(key, start + seen.size);
    }
  }

  return lines
    .map((line) => {
      const m = line.match(pattern);
      if (!m) return line;
      const n = String(seen.get(m[1].toUpperCase())).padStart(digits, "0");
      return prefix + n + m[2];
    })
    .join("\n");
}

const EXAMPLE = [
  "TC014_login_valid_user.feature",
  "TC015_login_wrong_password.feature",
  "TC015_login_wrong_password.data.json",
  "TC020_checkout_guest.feature",
  "TC031_checkout_saved_card.feature",
].join("\n");

const fieldLabel = { fontSize: 12, color: "#888", marginBottom: 4 };

const btnStyle = {
  padding: "7px 16px",
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "#fff",
  fontSize: 13,
  cursor: "pointer",
  color: "#111",
};

const areaStyle = {
  width: "100%",
  minHeight: 320,
  fontFamily: "monospace",
  fontSize: 13,
  padding: "10px 12px",
  border: "1px solid #eee",
  borderRadius: 6,
  resize: "vertical",
  outline: "none",
  background: "#fafafa",
  color: "#111",
};

export default function TCRenumberPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [prefix, setPrefix] = useState("TC");
  const [startNum, setStartNum] = useState("1");
  const [digits, setDigits] = useState("3");
  const [copied, setCopied] = useState(false);

  function handleRenumber() {
    if (!input.trim()) return;
    setOutput(
      renumber(input, {
        prefix: prefix.trim(),
        start: parseInt(startNum, 10) || 1,
        digits: Math.min(parseInt(digits, 10) || 1, 10),
      }),
    );
    setCopied(false);
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard?.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const onEnter = (e) => {
    if (e.key === "Enter") handleRenumber();
  };

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="TC Renumber"
        subtitle="Paste test case names or file names and renumber them in sequence, e.g. after inserting or deleting cases"
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={fieldLabel}>Prefix</div>
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            onKeyDown={onEnter}
            style={{ ...btnStyle, width: 80, padding: "7px 10px" }}
          />
        </div>
        <div>
          <div style={fieldLabel}>Start number</div>
          <input
            value={startNum}
            onChange={(e) => setStartNum(e.target.value)}
            onKeyDown={onEnter}
            style={{ ...btnStyle, width: 90, padding: "7px 10px" }}
          />
        </div>
        <div>
          <div style={fieldLabel}>Digits</div>
          <input
            value={digits}
            onChange={(e) => setDigits(e.target.value)}
            onKeyDown={onEnter}
            style={{ ...btnStyle, width: 70, padding: "7px 10px" }}
          />
        </div>
        <button
          style={{ ...btnStyle, background: "#1a1a1a", color: "#fff", border: "none" }}
          onClick={handleRenumber}
        >
          Renumber
        </button>
        <button
          style={{ ...btnStyle, color: "#888" }}
          onClick={() => {
            setInput(EXAMPLE);
            setOutput("");
          }}
        >
          Load example
        </button>
        <button
          style={{ ...btnStyle, color: "#888" }}
          onClick={() => {
            setInput("");
            setOutput("");
            setCopied(false);
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>Input</div>
          <textarea
            style={areaStyle}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`One per line, starting with ${prefix || "the prefix"} and a number`}
          />
        </div>
        <div>
          <div style={{ ...fieldLabel, marginBottom: 6 }}>
            Output
            {output && (
              <span
                style={{ marginLeft: 8, color: copied ? "#16a34a" : "#aaa", fontSize: 11 }}
              >
                {copied ? "✓ Copied!" : "click to copy"}
              </span>
            )}
          </div>
          <textarea
            style={{
              ...areaStyle,
              background: "#f5f5f5",
              cursor: output ? "pointer" : "default",
            }}
            value={output}
            readOnly
            onClick={handleCopy}
          />
        </div>
      </div>
    </div>
  );
}
