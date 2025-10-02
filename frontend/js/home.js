const ctx = document.getElementById('sensorChart').getContext('2d');
const labels = [];
const tempData = [];
const humData = [];
const lightData = [];

// ============= THÊM MỚI: ALERT SYSTEM =============

// Alert thresholds
const THRESHOLDS = {
  temperature: { max: 25, type: 'max' },
  humidity: { min: 60, type: 'min' },
  light: { max: 2000, type: 'max' }
};

// Alert state tracking
let alertHistory = new Set();
let lastAlertTime = {};

// Create alert notification
function createAlert(type, value, threshold, isExceeded) {
  const alertId = `${type}-${Date.now()}`;
  
  const alertTypes = {
    temperature: {
      icon: 'bi-thermometer-high',
      title: '🔥 Cảnh báo Nhiệt độ!',
      class: 'alert-temperature'
    },
    humidity: {
      icon: 'bi-droplet',
      title: '💧 Cảnh báo Độ ẩm!',
      class: 'alert-humidity'
    },
    light: {
      icon: 'bi-brightness-high',
      title: '☀️ Cảnh báo Ánh sáng!',
      class: 'alert-light'
    }
  };

  const config = alertTypes[type];
  
  let message = '';
  if (type === 'temperature') {
    message = `Nhiệt độ hiện tại: ${value}°C vượt quá ngưỡng an toàn ${threshold}°C`;
  } else if (type === 'humidity') {
    message = `Độ ẩm hiện tại: ${value}% thấp hơn mức tối thiểu ${threshold}%`;
  } else if (type === 'light') {
    message = `Ánh sáng hiện tại: ${value} LUX vượt quá ngưỡng an toàn ${threshold} LUX`;
  }

  const alertHTML = `
    <div class="custom-alert ${config.class}" id="${alertId}">
      <div class="alert-header">
        <div style="display: flex; align-items: center;">
          <i class="bi ${config.icon} alert-icon"></i>
          <span class="alert-title">${config.title}</span>
        </div>
        <button class="alert-close" onclick="closeAlert('${alertId}')">
          <i class="bi bi-x"></i>
        </button>
      </div>
      <div class="alert-message">${message}</div>
      <div class="alert-timestamp">${new Date().toLocaleTimeString('vi-VN')}</div>
    </div>
  `;

  const container = document.getElementById('alertContainer');
  container.insertAdjacentHTML('afterbegin', alertHTML);

  // Animate in
  setTimeout(() => {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
      alertElement.classList.add('show');
    }
  }, 100);

  // Auto close after 10 seconds
  setTimeout(() => {
    closeAlert(alertId);
  }, 10000);

  // Play sound
  playAlertSound();
}

// Close alert
function closeAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.classList.remove('show');
    setTimeout(() => {
      alert.remove();
    }, 500);
  }
}

// Play alert sound
function playAlertSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
}

// Update status indicators
function updateStatusIndicators(temp, hum, light) {
  // Temperature status
  const tempStatus = document.getElementById('tempStatus');
  const tempCard = document.getElementById('tempCard');
  if (tempStatus && tempCard) {
    if (temp > THRESHOLDS.temperature.max) {
      tempStatus.className = 'status-indicator danger';
      tempCard.className = 'sensor-card card-red danger';
    } else if (temp > THRESHOLDS.temperature.max * 0.9) {
      tempStatus.className = 'status-indicator warning';
      tempCard.className = 'sensor-card card-red warning';
    } else {
      tempStatus.className = 'status-indicator';
      tempCard.className = 'sensor-card card-red';
    }
  }

  // Humidity status
  const humStatus = document.getElementById('humStatus');
  const humCard = document.getElementById('humCard');
  if (humStatus && humCard) {
    if (hum < THRESHOLDS.humidity.min) {
      humStatus.className = 'status-indicator danger';
      humCard.className = 'sensor-card card-blue danger';
    } else if (hum < THRESHOLDS.humidity.min * 1.1) {
      humStatus.className = 'status-indicator warning';
      humCard.className = 'sensor-card card-blue warning';
    } else {
      humStatus.className = 'status-indicator';
      humCard.className = 'sensor-card card-blue';
    }
  }

  // Light status
  const lightStatus = document.getElementById('lightStatus');
  const lightCard = document.getElementById('lightCard');
  if (lightStatus && lightCard) {
    if (light > THRESHOLDS.light.max) {
      lightStatus.className = 'status-indicator danger';
      lightCard.className = 'sensor-card card-yellow danger';
    } else if (light > THRESHOLDS.light.max * 0.9) {
      lightStatus.className = 'status-indicator warning';
      lightCard.className = 'sensor-card card-yellow warning';
    } else {
      lightStatus.className = 'status-indicator';
      lightCard.className = 'sensor-card card-yellow';
    }
  }
}

// Check for alerts
function checkAlerts(data) {
  if (!data) return;

  const { temperature, humidity, light } = data;
  const now = Date.now();

  // Check temperature
  if (temperature > THRESHOLDS.temperature.max) {
    const alertKey = `temp-${Math.floor(temperature)}`;
    if (!alertHistory.has(alertKey) || (now - (lastAlertTime.temperature || 0) > 60000)) {
      createAlert('temperature', temperature, THRESHOLDS.temperature.max, true);
      alertHistory.add(alertKey);
      lastAlertTime.temperature = now;
    }
  }

  // Check humidity
  if (humidity < THRESHOLDS.humidity.min) {
    const alertKey = `hum-${Math.floor(humidity)}`;
    if (!alertHistory.has(alertKey) || (now - (lastAlertTime.humidity || 0) > 60000)) {
      createAlert('humidity', humidity, THRESHOLDS.humidity.min, false);
      alertHistory.add(alertKey);
      lastAlertTime.humidity = now;
    }
  }

  // Check light
  if (light > THRESHOLDS.light.max) {
    const alertKey = `light-${Math.floor(light/100)}`;
    if (!alertHistory.has(alertKey) || (now - (lastAlertTime.light || 0) > 60000)) {
      createAlert('light', light, THRESHOLDS.light.max, true);
      alertHistory.add(alertKey);
      lastAlertTime.light = now;
    }
  }
}

// ============= KẾT THÚC PHẦN ALERT SYSTEM =============

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
  const temp = d.temperature ?? '--';
  const hum = d.humidity ?? '--';
  const light = d.light ?? '--';
  
  document.getElementById('tempVal').textContent = temp;
  document.getElementById('humVal').textContent = hum;
  document.getElementById('lightVal').textContent = light;

  // THÊM MỚI: Check alerts và update status khi có dữ liệu hợp lệ
  if (temp !== '--' && hum !== '--' && light !== '--') {
    checkAlerts({ temperature: temp, humidity: hum, light: light });
    updateStatusIndicators(temp, hum, light);
  }
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