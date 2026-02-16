// --- 1. CONFIGURATION ---
// I inserted your key here automatically.
const firebaseConfig = {
    apiKey: "AIzaSyAwt0DhSHWkQUHMFrcanpDg9270v8IcpV8",
    authDomain: "save-note-146ec.firebaseapp.com",
    projectId: "save-note-146ec",
    storageBucket: "save-note-146ec.firebasestorage.app",
    messagingSenderId: "1015048681656",
    appId: "1:1015048681656:web:ebff97743021c3dd65dc4d",
    measurementId: "G-VEMRQ2Y53E"
};

// Initialize Firebase (The Universal Way)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- 2. APP LOGIC ---

let isLoginMode = true; // True = Login, False = Signup

// Toggle between Login and Signup visual
document.getElementById("toggle-auth").addEventListener("click", () => {
    isLoginMode = !isLoginMode;
    const title = document.getElementById("auth-title");
    const subtitle = document.getElementById("auth-subtitle");
    const btn = document.getElementById("auth-action-btn");
    const toggle = document.getElementById("toggle-auth");
    const errorMsg = document.getElementById("error-msg");

    errorMsg.innerText = ""; // Clear errors when switching

    if (isLoginMode) {
        title.innerText = "Welcome Back";
        subtitle.innerText = "Login to access your secret diary.";
        btn.innerText = "Log In";
        toggle.innerText = "Create an account";
    } else {
        title.innerText = "Join Us";
        subtitle.innerText = "Start your romantic journaling journey.";
        btn.innerText = "Sign Up";
        toggle.innerText = "I already have an account";
    }
});

// Handle the Login/Signup Button Click
document.getElementById("auth-action-btn").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    if (isLoginMode) {
        // Log In
        auth.signInWithEmailAndPassword(email, password)
            .catch((error) => {
                errorMsg.innerText = "Login Failed: " + error.message;
            });
    } else {
        // Sign Up
        auth.createUserWithEmailAndPassword(email, password)
            .catch((error) => {
                errorMsg.innerText = "Signup Failed: " + error.message;
            });
    }
});

// Monitor Login Status
auth.onAuthStateChanged((user) => {
    if (user) {
        // User IS logged in
        document.getElementById("auth-overlay").style.display = "none";
        document.getElementById("main-app").style.display = "block";
        
        // Update Navbar Info
        document.getElementById("user-email-display").innerText = user.email;
        document.getElementById("user-avatar").innerText = user.email.charAt(0).toUpperCase();
        
        loadNotes(user.uid);
    } else {
        // User is NOT logged in
        document.getElementById("auth-overlay").style.display = "flex";
        document.getElementById("main-app").style.display = "none";
    }
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    auth.signOut();
});


// --- 3. NOTE FUNCTIONS ---

// Save Note
document.getElementById("save-btn").addEventListener("click", () => {
    const text = document.getElementById("note-text").value;
    const user = auth.currentUser;

    if (text.trim() === "") return; 

    if (user) {
        db.collection("notes").add({
            text: text,
            uid: user.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            document.getElementById("note-text").value = ""; 
        }).catch((error) => {
            console.error("Error saving:", error);
            alert("Error saving note: " + error.message);
        });
    }
});

// Load Notes
function loadNotes(userId) {
    db.collection("notes")
      .where("uid", "==", userId)
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
          const grid = document.getElementById("notes-grid");
          grid.innerHTML = ""; 

          snapshot.forEach((doc) => {
              const data = doc.data();
              const noteId = doc.id;
              
              // Format Time
              let timeString = "Just now";
              if(data.timestamp) {
                  timeString = data.timestamp.toDate().toLocaleDateString();
              }

              // Create Card
              const card = document.createElement("div");
              card.className = "note-card";
              
              card.innerHTML = `
                  <div class="note-content">${data.text}</div>
                  <div class="note-footer">
                      <span>${timeString}</span>
                      <i class="ri-delete-bin-heart-line delete-icon" onclick="deleteNote('${noteId}')"></i>
                  </div>
              `;

              grid.appendChild(card);
          });
      });
}

// Global Delete Function (Required for onclick in HTML)
window.deleteNote = function(noteId) {
    if(confirm("Delete this memory?")) {
        db.collection("notes").doc(noteId).delete();
    }
};
