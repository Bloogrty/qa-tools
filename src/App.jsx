import { useState, useEffect, useRef } from "react";
import KubectlPage from "./pages/kubernetes/KubectlPage";
import ServiceCheckPage from "./pages/kubernetes/ServiceCheckPage";
import EnvQueryPage from "./pages/kubernetes/EnvQueryPage";
import LogCapturePage from "./pages/kubernetes/LogCapturePage";
import ConfigMapToolsPage from "./pages/kubernetes/ConfigMapToolsPage";
import ConfigMapEditorPage from "./pages/kubernetes/ConfigMapEditorPage";
import EnvComparePage from "./pages/env/EnvComparePage";
import EnvEditPage from "./pages/env/EnvEditPage";
import YamlSyncPage from "./pages/yaml/YamlSyncPage";
import YamlMergePage from "./pages/yaml/YamlMergePage";
import JsonDiffPage from "./pages/utilities/JsonDiffPage";
import OneLinerPage from "./pages/utilities/OneLinerPage";
import CronTimerPage from "./pages/utilities/CronTimerPage";
import TCRenumberPage from "./pages/utilities/TCRenumberPage";
import SettingsPage from "./pages/SettingsPage";
import PasswordGate from "./auth/PasswordGate";
import { passwordRequired, isAppAuthed, markAppAuthed } from "./auth/appAuth";
import {
  KUBECTL_DEFAULT_STATE,
  SERVICE_CHECK_DEFAULT_STATE,
  JSON_DIFF_DEFAULT_STATE,
  YAML_SYNC_DEFAULT_STATE,
  YAML_MERGE_DEFAULT_STATE,
  TIMER_DEFAULT_STATE,
} from "./constants/defaultStates";
import { playBeep, sendNotification, nextRingTimes } from "./utils/timer";

const NAV = [
  {
    group: "Kubernetes",
    items: [
      ["kubectl", "Kubectl Console"],
      ["service-check", "Service Check"],
      ["env-query", "Find by Env"],
      ["log-capture", "Log Capture"],
      ["configmap-tools", "ConfigMap Tools"],
      ["configmap-editor", "ConfigMap Editor"],
    ],
  },
  {
    group: "Env & YAML",
    items: [
      ["env-compare", "Env Compare"],
      ["env-edit", "Env Edit"],
      ["yaml-sync", "YAML Sync"],
      ["yaml-merge", "YAML Merge"],
    ],
  },
  {
    group: "Utilities",
    items: [
      ["json-diff", "JSON Diff"],
      ["one-liner", "One-liner"],
      ["cron-timer", "Cron Timer"],
      ["tc-renumber", "TC Renumber"],
    ],
  },
];

const groupLabel = {
  fontSize: 10,
  fontWeight: 700,
  color: "#bbb",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  padding: "0 8px",
  marginBottom: 6,
};

function NavItem({ active, label, dot, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        textAlign: "left",
        padding: "8px 16px",
        fontSize: 13,
        cursor: "pointer",
        background: active ? "#1a1a1a" : "transparent",
        color: active ? "#fff" : "#555",
        border: "none",
        borderRadius: 6,
        fontWeight: active ? 500 : 400,
        marginBottom: 2,
      }}
    >
      {label}
      {dot && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#16a34a",
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => !passwordRequired || isAppAuthed());
  const [tab, setTab] = useState("kubectl");

  const [kubectlState, setKubectlState] = useState(KUBECTL_DEFAULT_STATE);
  const [serviceCheckState, setServiceCheckState] = useState(
    SERVICE_CHECK_DEFAULT_STATE,
  );
  const [jsonDiffState, setJsonDiffState] = useState(JSON_DIFF_DEFAULT_STATE);
  const [yamlSyncState, setYamlSyncState] = useState(YAML_SYNC_DEFAULT_STATE);
  const [yamlMergeState, setYamlMergeState] = useState(YAML_MERGE_DEFAULT_STATE);
  const [timerState, setTimerState] = useState(TIMER_DEFAULT_STATE);

  // timer runs here so it keeps ringing on other tabs
  const lastRingRef = useRef(null);
  const timerRef = useRef(timerState);
  useEffect(() => {
    timerRef.current = timerState;
  }, [timerState]);

  useEffect(() => {
    const tick = setInterval(() => {
      const { running, intervalSec, offsetSec } = timerRef.current;
      if (!running) return;
      const nowSec = Math.floor(Date.now() / 1000);
      const rem = (nowSec - (offsetSec || 0)) % intervalSec;
      const timeUntil = rem === 0 ? intervalSec : intervalSec - rem;
      if (rem === 0 && lastRingRef.current !== nowSec) {
        lastRingRef.current = nowSec;
        playBeep();
        sendNotification(intervalSec);
        setTimerState((prev) => ({
          ...prev,
          remaining: prev.intervalSec,
          ringCount: prev.ringCount + 1,
          ringTimes: nextRingTimes(prev.intervalSec, prev.offsetSec || 0),
        }));
      } else {
        setTimerState((prev) =>
          prev.remaining === timeUntil ? prev : { ...prev, remaining: timeUntil },
        );
      }
    }, 500);
    return () => clearInterval(tick);
  }, []);

  if (!authed) {
    return (
      <PasswordGate
        onSuccess={() => {
          markAppAuthed();
          setAuthed(true);
        }}
      />
    );
  }

  const navItem = (key, label, dot) => (
    <NavItem
      key={key}
      active={tab === key}
      label={label}
      dot={dot}
      onClick={() => setTab(key)}
    />
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      <nav
        style={{
          width: 190,
          flexShrink: 0,
          borderRight: "1px solid #eee",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "0 8px", fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
          QA Tools <span style={{ fontWeight: 400, color: "#aaa" }}>Lite</span>
        </div>

        {NAV.map(({ group, items }) => (
          <div key={group}>
            <div style={groupLabel}>{group}</div>
            {items.map(([key, label]) =>
              navItem(key, label, key === "cron-timer" && timerState.running),
            )}
          </div>
        ))}

        <div style={{ marginTop: "auto" }}>{navItem("settings", "Settings")}</div>
      </nav>

      <main style={{ flex: 1, minWidth: 0 }}>
        {tab === "kubectl" && (
          <KubectlPage state={kubectlState} setState={setKubectlState} />
        )}
        {tab === "service-check" && (
          <ServiceCheckPage state={serviceCheckState} setState={setServiceCheckState} />
        )}
        {tab === "env-query" && <EnvQueryPage />}
        {tab === "log-capture" && <LogCapturePage />}
        {tab === "configmap-tools" && <ConfigMapToolsPage />}
        {tab === "configmap-editor" && <ConfigMapEditorPage />}
        {tab === "env-compare" && <EnvComparePage />}
        {tab === "env-edit" && <EnvEditPage />}
        {tab === "yaml-sync" && (
          <YamlSyncPage state={yamlSyncState} setState={setYamlSyncState} />
        )}
        {tab === "yaml-merge" && (
          <YamlMergePage state={yamlMergeState} setState={setYamlMergeState} />
        )}
        {tab === "json-diff" && (
          <JsonDiffPage state={jsonDiffState} setState={setJsonDiffState} />
        )}
        {tab === "one-liner" && <OneLinerPage />}
        {tab === "cron-timer" && (
          <CronTimerPage state={timerState} setState={setTimerState} />
        )}
        {tab === "tc-renumber" && <TCRenumberPage />}
        {tab === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
