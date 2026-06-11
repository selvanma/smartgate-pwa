if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => alert("SW Registration Error: " + err));
}

const API_ENDPOINT = "PASTE_YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_URL_HERE";

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
const VAPID_KEY = "PASTE_YOUR_GENERATE_KEY_PAIR_VAPID_STRING_HERE";

document.getElementById('activate-audio-btn').addEventListener('click', () => {
  const flatVal = document.getElementById('flat-input').value.trim();
  if(!flatVal) { alert("Please enter your flat number first."); return; }

  Notification.requestPermission()
    .then((permission) => {
      if (permission === 'granted') {
        messaging.getToken({ vapidKey: VAPID_KEY })
          .then((currentToken) => {
            if (currentToken) {
              // Direct synchronization check
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

// Force-clear memory loop diagnostic override
window.addEventListener('load', () => {
  const savedFlat = localStorage.getItem('registeredFlat');
  if(savedFlat) {
    // If the spreadsheet lacks rows, clear memory and force setup box visibility
    document.getElementById('status-display').innerText = "Verifying cloud link sync...";
  }
});
