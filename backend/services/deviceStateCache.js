const deviceStates = {}; // { light: 'on', fan: 'off', air: 'on' }

function updateState(device, action) {
  deviceStates[device] = action;
  console.log(`Device state updated: ${device} = ${action}`);
}

function getState(device) {
  return deviceStates[device] || 'off'; // mặc định tắt
}

function getAllStates() {
  return { ...deviceStates };
}

function initializeFromDB(states) {
  Object.entries(states).forEach(([device, action]) => {
    deviceStates[device] = action;
  });
}

module.exports = {
  updateState,
  getState,
  getAllStates,
  initializeFromDB
};