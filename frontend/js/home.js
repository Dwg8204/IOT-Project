const ctx = document.getElementById('sensorChart').getContext('2d');
const labels = [];
const tempData = [];
const humData = [];
const lightData = [];

function pushPoint(d) {
  if (!d) return;
  const t = d.createdAt || d.createAt || new Date().toISOString();
  const label = new Date(t).toLocaleTimeString();
  labels.push(label);
  tempData.push(typeof d.temperature === 'number' ? d.temperature : null);
  humData.push(typeof d.humidity === 'number' ? d.humidity : null);
  lightData.push(typeof d.light === 'number' ? d.light : null);
  if (labels.length > 50) {
    labels.shift(); tempData.shift(); humData.shift(); lightData.shift();
  }
  chart.update();
}

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels,
    datasets: [
      { label: 'Nhiệt độ (°C)', data: tempData, borderColor: '#e63737', backgroundColor: '#e63737', tension: .35, yAxisID: 'temp', pointRadius: 2 },
      { label: 'Độ ẩm (%)', data: humData, borderColor: '#1d6ce0', backgroundColor: '#1d6ce0', tension: .35, yAxisID: 'hum', pointRadius: 2 },
      { label: 'Ánh sáng (LUX)', data: lightData, borderColor: '#f5a623', backgroundColor: '#f5a623', tension: .35, yAxisID: 'light', pointRadius: 2 }
    ]
  },
  options: {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    maintainAspectRatio: false,
    scales: {
      temp: { type: 'linear', position: 'left', title: { display: true, text: '°C' }, suggestedMin: 0, suggestedMax: 50 },
      hum: { type: 'linear', position: 'left', grid: { drawOnChartArea: false }, title: { display: true, text: '%RH' }, suggestedMin: 0, suggestedMax: 100 },
      light: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'LUX' } }
    },
    plugins: { legend: { position: 'top' } }
  }
});

function updateCards(d) {
  if (!d) return;
  document.getElementById('tempVal').textContent = d.temperature ?? '--';
  document.getElementById('humVal').textContent = d.humidity ?? '--';
  document.getElementById('lightVal').textContent = d.light ?? '--';
}

async function loadChartOnce() {
  try {
    const res = await fetch('http://localhost:3000/api/chart');
    if (!res.ok) return;
    const arr = await res.json();
    labels.length = tempData.length = humData.length = lightData.length = 0;
    arr.forEach(item => pushPoint(item));
  } catch (e) { console.warn(e); }
}

async function sendAction(device, actionStr) {
  try {
    const res = await fetch('http://localhost:3000/api/action-history/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device, action: actionStr })
    });
    if (!res.ok) {
      const err = await res.json();
      alert('Lỗi khi gửi lệnh: ' + (err.message || res.statusText));
      return false;
    }
    const data = await res.json();
    console.log("ACK ok:", data);
    return true;
  } catch (e) { console.warn(e); }
}

function bindToggle(id, device) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', async () => {
    const desired = el.checked;
    const actionStr = desired ? 'on' : 'off';
    el.disabled = true;
    const success = await sendAction(device, actionStr);
    if (!success) el.checked = !desired;
    el.disabled = false;
  });
}

async function loadLatest() {
  try {
    const res = await fetch('http://localhost:3000/api/data');
    if (!res.ok) return;
    const latest = await res.json();
    if (latest) {
      updateCards(latest);
      if (tempData.length === 0 ||
        latest.temperature !== tempData[tempData.length - 1] ||
        latest.humidity !== humData[humData.length - 1] ||
        latest.light !== lightData[lightData.length - 1]) {
        pushPoint(latest);
      }
    }
  } catch (e) { console.warn(e); }
}

async function loadDeviceStates() {
  try {
    const res = await fetch('http://localhost:3000/api/action-history/device-states');
    if (!res.ok) return;
    const states = await res.json();
    document.getElementById('ledSwitch').checked = states.light || false;
    document.getElementById('fanSwitch').checked = states.fan || false;
    document.getElementById('acSwitch').checked = states.air || false;
  } catch (e) { console.warn("Lỗi load trạng thái:", e); }
}

async function init() {
  await loadDeviceStates();
  bindToggle('ledSwitch', 'light');
  bindToggle('fanSwitch', 'fan');
  bindToggle('acSwitch', 'air');
  await loadChartOnce();
  await loadLatest();
}

init();
setInterval(loadLatest, 5000);
