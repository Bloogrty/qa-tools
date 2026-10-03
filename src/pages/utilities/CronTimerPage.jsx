import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import {
  fmt,
  fmtClock,
  secondsUntilNext,
  nextRingTimes,
  requestNotificationPermission,
} from "../../utils/timer";

const PRESETS = [
  { label: "10s", seconds: 10 },
  { label: "30s", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
];

const OFFSETS = [
  { label: "-10s", value: -10 },
  { label: "-5s", value: -5 },
  { label: "-3s", value: -3 },
  { label: "0s", value: 0 },
  { label: "+3s", value: 3 },
  { label: "+5s", value: 5 },
  { label: "+10s", value: 10 },
];

const sLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 8,
};

const btnBase = (active) => ({
  padding: "6px 14px",
  fontSize: 13,
  cursor: "pointer",
  border: "1px solid #e0e0e0",
  borderRadius: 6,
  background: active ? "#1a1a1a" : "#fff",
  color: active ? "#fff" : "#1a1a1a",
  fontWeight: active ? 500 : 400,
});

export default function CronTimerPage({ state, setState }) {
  const { intervalSec, running, remaining, ringCount, ringTimes, offsetSec } = state;

  const set = (patch) => setState((prev) => ({ ...prev, ...patch }));

  const [customInput, setCustomInput] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  const start = (sec) => {
    requestNotificationPermission();
    setState((prev) => ({
      ...prev,
      intervalSec: sec,
      running: true,
      remaining: secondsUntilNext(sec, offsetSec),
      ringCount: 0,
      ringTimes: nextRingTimes(sec, offsetSec),
    }));
  };

  const stop = () => {
    set({ running: false, remaining: null, ringCount: 0, ringTimes: [] });
  };

  const selectOffset = (val) => {
    set({
      offsetSec: val,
      ringTimes: running ? nextRingTimes(intervalSec, val) : ringTimes,
      remaining: running ? secondsUntilNext(intervalSec, val) : remaining,
    });
  };

  const applyCustom = () => {
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0) start(val * 60);
  };

  const progress =
    remaining !== null ? Math.min(100, ((intervalSec - remaining) / intervalSec) * 100) : 0;
  const isLast10 = remaining !== null && remaining <= 10;

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="Cron Timer"
        subtitle="Rings on the wall clock at every even interval, handy for watching scheduled jobs. Keeps running on other tabs."
      />

      <div style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
          Current time:{" "}
          <span style={{ fontFamily: "monospace", color: "#1a1a1a", fontWeight: 600 }}>
            {fmtClock(now)}
          </span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={sLabel}>Interval</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => start(p.seconds)}
                style={btnBase(intervalSec === p.seconds && running)}
              >
                {p.label}
              </button>
            ))}
            <input
              type="number"
              min="1"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCustom()}
              placeholder="min"
              style={{
                width: 56,
                padding: "6px 8px",
                fontSize: 13,
                border: "1px solid #e0e0e0",
                borderRadius: 6,
                textAlign: "center",
              }}
            />
            <button onClick={applyCustom} style={btnBase(false)}>
              go
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={sLabel}>
            Offset
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
                color: "#aaa",
                marginLeft: 6,
              }}
            >
              ring before or after the exact tick
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {OFFSETS.map((o) => (
              <button
                key={o.value}
                onClick={() => selectOffset(o.value)}
                style={{
                  ...btnBase(offsetSec === o.value),
                  color:
                    offsetSec === o.value
                      ? "#fff"
                      : o.value < 0
                        ? "#dc2626"
                        : o.value > 0
                          ? "#16a34a"
                          : "#1a1a1a",
                  borderColor: o.value < 0 ? "#fca5a5" : o.value > 0 ? "#86efac" : "#e0e0e0",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
          {offsetSec !== 0 && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
              Rings {Math.abs(offsetSec)}s {offsetSec > 0 ? "after" : "before"} the exact
              clock tick
            </div>
          )}
        </div>

        <div
          style={{
            background: "#f9f9f9",
            border: "1px solid #e0e0e0",
            borderRadius: 10,
            padding: 20,
            marginBottom: 16,
          }}
        >
          {!running && remaining === null ? (
            <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "20px 0" }}>
              Pick an interval above to start
            </div>
          ) : (
            <>
              <div
                style={{
                  height: 4,
                  background: "#e0e0e0",
                  borderRadius: 99,
                  marginBottom: 16,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    width: `${progress}%`,
                    transition: "width 0.5s linear",
                    background: isLast10 ? "#dc2626" : "#1a1a1a",
                  }}
                />
              </div>

              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>next ring in</div>
                <div
                  style={{
                    fontSize: 52,
                    fontFamily: "monospace",
                    fontWeight: 700,
                    lineHeight: 1,
                    color: isLast10 ? "#dc2626" : "#1a1a1a",
                    marginBottom: 6,
                  }}
                >
                  {remaining !== null ? fmt(remaining) : "--:--"}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  every {fmt(intervalSec)}
                  {offsetSec !== 0 && (
                    <span
                      style={{ color: offsetSec > 0 ? "#16a34a" : "#dc2626", marginLeft: 4 }}
                    >
                      · {offsetSec > 0 ? "+" : ""}
                      {offsetSec}s offset
                    </span>
                  )}
                </div>
              </div>

              {ringCount > 0 && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 10,
                    fontSize: 13,
                    color: "#16a34a",
                    fontWeight: 500,
                  }}
                >
                  rang {ringCount} time{ringCount > 1 ? "s" : ""}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                {running ? (
                  <button onClick={() => set({ running: false })} style={btnBase(false)}>
                    pause
                  </button>
                ) : (
                  <button onClick={() => set({ running: true })} style={btnBase(true)}>
                    resume
                  </button>
                )}
                <button onClick={stop} style={btnBase(false)}>
                  stop
                </button>
              </div>
            </>
          )}
        </div>

        {ringTimes.length > 0 && (
          <div>
            <div style={sLabel}>Upcoming rings</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ringTimes.map((t, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: 6,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "#444",
                  }}
                >
                  {fmtClock(new Date(t))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
