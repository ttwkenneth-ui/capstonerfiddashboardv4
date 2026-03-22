import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  query,
  limitToLast
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

// ===== DOM =====
const statusEl = document.getElementById("status");
const lastEventTimeEl = document.getElementById("lastEventTime");
const lastWeightTimeEl = document.getElementById("lastWeightTime");

const logBody = document.getElementById("logBody");
const activeTagsBody = document.getElementById("activeTagsBody");
const weightLogBody = document.getElementById("weightLogBody");
const searchEl = document.getElementById("search");

const weightCard = document.getElementById("weightCard");
const weightStatusText = document.getElementById("weightStatusText");
const weightValueText = document.getElementById("weightValueText");
const weightInspectorText = document.getElementById("weightInspectorText");
const weightModeText = document.getElementById("weightModeText");
const weightCheckedAtText = document.getElementById("weightCheckedAtText");
const weightCountdownText = document.getElementById("weightCountdownText");

// ===== CONSTANTS =====
const ACTIVE_WINDOW_MS = 60 * 1000;

// ===== STATE =====
let eventsArr = [];        // inspectionEvents
let latestByUid = {};      // latest event by uidKey
let weightEventsArr = [];  // weightEvents
let latestWeight = null;   // latestWeightCheck/fireExtinguisher

// ===== HELPERS =====
function fmtTime(ms) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString();
}

function getRemainingMs(inspectedAt) {
  if (!inspectedAt) return 0;
  return Math.max(0, ACTIVE_WINDOW_MS - (Date.now() - inspectedAt));
}

function formatCountdown(ms) {
  const sec = Math.ceil(ms / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function getSearchText() {
  return (searchEl?.value || "").trim().toLowerCase();
}

function setStatusText(text) {
  if (statusEl) statusEl.textContent = text;
}

function rebuildLatestByUid() {
  latestByUid = {};

  for (const e of eventsArr) {
    if (!e.uidKey) continue;

    if (
      !latestByUid[e.uidKey] ||
      (e.inspectedAt || 0) > (latestByUid[e.uidKey].inspectedAt || 0)
    ) {
      latestByUid[e.uidKey] = e;
    }
  }
}

// ===== RENDER: ACTIVE RFID TAGS =====
function renderActiveTags() {
  if (!activeTagsBody) return;

  const q = getSearchText();
  activeTagsBody.innerHTML = "";

  const rows = Object.values(latestByUid).sort(
    (a, b) => (b.inspectedAt || 0) - (a.inspectedAt || 0)
  );

  for (const r of rows) {
    const hay = `${r.uidKey || ""} ${r.name || ""} ${r.inspector || ""} ${r.status || ""}`.toLowerCase();
    if (q && !hay.includes(q)) continue;

    const remainingMs = getRemainingMs(r.inspectedAt);
    const isActive = remainingMs > 0;
    const state = isActive ? `ACTIVE (${formatCountdown(remainingMs)})` : "EXPIRED";

    const tr = document.createElement("tr");

    if (!isActive) tr.classList.add("row-expired");
    if ((r.status || "").toUpperCase() === "FAIL") tr.classList.add("row-fail");

    tr.innerHTML = `
      <td>${r.uidKey || ""}</td>
      <td>${r.name || ""}</td>
      <td>${state}</td>
      <td>${fmtTime(r.inspectedAt)}</td>
      <td class="${(r.status || "").toUpperCase() === "OK" ? "status-good" : "status-bad"}">${r.status || ""}</td>
      <td>${r.inspector || ""}</td>
    `;

    activeTagsBody.appendChild(tr);
  }
}

// ===== RENDER: RFID LOG =====
function renderLog() {
  if (!logBody) return;

  const q = getSearchText();
  logBody.innerHTML = "";

  const rows = [...eventsArr].sort((a, b) => (b.inspectedAt || 0) - (a.inspectedAt || 0));

  for (const r of rows) {
    const hay = `${r.uidKey || ""} ${r.name || ""} ${r.inspector || ""} ${r.status || ""}`.toLowerCase();
    if (q && !hay.includes(q)) continue;

    const tr = document.createElement("tr");

    if ((r.status || "").toUpperCase() === "FAIL") tr.classList.add("row-fail");

    tr.innerHTML = `
      <td>${fmtTime(r.inspectedAt)}</td>
      <td>${r.uidKey || ""}</td>
      <td>${r.name || ""}</td>
      <td class="${(r.status || "").toUpperCase() === "OK" ? "status-good" : "status-bad"}">${r.status || ""}</td>
      <td>${r.inspector || ""}</td>
    `;

    logBody.appendChild(tr);
  }
}

// ===== RENDER: WEIGHT CARD =====
function renderWeightCard() {
  if (!weightStatusText) return;

  if (!latestWeight) {
    weightStatusText.textContent = "—";
    weightValueText.textContent = "Weight: -";
    weightInspectorText.textContent = "Inspector: -";
    weightModeText.textContent = "Mode: -";
    weightCheckedAtText.textContent = "Checked at: -";
    weightCountdownText.textContent = "Next periodic refresh window: -";

    if (weightCard) {
      weightCard.classList.remove("weight-good", "weight-replace");
    }

    if (lastWeightTimeEl) {
      lastWeightTimeEl.textContent = "-";
    }

    return;
  }

  const checkedAt = latestWeight.checkedAt || 0;
  const weightStatus = latestWeight.weightStatus || "-";

  weightStatusText.textContent = weightStatus;
  weightValueText.textContent = `Weight: ${latestWeight.weight_g ?? "-"} g`;
  weightInspectorText.textContent = `Inspector: ${latestWeight.inspector || "-"}`;
  weightModeText.textContent = `Mode: ${latestWeight.mode || "-"}`;
  weightCheckedAtText.textContent = `Checked at: ${fmtTime(checkedAt)}`;

  const remainingMs = getRemainingMs(checkedAt);
  weightCountdownText.textContent = `Next periodic refresh window: ${formatCountdown(remainingMs)}`;

  if (lastWeightTimeEl) {
    lastWeightTimeEl.textContent = fmtTime(checkedAt);
  }

  if (weightCard) {
    weightCard.classList.remove("weight-good", "weight-replace");

    if (weightStatus === "GOOD") {
      weightCard.classList.add("weight-good");
    } else if (weightStatus === "REPLACE") {
      weightCard.classList.add("weight-replace");
    }
  }
}

// ===== RENDER: WEIGHT LOG =====
function renderWeightLog() {
  if (!weightLogBody) return;

  const q = getSearchText();
  weightLogBody.innerHTML = "";

  const rows = [...weightEventsArr].sort((a, b) => (b.checkedAt || 0) - (a.checkedAt || 0));

  for (const r of rows) {
    const hay = `${r.asset || ""} ${r.weightStatus || ""} ${r.inspector || ""} ${r.mode || ""}`.toLowerCase();
    if (q && !hay.includes(q)) continue;

    const tr = document.createElement("tr");

    if ((r.weightStatus || "").toUpperCase() === "REPLACE") {
      tr.classList.add("row-fail");
    }

    tr.innerHTML = `
      <td>${fmtTime(r.checkedAt)}</td>
      <td>${r.asset || ""}</td>
      <td>${r.weight_g ?? ""}</td>
      <td class="${(r.weightStatus || "").toUpperCase() === "GOOD" ? "status-good" : "status-bad"}">${r.weightStatus || ""}</td>
      <td>${r.inspector || ""}</td>
      <td>${r.mode || ""}</td>
    `;

    weightLogBody.appendChild(tr);
  }
}

// ===== EVENTS =====
if (searchEl) {
  searchEl.addEventListener("input", () => {
    renderActiveTags();
    renderLog();
    renderWeightLog();
  });
}

// ===== START =====
async function start() {
  try {
    setStatusText("Signing in (anonymous)...");
    await signInAnonymously(auth);

    setStatusText("Connected. Listening to Firebase...");

    // RFID inspection events
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

      const latestEventMs = eventsArr.reduce(
        (mx, e) => Math.max(mx, e.inspectedAt || 0),
        0
      );

      if (lastEventTimeEl) {
        lastEventTimeEl.textContent = fmtTime(latestEventMs);
      }

      rebuildLatestByUid();
      renderActiveTags();
      renderLog();
    });

    // Latest weight check
    const latestWeightRef = ref(db, "latestWeightCheck/fireExtinguisher");
    onValue(latestWeightRef, (snap) => {
      latestWeight = snap.val() || null;
      renderWeightCard();
    });

    // Weight event log
    const weightEvRef = query(ref(db, "weightEvents"), limitToLast(500));
    onValue(weightEvRef, (snap) => {
      const obj = snap.val() || {};

      weightEventsArr = Object.entries(obj).map(([id, rec]) => ({
        id,
        asset: rec?.asset || "",
        weight_g: rec?.weight_g ?? "",
        weightStatus: rec?.weightStatus || "",
        inspector: rec?.inspector || "",
        mode: rec?.mode || "",
        checkedAt: rec?.checkedAt || 0
      }));

      renderWeightLog();
    });

    // live refresh for countdown timers
    setInterval(() => {
      renderActiveTags();
      renderWeightCard();
    }, 250);

  } catch (e) {
    console.error(e);
    setStatusText("Error: " + (e?.message || e));
  }
}

start();
