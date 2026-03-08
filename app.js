import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAT6VhvQggviNUxDhL8KQKcyCi_Q1S6gjU",
  authDomain: "capstone3-bc2c3.firebaseapp.com",
  databaseURL: "https://capstone3-bc2c3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "capstone3-bc2c3",
  storageBucket: "capstone3-bc2c3.firebasestorage.app",
  messagingSenderId: "948536456584",
  appId: "1:948536456584:web:2e47332cbd2729b2c1363d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const statusEl = document.getElementById("status");
const lastEventTimeEl = document.getElementById("lastEventTime");
const lastWeightTimeEl = document.getElementById("lastWeightTime");

const logBody = document.getElementById("logBody");
const weightLogBody = document.getElementById("weightLogBody");
const activeTagsBody = document.getElementById("activeTagsBody");
const searchEl = document.getElementById("search");

const weightStatusText = document.getElementById("weightStatusText");
const weightValueText = document.getElementById("weightValueText");
const weightInspectorText = document.getElementById("weightInspectorText");
const weightModeText = document.getElementById("weightModeText");
const weightCheckedAtText = document.getElementById("weightCheckedAtText");
const weightCountdownText = document.getElementById("weightCountdownText");

const ACTIVE_WINDOW_MS = 60 * 1000;
const WEIGHT_WINDOW_MS = 60 * 1000;

let eventsArr = [];      // RFID events
let latestByUid = {};    // latest RFID event by uidKey

let weightEventsArr = []; // weight event history
let latestWeight = null;  // latestWeightCheck/fireExtinguisher

function fmtTime(ms) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString();
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00";
  const sec = Math.ceil(ms / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function getRemainingMs(startMs, windowMs) {
  if (!startMs) return 0;
  return Math.max(0, windowMs - (Date.now() - startMs));
}

function rebuildLatestByUid() {
  latestByUid = {};

  for (const e of eventsArr) {
    if (!e.uidKey) continue;

    if (!latestByUid[e.uidKey] || (e.inspectedAt || 0) > (latestByUid[e.uidKey].inspectedAt || 0)) {
      latestByUid[e.uidKey] = e;
    }
  }
}

function renderActiveTags() {
  const q = (searchEl.value || "").trim().toLowerCase();
  activeTagsBody.innerHTML = "";

  const rows = Object.values(latestByUid).sort((a, b) => (b.inspectedAt || 0) - (a.inspectedAt || 0));

  for (const r of rows) {
    const hay = `${r.uidKey || ""} ${r.name || ""} ${r.inspector || ""} ${r.status || ""}`.toLowerCase();
    if (q && !hay.includes(q)) continue;

    const remainingMs = getRemainingMs(r.inspectedAt, ACTIVE_WINDOW_MS);
    const state = remainingMs > 0 ? `ACTIVE (${formatCountdown(remainingMs)})` : "EXPIRED";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.uidKey || ""}</td>
      <td>${r.name || ""}</td>
      <td>${state}</td>
      <td>${fmtTime(r.inspectedAt)}</td>
      <td>${r.status || ""}</td>
      <td>${r.inspector || ""}</td>
    `;
    activeTagsBody.appendChild(tr);
  }
}

function renderLog() {
  const q = (searchEl.value || "").trim().toLowerCase();
  logBody.innerHTML = "";

  const rows = [...eventsArr].sort((a, b) => (b.inspectedAt || 0) - (a.inspectedAt || 0));

  for (const r of rows) {
    const hay = `${r.uidKey || ""} ${r.name || ""} ${r.inspector || ""} ${r.status || ""}`.toLowerCase();
    if (q && !hay.includes(q)) continue;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmtTime(r.inspectedAt)}</td>
      <td>${r.uidKey || ""}</td>
      <td>${r.name || ""}</td>
      <td>${r.status || ""}</td>
      <td>${r.inspector || ""}</td>
    `;
    logBody.appendChild(tr);
  }
}

function renderWeightPanel() {
  if (!latestWeight) {
    weightStatusText.textContent = "—";
    weightValueText.textContent = "Weight: -";
    weightInspectorText.textContent = "Inspector: -";
    weightModeText.textContent = "Mode: -";
    weightCheckedAtText.textContent = "Checked at: -";
    weightCountdownText.textContent = "Next periodic refresh window: -";
    lastWeightTimeEl.textContent = "-";
    return;
  }

  const checkedAt = latestWeight.checkedAt || 0;
  const remainingMs = getRemainingMs(checkedAt, WEIGHT_WINDOW_MS);

  weightStatusText.textContent = latestWeight.weightStatus || "-";
  weightValueText.textContent = `Weight: ${latestWeight.weight_g ?? "-"} g`;
  weightInspectorText.textContent = `Inspector: ${latestWeight.inspector || "-"}`;
  weightModeText.textContent = `Mode: ${latestWeight.mode || "-"}`;
  weightCheckedAtText.textContent = `Checked at: ${fmtTime(checkedAt)}`;
  weightCountdownText.textContent =
    remainingMs > 0
      ? `Next periodic refresh window: ${formatCountdown(remainingMs)}`
      : "Next periodic refresh window: due";

  lastWeightTimeEl.textContent = fmtTime(checkedAt);
}

function renderWeightLog() {
  weightLogBody.innerHTML = "";

  const rows = [...weightEventsArr].sort((a, b) => (b.checkedAt || 0) - (a.checkedAt || 0));

  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmtTime(r.checkedAt)}</td>
      <td>${r.asset || ""}</td>
      <td>${r.weight_g ?? ""}</td>
      <td>${r.weightStatus || ""}</td>
      <td>${r.inspector || ""}</td>
      <td>${r.mode || ""}</td>
    `;
    weightLogBody.appendChild(tr);
  }
}

searchEl.addEventListener("input", () => {
  renderActiveTags();
  renderLog();
});

async function start() {
  try {
    statusEl.textContent = "Signing in (anonymous)...";
    await signInAnonymously(auth);

    statusEl.textContent = "Connected. Listening to RFID + weight events...";

    const evRef = query(ref(db, "inspectionEvents"), limitToLast(500));
    onValue(evRef, (snap) => {
      const obj = snap.val() || {};

      eventsArr = Object.entries(obj).map(([id, rec]) => ({
        id,
        uidKey: rec?.uidKey || "",
        name: rec?.name || "",
        status: rec?.status || "",
        inspector: rec?.inspector || "",
        inspectedAt: rec?.inspectedAt || 0
      }));

      const latestEventMs = eventsArr.reduce((mx, e) => Math.max(mx, e.inspectedAt || 0), 0);
      lastEventTimeEl.textContent = fmtTime(latestEventMs);

      rebuildLatestByUid();
      renderActiveTags();
      renderLog();
    });

    const latestWeightRef = ref(db, "latestWeightCheck/fireExtinguisher");
    onValue(latestWeightRef, (snap) => {
      latestWeight = snap.val() || null;
      renderWeightPanel();
    });

    const weightEventsRef = query(ref(db, "weightEvents"), limitToLast(200));
    onValue(weightEventsRef, (snap) => {
      const obj = snap.val() || {};
      weightEventsArr = Object.entries(obj).map(([id, rec]) => ({
        id,
        asset: rec?.asset || "",
        weight_g: rec?.weight_g,
        weightStatus: rec?.weightStatus || "",
        inspector: rec?.inspector || "",
        mode: rec?.mode || "",
        checkedAt: rec?.checkedAt || 0
      }));

      renderWeightLog();
    });

    setInterval(() => {
      renderActiveTags();
      renderWeightPanel();
    }, 250);

  } catch (e) {
    console.error(e);
    statusEl.textContent = "Error: " + (e?.message || e);
  }
}

start();
