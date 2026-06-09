if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log("SW Register Failed", err));
}

// PASTE YOUR LIVE SNAPSHOT GOOGLE WEB APP URL EXTRACTED FROM MANAGE DEPLOYMENTS BELOW
const API_ENDPOINT = "PASTE_YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_URL_HERE";
let audioCtx = null;
let currentActiveCount = 0;

document.getElementById('activate-audio-btn').addEventListener('click', () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.getElementById('status-display').innerText = "Status: Monitoring Gate...";
    document.getElementById('activate-audio-btn').style.display = "none";
  }
});

function triggerHardwareIntercomChime() {
  if (!audioCtx) return;
  let time = audioCtx.currentTime;
  for (let cycle = 0; cycle < 2; cycle++) {
    let osc1 = audioCtx.createOscillator();
    let osc2 = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    osc1.type = 'sine'; osc2.type = 'sine';
    osc1.frequency.setValueAtTime(880, time + (cycle * 0.6));
    osc2.frequency.setValueAtTime(440, time + (cycle * 0.6) + 0.1);
    gainNode.gain.setValueAtTime(0, time + (cycle * 0.6));
    gainNode.gain.linearRampToValueAtTime(0.3, time + (cycle * 0.6) + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, time + (cycle * 0.6) + 0.4);
    osc1.connect(gainNode); osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc1.start(time + (cycle * 0.6)); osc2.start(time + (cycle * 0.6));
    osc1.stop(time + (cycle * 0.6) + 0.4); osc2.stop(time + (cycle * 0.6) + 0.4);
  }
}

function approveEntry(mobile, flat) {
  document.getElementById('status-display').innerText = "Sending authorization...";
  fetch(`${API_ENDPOINT}?action=approveVisitor&mobile=${mobile}&flat=${flat}`)
    .then(res => res.json())
    .then(res => {
       if(res.success) {
         document.getElementById('status-display').innerText = "Access Granted Successfully!";
         pollGateRegistry();
       } else {
         document.getElementById('status-display').innerText = "Approval failed. Try again.";
       }
    })
    .catch(() => {
      document.getElementById('status-display').innerText = "Network Error.";
    });
}

function pollGateRegistry() {
  if (!audioCtx) return;
  
  fetch(`${API_ENDPOINT}?action=getActiveDeliveries`)
    .then(res => res.json())
    .then(payload => {
      const listContainer = document.getElementById('visitor-list');
      listContainer.innerHTML = "";
      
      if (payload.success && payload.data && payload.data.length > 0) {
        document.getElementById('status-display').innerText = `Alert: ${payload.data.length} Entry Pending Approval`;
        
        if (payload.data.length > currentActiveCount) {
          triggerHardwareIntercomChime();
        }
        currentActiveCount = payload.data.length;
        
        payload.data.forEach(visitor => {
          let card = document.createElement('div');
          card.className = "visitor-card";
          card.innerHTML = `
            <div class="visitor-info">
              <strong>${visitor.subCat.toUpperCase()} Entry</strong><br>
              Name: ${visitor.name}<br>
              Flat Destination: ${visitor.flat}<br>
              ID Ref: ******${String(visitor.mobile).slice(-4)}
            </div>
            <button class="action-btn" onclick="approveEntry('${visitor.mobile}', '${visitor.flat}')">TAP TO ALLOW ENTRY</button>
          `;
          listContainer.appendChild(card);
        });
      } else {
        currentActiveCount = 0;
        document.getElementById('status-display').innerText = "Status: Monitoring Gate...";
      }
    })
    .catch(() => {
      document.getElementById('status-display').innerText = "Network Link Searching...";
    });
}

setInterval(pollGateRegistry, 4000);
