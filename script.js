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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let isLogin = true;

// --- DOM ELEMENTS ---
const authOverlay = document.getElementById("auth-overlay");
const mainApp = document.getElementById("main-app");
const authBtn = document.getElementById("auth-btn");
const toggleBtn = document.getElementById("toggle-auth");
const title = document.getElementById("auth-title");
const errorBox = document.getElementById("auth-error");

// Toggle Login/Signup Mode
toggleBtn.addEventListener("click", () => {
    isLogin = !isLogin;
    title.innerText = isLogin ? "Welcome Back" : "Join Us";
    authBtn.innerText = isLogin ? "Log In" : "Sign Up";
    toggleBtn.innerText = isLogin ? "I need to create an account" : "I already have an account";
    errorBox.style.display = "none"; // Hide error when switching
});

// --- HELPER: SHOW ERROR ---
function showError(msg) {
    // Translate common Firebase errors to human language
    if(msg.includes("auth/invalid-email")) msg = "Please enter a valid email address.";
    if(msg.includes("auth/wrong-password")) msg = "Incorrect password.";
    if(msg.includes("auth/user-not-found")) msg = "No account found with this email.";
    if(msg.includes("auth/email-already-in-use")) msg = "That email is already registered.";
    
    errorBox.innerText = msg;
    errorBox.style.display = "block"; // Show the red box
}

// --- AUTH ACTION ---
authBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    
    errorBox.style.display = "none"; // Reset error

    if (isLogin) {
        auth.signInWithEmailAndPassword(email, pass).catch(e => showError(e.code || e.message));
    } else {
        auth.createUserWithEmailAndPassword(email, pass).catch(e => showError(e.code || e.message));
    }
});

// --- AVATAR DROPDOWN LOGIC ---
const avatar = document.getElementById("user-avatar");
const dropdown = document.getElementById("profile-dropdown");

// Toggle menu when clicking avatar
avatar.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent click from bubbling to document
    dropdown.classList.toggle("hidden");
});

// Close menu if clicking anywhere else
document.addEventListener("click", () => {
    if (!dropdown.classList.contains("hidden")) {
        dropdown.classList.add("hidden");
    }
});

// Stop menu closing when clicking inside it
dropdown.addEventListener("click", (e) => e.stopPropagation());


// --- LOGIN STATE MONITOR ---
auth.onAuthStateChanged((user) => {
    if (user) {
        authOverlay.style.display = "none";
        mainApp.style.display = "block";

        // Update Avatar & Email Display
        document.getElementById("user-avatar").innerText = user.email.charAt(0).toUpperCase();
        document.getElementById("user-email-display").innerText = user.email;

        loadNotes(user.uid);
    } else {
        authOverlay.style.display = "flex";
        mainApp.style.display = "none";
    }
});

// LOGOUT
document.getElementById("logout-btn").addEventListener("click", () => {
    auth.signOut();
    window.location.reload();
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

// --- LOAD NOTES ---
function loadNotes(uid) {
    db.collection("notes")
      .where("uid", "==", uid)
      .onSnapshot((snapshot) => {
          const grid = document.getElementById("notes-grid");
          grid.innerHTML = ""; 

          snapshot.forEach(doc => {
              const data = doc.data();
              const noteId = doc.id;
              
              let dateStr = "Just now";
              if (data.timestamp) {
                  dateStr = data.timestamp.toDate().toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
              }

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

// DELETE NOTE
window.deleteNote = function(id) {
    if(confirm("Delete this memory?")) {
        db.collection("notes").doc(id).delete();
    }
}
