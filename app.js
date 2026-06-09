// Register the PWA service worker background pipeline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log("SW register fail", err));
}

const API_ENDPOINT = "https://script.google.com/macros/s/AKfycbzAHoe2tIr1tuqLSljU9FfRy0CU95wudNvxAt5zhh0HeQAY3Qz1ZDsG5Y-Q5mwj57un/exec";
let audioCtx = null;

document.getElementById('activate-audio-btn').addEventListener('click', () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.getElementById('status-display').innerText = "Status: Intercom Audio Engine Online.";
    document.getElementById('activate-audio-btn').style.backgroundColor = "#7f8c8d";
    document.getElementById('activate-audio-btn').innerText = "Receiver Active";
  }
});

function triggerHardwareIntercomChime() {
  if (!audioCtx) return; // Wait until screen interaction is verified
  
  let time = audioCtx.currentTime;
  
  // Creates an automated rhythmic telephone intercom buzzer sound sequence
  for (let cycle = 0; cycle < 3; cycle++) {
    let osc1 = audioCtx.createOscillator();
    let osc2 = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    osc1.type = 'sine'; osc2.type = 'sine';
    osc1.frequency.setValueAtTime(350, time + (cycle * 0.8));
    osc2.frequency.setValueAtTime(440, time + (cycle * 0.8));
    
    gainNode.gain.setValueAtTime(0, time + (cycle * 0.8));
    gainNode.gain.linearRampToValueAtTime(0.2, time + (cycle * 0.8) + 0.05);
    gainNode.gain.setValueAtTime(0.2, time + (cycle * 0.8) + 0.45);
    gainNode.gain.linearRampToValueAtTime(0, time + (cycle * 0.8) + 0.5);
    
    osc1.connect(gainNode); osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.start(time + (cycle * 0.8)); osc2.start(time + (cycle * 0.8));
    osc1.stop(time + (cycle * 0.8) + 0.5); osc2.stop(time + (cycle * 0.8) + 0.5);
  }
}

// Network polling matrix: queries the API background registry for target rows
setInterval(() => {
  if (!audioCtx) return;
  
  fetch(`${API_ENDPOINT}?action=getActiveDeliveries`)
    .then(res => res.json())
    .then(payload => {
      if (payload.success && payload.data && payload.data.length > 0) {
        document.getElementById('status-display').innerText = `Alert: ${payload.data.length} active delivery verified at gate!`;
        triggerHardwareIntercomChime();
      } else {
        document.getElementById('status-display').innerText = "Status: Idle & Monitoring...";
      }
    })
    .catch(err => {
      document.getElementById('status-display').innerText = "Network link searching...";
    });
}, 5000); // Scans your sheets API loop every 5 seconds
