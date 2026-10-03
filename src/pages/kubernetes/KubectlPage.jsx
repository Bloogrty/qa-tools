import { useState, useRef, useEffect } from "react";
import CmdBox from "../../components/common/CmdBox";
import ToggleGroup from "../../components/common/ToggleGroup";
import CliToggle from "../../components/kubectl/CliToggle";
import PodTable from "../../components/kubectl/PodTable";
import PodPanel from "../../components/kubectl/PodPanel";
import PodPanelSettings from "../../components/kubectl/PodPanelSettings";
import { useWorkspace } from "../../hooks/useWorkspace";
import { pick } from "../../utils/workspace";
import { parsePods } from "../../utils/pods";
import { shellQuote } from "../../utils/shell";
import { normalize } from "../../utils/strings";

const logsCmd = (cli, podName, ns) => `${cli} logs -f ${podName} -n ${ns}`;

const EMPTY_PANE = { raw: "", pods: [], selected: null, search: "" };

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const topBtn = (active) => ({
  padding: "5px 12px",
  fontSize: 12,
  cursor: "pointer",
  border: `1px solid ${active ? "#1a1a1a" : "#e0e0e0"}`,
  borderRadius: 6,
  background: active ? "#1a1a1a" : "#fff",
  color: active ? "#fff" : "#1a1a1a",
});

export default function KubectlPage({ state, setState }) {
  const { namespaces, clis } = useWorkspace();
  const ns = pick(state.ns, namespaces);
  const cli = pick(state.cli, clis);
  const set = (patch) => setState((prev) => ({ ...prev, ...patch }));
  const setPane = (patch) =>
    setState((prev) => ({
      ...prev,
      panes: {
        ...prev.panes,
        [ns]: { ...EMPTY_PANE, ...prev.panes?.[ns], ...patch },
      },
    }));

  const [showSettings, setShowSettings] = useState(false);

  const svc = (state.service || "").trim();
  const grep = svc ? ` | grep ${shellQuote(svc)}` : "";

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <ToggleGroup
            label="Namespace"
            options={namespaces}
            value={ns}
            onChange={(n) => set({ ns: n })}
          />
          <CliToggle value={cli} onChange={(c) => set({ cli: c })} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => set({ panes: {} })} style={topBtn(false)}>
            ↺ Reset
          </button>
          <button
            onClick={() => setShowSettings((s) => !s)}
            style={topBtn(showSettings)}
          >
            ⚙ Pod panel
          </button>
        </div>
      </div>

      {showSettings && <PodPanelSettings />}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ ...sLabel, marginBottom: 0 }}>Quick commands</div>
        <input
          value={state.service || ""}
          onChange={(e) => set({ service: e.target.value })}
          placeholder="Service name (optional, adds | grep)"
          style={{
            flex: 1,
            maxWidth: 320,
            padding: "5px 9px",
            fontSize: 12,
            fontFamily: "monospace",
            border: "1px solid #e0e0e0",
            borderRadius: 6,
          }}
        />
        {svc && (
          <button
            onClick={() => set({ service: "" })}
            style={{ ...topBtn(false), padding: "4px 9px", fontSize: 11, color: "#888" }}
          >
            clear
          </button>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <CmdBox cmd={`${cli} get pods -n ${ns}${grep}`} />
        <CmdBox cmd={`${cli} get services -n ${ns}${grep}`} />
        <CmdBox cmd={`${cli} get pods -n ${ns} -o wide${grep}`} />
      </div>

      <PodsPane
        key={ns}
        ns={ns}
        cli={cli}
        pane={state.panes?.[ns] || EMPTY_PANE}
        setPane={setPane}
      />
    </div>
  );
}

function PodsPane({ ns, cli, pane, setPane }) {
  const { raw, pods, selected, search } = pane;

  const [copied, setCopied] = useState(null);
  const copyTimer = useRef(null);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const parse = () => {
    setPane({ pods: parsePods(raw), selected: null });
    setCopied(null);
  };

  const selectPod = (p) => {
    setPane({ selected: p });
    clearTimeout(copyTimer.current);
    setCopied(null);
    Promise.resolve(navigator.clipboard?.writeText(logsCmd(cli, p.name, ns)))
      .then(() => {
        setCopied(p.name);
        copyTimer.current = setTimeout(() => setCopied(null), 3000);
      })
      .catch(() => setCopied(null));
  };

  const filtered = pods.filter((p) =>
    normalize(p.name).includes(normalize(search)),
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={sLabel}>Paste pod list</div>
        <textarea
          value={raw}
          onChange={(e) => setPane({ raw: e.target.value })}
          placeholder="Paste kubectl get pods output here..."
          style={{
            width: "100%",
            minHeight: 90,
            fontSize: 12,
            fontFamily: "monospace",
            padding: 10,
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            resize: "vertical",
          }}
        />
        <button
          onClick={parse}
          style={{
            marginTop: 8,
            padding: "7px 16px",
            fontSize: 13,
            cursor: "pointer",
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          Parse pods
        </button>
      </div>

      {pods.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <input
              value={search}
              onChange={(e) => setPane({ search: e.target.value })}
              placeholder="Filter pods... (e.g. 'orders api' or 'orders-api')"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "7px 10px",
                fontSize: 13,
                border: "1px solid #e0e0e0",
                borderRadius: 6,
              }}
            />
            <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>
              {filtered.length}/{pods.length} pods
            </span>
          </div>

          <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
            Click a pod to copy its logs command
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: selected ? "1fr 400px" : "1fr",
              gap: 12,
              alignItems: "start",
            }}
          >
            <PodTable
              pods={filtered}
              selected={selected}
              onSelect={selectPod}
              copiedName={copied}
            />
            {selected && (
              <PodPanel key={selected.name} pod={selected} ns={ns} cli={cli} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
