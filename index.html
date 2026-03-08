<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Inspection Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom: 12px; }
    .card {
      border:1px solid #ddd;
      border-radius:10px;
      padding:12px;
      min-width:240px;
      background:#fff;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    table { width:100%; border-collapse: collapse; }
    th, td { border-bottom:1px solid #eee; padding:8px; text-align:left; }
    th { background:#fafafa; position: sticky; top:0; }
    .muted { color:#666; font-size: 12px; }
    input { padding:8px; width: 320px; }
    .big { font-size: 18px; font-weight: bold; }
    .section { margin-top: 20px; }
    .grid-2 { display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:16px; }

    .weight-good {
      background: #ecfdf3;
      border-color: #86efac;
    }

    .weight-replace {
      background: #fef2f2;
      border-color: #fca5a5;
    }

    .status-good {
      color: #166534;
      font-weight: bold;
    }

    .status-bad {
      color: #b91c1c;
      font-weight: bold;
    }

    .row-fail {
      background: #fff1f2;
    }

    .row-expired {
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <h2>Inspection Dashboard</h2>

  <div class="row">
    <div class="card">
      <div><b>Status</b></div>
      <div id="status" class="muted">Loading...</div>
    </div>

    <div class="card">
      <div><b>RFID active window</b></div>
      <div class="big">1 minute per unique tag</div>
      <div class="muted">Each UID resets independently when scanned</div>
    </div>

    <div class="card">
      <div><b>Last RFID event</b></div>
      <div id="lastEventTime" class="muted">-</div>
    </div>

    <div class="card">
      <div><b>Last weight check</b></div>
      <div id="lastWeightTime" class="muted">-</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card" id="weightCard">
      <div><b>Weight Sensor Live Status</b></div>
      <div id="weightStatusText" class="big">—</div>
      <div id="weightValueText" class="muted">Weight: -</div>
      <div id="weightInspectorText" class="muted">Inspector: -</div>
      <div id="weightModeText" class="muted">Mode: -</div>
      <div id="weightCheckedAtText" class="muted">Checked at: -</div>
      <div id="weightCountdownText" class="muted">Next periodic refresh window: -</div>
    </div>

    <div class="card">
      <div><b>Weight Check Rule</b></div>
      <div class="big">Every 60 seconds</div>
      <div class="muted">Auto in MENU/ENROLL, inspector sign-off in INSPECTION mode</div>
    </div>
  </div>

  <div class="row" style="margin-top:16px;">
    <input id="search" placeholder="Search name / uidKey / inspector..." />
  </div>

  <div class="section">
    <h3>Live Active RFID Tags</h3>
    <table>
      <thead>
        <tr>
          <th>UID Key</th>
          <th>Name</th>
          <th>Window Status</th>
          <th>Last Scanned</th>
          <th>Status</th>
          <th>Inspector</th>
        </tr>
      </thead>
      <tbody id="activeTagsBody"></tbody>
    </table>
  </div>

  <div class="section">
    <h3>RFID Inspection Log</h3>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>UID Key</th>
          <th>Name</th>
          <th>Status</th>
          <th>Inspector</th>
        </tr>
      </thead>
      <tbody id="logBody"></tbody>
    </table>
  </div>

  <div class="section">
    <h3>Weight Check Log</h3>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Asset</th>
          <th>Weight (g)</th>
          <th>Weight Status</th>
          <th>Inspector</th>
          <th>Mode</th>
        </tr>
      </thead>
      <tbody id="weightLogBody"></tbody>
    </table>
  </div>

  <script type="module" src="./app.js"></script>
</body>
</html>
