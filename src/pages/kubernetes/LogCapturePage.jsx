import { useState, useMemo } from "react";
import CmdBox from "../../components/common/CmdBox";
import PageHeader from "../../components/common/PageHeader";
import Placeholder from "../../components/common/Placeholder";
import ToggleGroup from "../../components/common/ToggleGroup";
import CliToggle from "../../components/kubectl/CliToggle";
import { useWorkspace } from "../../hooks/useWorkspace";
import { pick } from "../../utils/workspace";
import { parsePodNames } from "../../utils/pods";
import { normalize } from "../../utils/strings";
import { MATCH_MODES, buildLogCmd } from "../../utils/logCapture";

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const box = { border: "1px solid #e0e0e0", borderRadius: 8, padding: 14 };

const field = {
  width: "100%",
  padding: "7px 10px",
  fontSize: 12,
  border: "1px solid #e0e0e0",
  borderRadius: 6,
};

const fieldLabel = { fontSize: 11, color: "#888", marginBottom: 5 };

const MODE_HINT = {
  lines: "Only the lines that contain the text.",
  context: "Each match plus some lines before and after it.",
  block:
    "From each line with the text through the next line with the stop text. Leave stop empty to print to the end.",
};

export default function LogCapturePage() {
  const { namespaces, clis } = useWorkspace();
  const [nsChoice, setNsChoice] = useState("");
  const [cliChoice, setCliChoice] = useState("");
  const ns = pick(nsChoice, namespaces);
  const cli = pick(cliChoice, clis);

  const [podTab, setPodTab] = useState("paste");
  const [raw, setRaw] = useState("");
  const [filterText, setFilterText] = useState("");
  const [selectedPod, setSelectedPod] = useState("");
  const [manualPod, setManualPod] = useState("");
  const pod = podTab === "manual" ? manualPod.trim() : selectedPod;

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("lines");
  const [before, setBefore] = useState("5");
  const [after, setAfter] = useState("20");
  const [stop, setStop] = useState("");
  const [container, setContainer] = useState("");
  const [since, setSince] = useState("");
  const [previous, setPrevious] = useState(false);

  const pods = useMemo(() => parsePodNames(raw), [raw]);
  const filteredPods = pods.filter((p) =>
    normalize(p).includes(normalize(filterText)),
  );

  const cmd =
    pod && search
      ? buildLogCmd({
          cli,
          pod,
          ns,
          container: container.trim(),
          since: since.trim(),
          previous,
          search,
          mode,
          before: before.trim(),
          after: after.trim(),
          stop,
        })
      : null;

  const tabBtn = (key, label) => (
    <button
      key={key}
      onClick={() => setPodTab(key)}
      style={{
        padding: "5px 12px",
        fontSize: 12,
        cursor: "pointer",
        borderRadius: 6,
        border: `1px solid ${podTab === key ? "#1a1a1a" : "#e0e0e0"}`,
        background: podTab === key ? "#1a1a1a" : "#fff",
        color: podTab === key ? "#fff" : "#555",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: 16, maxWidth: 920 }}>
      <PageHeader
        title="Log Capture"
        subtitle="Build a logs command that pulls out every line for one request, trace or order ID"
      />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <ToggleGroup
          label="Namespace"
          options={namespaces}
          value={ns}
          onChange={setNsChoice}
        />
        <CliToggle value={cli} onChange={setCliChoice} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={sLabel}>1. Pick a pod</div>
        <div style={box}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {tabBtn("paste", "Paste pod list")}
            {tabBtn("manual", "Type the name")}
          </div>

          {podTab === "paste" && (
            <div>
              <CmdBox label="Run this, then paste the output below" cmd={`${cli} get pods -n ${ns}`} />
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="Paste the get pods output here..."
                style={{
                  ...field,
                  minHeight: 90,
                  fontFamily: "monospace",
                  padding: 10,
                  borderRadius: 8,
                  resize: "vertical",
                  marginTop: 4,
                }}
              />

              {pods.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
                  >
                    <input
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Filter pods..."
                      style={{ ...field, flex: 1, width: "auto" }}
                    />
                    <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
                      {filteredPods.length}/{pods.length} pods
                    </span>
                  </div>
                  <div
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 8,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {filteredPods.length === 0 ? (
                      <div
                        style={{ textAlign: "center", padding: 20, fontSize: 12, color: "#aaa" }}
                      >
                        No pods match
                      </div>
                    ) : (
                      filteredPods.map((p) => {
                        const isSelected = selectedPod === p;
                        return (
                          <div
                            key={p}
                            onClick={() => setSelectedPod(p)}
                            style={{
                              padding: "8px 12px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f0f0f0",
                              fontFamily: "monospace",
                              fontSize: 11,
                              background: isSelected ? "#f0f9ff" : "transparent",
                              color: isSelected ? "#1d4ed8" : "#333",
                              fontWeight: isSelected ? 500 : 400,
                            }}
                          >
                            {p}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {podTab === "manual" && (
            <div>
              <div style={fieldLabel}>Pod name</div>
              <input
                value={manualPod}
                onChange={(e) => setManualPod(e.target.value)}
                placeholder="e.g. orders-api-7d9f8c6b5-x2k4p"
                style={{ ...field, fontFamily: "monospace" }}
              />
            </div>
          )}

          {pod && (
            <div
              style={{
                marginTop: 10,
                background: "#f5f5f5",
                borderRadius: 6,
                padding: "7px 10px",
                fontFamily: "monospace",
                fontSize: 11,
                color: "#444",
              }}
            >
              {pod}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={sLabel}>2. What to look for</div>
        <div style={box}>
          <div style={{ marginBottom: 12 }}>
            <div style={fieldLabel}>Search text</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. req-12345 (matched as plain text, not a regex)"
              style={{ ...field, fontFamily: "monospace" }}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <ToggleGroup label="Output" options={MATCH_MODES} value={mode} onChange={setMode} />
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 12 }}>
            {MODE_HINT[mode]}
          </div>

          {mode === "context" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={fieldLabel}>Lines before</div>
                <input
                  type="number"
                  min="0"
                  value={before}
                  onChange={(e) => setBefore(e.target.value)}
                  style={{ ...field, width: 100 }}
                />
              </div>
              <div>
                <div style={fieldLabel}>Lines after</div>
                <input
                  type="number"
                  min="0"
                  value={after}
                  onChange={(e) => setAfter(e.target.value)}
                  style={{ ...field, width: 100 }}
                />
              </div>
            </div>
          )}

          {mode === "block" && (
            <div style={{ marginBottom: 12 }}>
              <div style={fieldLabel}>Stop text</div>
              <input
                value={stop}
                onChange={(e) => setStop(e.target.value)}
                placeholder="e.g. Request completed"
                style={{ ...field, fontFamily: "monospace" }}
              />
            </div>
          )}

          <div
            style={{
              borderTop: "1px solid #f0f0f0",
              paddingTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <div style={fieldLabel}>
                Container <span style={{ color: "#bbb" }}>(optional, for multi-container pods)</span>
              </div>
              <input
                value={container}
                onChange={(e) => setContainer(e.target.value)}
                placeholder="e.g. app"
                style={field}
              />
            </div>
            <div>
              <div style={fieldLabel}>
                --since <span style={{ color: "#bbb" }}>(optional)</span>
              </div>
              <input
                value={since}
                onChange={(e) => setSince(e.target.value)}
                placeholder="e.g. 2h, 30m"
                style={field}
              />
            </div>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#555",
              cursor: "pointer",
              marginTop: 10,
            }}
          >
            <input
              type="checkbox"
              checked={previous}
              onChange={(e) => setPrevious(e.target.checked)}
            />
            Use <code style={{ background: "#f5f5f5", padding: "1px 5px", borderRadius: 4 }}>--previous</code>{" "}
            (logs from before the last restart)
          </label>
        </div>
      </div>

      <div>
        <div style={sLabel}>3. Generated command</div>
        {cmd ? (
          <CmdBox cmd={cmd} />
        ) : (
          <Placeholder>Pick a pod and fill in the search text</Placeholder>
        )}
      </div>
    </div>
  );
}
