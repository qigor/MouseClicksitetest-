// State
let clicks = 0;
let doubleClicks = 0;
let isCpsTestRunning = false;
let cpsStartTime = 0;
let cpsTimer = null;
const CPS_DURATION = 10000; // 10 seconds

let lastClickTime = {
  0: 0, // Left
  1: 0, // Middle
  2: 0, // Right
  3: 0, // Mouse4
  4: 0  // Mouse5
};
const DOUBLE_CLICK_THRESHOLD = 80; // ms

// Polling rate vars
let mouseMoveEvents = 0;
let lastPollingTime = performance.now();

// DOM Elements
const testArena = document.getElementById('test-arena');
const eventLog = document.getElementById('event-log');
const statClicks = document.getElementById('stat-clicks');
const statCps = document.getElementById('stat-cps');
const statDoubleClicks = document.getElementById('stat-double-clicks');
const statPolling = document.getElementById('stat-polling');
const statScroll = document.getElementById('stat-scroll');

const btnStartCps = document.getElementById('btn-start-cps');
const btnReset = document.getElementById('btn-reset');

// Mouse buttons mapping to UI
const buttonMap = {
  0: document.getElementById('btn-left'),
  1: document.getElementById('btn-wheel'),
  2: document.getElementById('btn-right'),
  3: document.getElementById('btn-side-front'),
  4: document.getElementById('btn-side-back')
};

const buttonNames = {
  0: 'Left Button',
  1: 'Middle Wheel Button',
  2: 'Right Button',
  3: 'Side Button (Mouse 4)',
  4: 'Side Button (Mouse 5)'
};

// Utilities
function logEvent(type, message, isError = false) {
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  const li = document.createElement('li');
  let typeClass = '';
  
  if (isError) typeClass = 'error';
  else if (type === 'DOWN') typeClass = 'down';
  else if (type === 'UP') typeClass = 'up';
  else if (type === 'SCROLL') typeClass = 'scroll';
  else typeClass = 'system';
  
  li.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-type ${typeClass}">${type}</span>: ${message}`;
  
  eventLog.prepend(li);
  if (eventLog.children.length > 50) {
    eventLog.removeChild(eventLog.lastChild);
  }
}

function updateStats() {
  statClicks.textContent = clicks;
  statDoubleClicks.textContent = doubleClicks;
}

// Event Listeners for Mouse actions
testArena.addEventListener('contextmenu', (e) => {
  e.preventDefault(); // Prevent right-click menu
});

testArena.addEventListener('mousedown', (e) => {
  e.preventDefault(); // Prevent text selection
  
  const btnId = e.button;
  const now = performance.now();
  
  // Double click detection
  const timeSinceLastClick = now - lastClickTime[btnId];
  let isDouble = false;
  
  if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD && timeSinceLastClick > 0) {
    doubleClicks++;
    isDouble = true;
    logEvent('WARNING', `Potential Double Click on ${buttonNames[btnId]} (${Math.round(timeSinceLastClick)}ms)`, true);
  }
  
  lastClickTime[btnId] = now;
  clicks++;
  
  // Update UI
  if (buttonMap[btnId]) {
    buttonMap[btnId].classList.add(isDouble ? 'active-error' : 'active');
  }
  
  logEvent('DOWN', buttonNames[btnId] || `Unknown Button (${btnId})`);
  
  updateStats();
});

testArena.addEventListener('mouseup', (e) => {
  e.preventDefault();
  const btnId = e.button;
  
  if (buttonMap[btnId]) {
    buttonMap[btnId].classList.remove('active', 'active-error');
  }
  
  logEvent('UP', buttonNames[btnId] || `Unknown Button (${btnId})`);
});

testArena.addEventListener('wheel', (e) => {
  e.preventDefault();
  
  const direction = e.deltaY > 0 ? 'Down' : 'Up';
  statScroll.textContent = Math.abs(e.deltaY);
  
  buttonMap[1].classList.add('active');
  setTimeout(() => buttonMap[1].classList.remove('active'), 100);
  
  logEvent('SCROLL', `${direction} (Delta: ${Math.round(e.deltaY)})`);
});

// Polling Rate Checker
testArena.addEventListener('mousemove', () => {
  mouseMoveEvents++;
});

// Calculate Polling Rate every second
setInterval(() => {
  const now = performance.now();
  const elapsed = now - lastPollingTime;
  
  if (elapsed >= 1000) {
    const rate = Math.round((mouseMoveEvents / elapsed) * 1000);
    statPolling.textContent = rate > 0 ? rate : 0;
    mouseMoveEvents = 0;
    lastPollingTime = now;
  }
}, 1000);

// CPS Test Logic
function updateCpsTimer() {
  const now = performance.now();
  const elapsed = now - cpsStartTime;
  const remaining = Math.max(0, CPS_DURATION - elapsed);
  
  // Calculate current CPS
  const elapsedSeconds = elapsed / 1000;
  const currentCps = elapsedSeconds > 0 ? (clicks / elapsedSeconds).toFixed(2) : '0.00';
  statCps.textContent = currentCps;
  
  btnStartCps.textContent = `Test Running: ${(remaining / 1000).toFixed(1)}s`;
  
  if (remaining <= 0) {
    endCpsTest(currentCps);
  } else {
    cpsTimer = requestAnimationFrame(updateCpsTimer);
  }
}

function startCpsTest() {
  if (isCpsTestRunning) return;
  
  clicks = 0;
  doubleClicks = 0;
  updateStats();
  
  isCpsTestRunning = true;
  cpsStartTime = performance.now();
  btnStartCps.classList.remove('primary');
  btnStartCps.classList.add('secondary');
  btnStartCps.disabled = true;
  
  logEvent('SYSTEM', 'CPS Test Started (10 seconds)');
  cpsTimer = requestAnimationFrame(updateCpsTimer);
}

function endCpsTest(finalCps) {
  isCpsTestRunning = false;
  cancelAnimationFrame(cpsTimer);
  
  btnStartCps.textContent = 'Start 10s CPS Test';
  btnStartCps.classList.remove('secondary');
  btnStartCps.classList.add('primary');
  btnStartCps.disabled = false;
  
  statCps.textContent = finalCps;
  logEvent('SYSTEM', `CPS Test Ended. Result: ${finalCps} CPS`);
  alert(`CPS Test Finished!\nYour Score: ${finalCps} Clicks Per Second\nTotal Clicks: ${clicks}`);
}

btnStartCps.addEventListener('click', startCpsTest);

btnReset.addEventListener('click', () => {
  clicks = 0;
  doubleClicks = 0;
  statCps.textContent = '0.00';
  statScroll.textContent = '0';
  eventLog.innerHTML = '<li>Waiting for mouse events...</li>';
  updateStats();
  logEvent('SYSTEM', 'Stats Reset');
});
