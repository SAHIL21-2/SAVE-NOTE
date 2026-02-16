// 1. CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyAwt0DhSHWkQUHMFrcanpDg9270v8IcpV8",
    authDomain: "save-note-146ec.firebaseapp.com",
    projectId: "save-note-146ec",
    storageBucket: "save-note-146ec.firebasestorage.app",
    messagingSenderId: "1015048681656",
    appId: "1:1015048681656:web:ebff97743021c3dd65dc4d",
    measurementId: "G-VEMRQ2Y53E"
};

// Initialize
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let isLogin = true;

// --- AUTH UI LOGIC ---
const authOverlay = document.getElementById("auth-overlay");
const mainApp = document.getElementById("main-app");
const authBtn = document.getElementById("auth-btn");
const toggleBtn = document.getElementById("toggle-auth");
const title = document.getElementById("auth-title");

// Toggle Login/Signup
toggleBtn.addEventListener("click", () => {
    isLogin = !isLogin;
    title.innerText = isLogin ? "Welcome Back" : "Join Us";
    authBtn.innerText = isLogin ? "Log In" : "Sign Up";
    toggleBtn.innerText = isLogin ? "I need to create an account" : "I already have an account";
});

// Auth Button Click
authBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    
    if (isLogin) {
        auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
    } else {
        auth.createUserWithEmailAndPassword(email, pass).catch(e => alert(e.message));
    }
});

// --- MONITOR LOGIN STATE ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // User Logged In -> Hide Auth, Show App
        authOverlay.style.display = "none";
        mainApp.style.display = "block";

        // Set Avatar (First letter of email)
        document.getElementById("user-avatar").innerText = user.email.charAt(0).toUpperCase();

        loadNotes(user.uid);
    } else {
        // User Logged Out -> Show Auth, Hide App
        authOverlay.style.display = "flex";
        mainApp.style.display = "none";
    }
});

// LOGOUT BUTTON (Real Button, No Popup)
document.getElementById("logout-btn").addEventListener("click", () => {
    auth.signOut();
    window.location.reload(); // Refresh page to clear data
});

// --- SAVE NOTE ---
document.getElementById("save-btn").addEventListener("click", () => {
    const text = document.getElementById("note-text").value;
    const user = auth.currentUser;

    if (!text.trim() || !user) return;

    db.collection("notes").add({
        text: text,
        uid: user.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById("note-text").value = "";
    });
});

// --- LOAD NOTES (Fixed: No Index Error) ---
function loadNotes(uid) {
    // We removed .orderBy("timestamp", "desc") so it works instantly!
    db.collection("notes")
      .where("uid", "==", uid)
      .onSnapshot((snapshot) => {
          const grid = document.getElementById("notes-grid");
          grid.innerHTML = ""; 

          snapshot.forEach(doc => {
              const data = doc.data();
              const noteId = doc.id;
              
              // Nice Date Format
              let dateStr = "Just now";
              if (data.timestamp) {
                  dateStr = data.timestamp.toDate().toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
              }

              // Create HTML
              const card = document.createElement("div");
              card.className = "note-card";
              card.innerHTML = `
                <div class="note-text">${data.text}</div>
                <div class="note-footer">
                    <span>${dateStr}</span>
                    <i class="ri-delete-bin-line delete-icon" onclick="deleteNote('${noteId}')"></i>
                </div>
              `;
              grid.appendChild(card);
          });
      });
}

// --- DELETE NOTE ---
window.deleteNote = function(id) {
    if(confirm("Delete this memory?")) {
        db.collection("notes").doc(id).delete();
    }
}
