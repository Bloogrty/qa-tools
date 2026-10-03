export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function sendNotification(intervalSec) {
  if ("Notification" in window && Notification.permission === "granted") {
    const minutes = Math.floor(intervalSec / 60);
    const seconds = intervalSec % 60;
    const label = seconds === 0 ? `${minutes} min` : `${minutes}m ${seconds}s`;
    new Notification("Cron Timer", {
      body: `Ring! ${label} interval`,
      silent: true,
    });
  }
}

export function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (t, freq, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    };
    const now = ctx.currentTime;
    beep(now, 880, 0.15);
    beep(now + 0.2, 1100, 0.15);
    beep(now + 0.4, 1320, 0.3);
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // audio not supported
  }
}

export function fmt(sec) {
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtClock(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function secondsUntilNext(intervalSec, offsetSec) {
  const nowSec = Math.floor(Date.now() / 1000);
  const shifted = nowSec - (offsetSec || 0);
  const rem = shifted % intervalSec;
  return rem === 0 ? intervalSec : intervalSec - rem;
}

export function nextRingTimes(intervalSec, offsetSec, count = 5) {
  const nowMs = Date.now();
  const intervalMs = intervalSec * 1000;
  const offsetMs = (offsetSec || 0) * 1000;
  const firstBase =
    Math.ceil((nowMs - offsetMs) / intervalMs) * intervalMs + offsetMs;
  let firstMs = firstBase;
  if (firstMs <= nowMs) firstMs += intervalMs;
  return Array.from(
    { length: count },
    (_, i) => new Date(firstMs + i * intervalMs),
  );
}
