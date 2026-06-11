// Global placeholder to store our local subfolder service worker registration
let nativeSwRegistration = null;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(registration => {
      nativeSwRegistration = registration;
    })
    .catch(err => alert("SW Registration Error: " + err));
}

const API_ENDPOINT = "https://script.google.com/macros/s/AKfycbyjLjeK1OeNmJilpJ2Xj58rVFOSTrTP_0BvCUtZulYG8yqlYpgA9iefKPXLm4pfKQ0E/exec";

const firebaseConfig = {
  apiKey: "AIzaSyCIL6Gq5xsKcBBSPh0udc27QDJ1cq7Y8hA",
  authDomain: "smartgate-fcm.firebaseapp.com",
  projectId: "smartgate-fcm",
  storageBucket: "smartgate-fcm.firebasestorage.app",
  messagingSenderId: "590826858960",
  appId: "1:590826858960:web:8ac415d1461842461731d5"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
const VAPID_KEY = "BEQ4Iq4So0e1u87KTHWLEMC2xIF0DJgT7Z3o6OnoXLFe6vRkB88r0ol3V1IwFKZ94iXtRpFr_d9CaXFDRG2Rt0Q";

document.getElementById('activate-audio-btn').addEventListener('click', () => {
  const flatVal = document.getElementById('flat-input').value.trim();
  if(!flatVal) { alert("Please enter your flat number first."); return; }
  if(!nativeSwRegistration) { alert("System initializing background services. Please tap again in 2 seconds."); return; }

  Notification.requestPermission()
    .then((permission) => {
      if (permission === 'granted') {
        // CRITICAL FIX: Forces Firebase to use our subfolder sw.js instead of looking at the root domain
        messaging.getToken({ 
          serviceWorkerRegistration: nativeSwRegistration, 
          vapidKey: VAPID_KEY 
        })
        .then((currentToken) => {
          if (currentToken) {
            fetch(`${API_ENDPOINT}?action=registerToken&flat=${flatVal}&token=${currentToken}`)
              .then(res => res.json())
              .then(res => {
                if(res.success) {
                  alert("Success! Hardware link recorded in Google Sheets.");
                  document.getElementById('setup-area').style.display = "none";
                  document.getElementById('status-display').innerText = `Linked to Flat ${flatVal} | Monitoring...`;
                  localStorage.setItem('registeredFlat', flatVal);
                } else {
                  alert("Sheet rejected token registration.");
                }
              })
              .catch(err => alert("Network transmission failed to reach sheet: " + err));
          } else {
            alert("No token generated. Check your Firebase VAPID key configurations.");
          }
        })
        .catch(err => alert("FCM Token Error: " + err));
      } else {
        alert("Notification permission denied by handset user.");
      }
    })
    .catch(err => alert("Notification Permission Core Error: " + err));
});

window.addEventListener('load', () => {
  const savedFlat = localStorage.getItem('registeredFlat');
  if(savedFlat) {
    document.getElementById('setup-area').style.display = "none";
    document.getElementById('status-display').innerText = `Linked to Flat ${savedFlat} | Monitoring...`;
  }
});
