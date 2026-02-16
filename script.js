// --- 1. FIREBASE INITIALIZATION ---
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

// --- 2. DOM ELEMENTS ---
const authOverlay = document.getElementById("auth-overlay");
const mainApp = document.getElementById("main-app");
const authBtn = document.getElementById("auth-btn");
const toggleAuth = document.getElementById("toggle-auth");
const errorBox = document.getElementById("auth-error-container");
const avatarBtn = document.getElementById("avatar-btn");
const avatarMenu = document.getElementById("avatar-menu");
const viewModal = document.getElementById("view-modal");

let isLoginMode = true;

// --- 3. AUTHENTICATION LOGIC ---

toggleAuth.onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById("auth-title").innerText = isLoginMode ? "Welcome Back" : "Join Us";
    authBtn.innerText = isLoginMode ? "Log In" : "Sign Up";
    toggleAuth.innerText = isLoginMode ? "New here? Create an account" : "Already have an account? Log in";
    errorBox.classList.add("hidden");
};

authBtn.onclick = () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    errorBox.classList.add("hidden");

    if (!email || pass.length < 6) {
        showError("Please enter a valid email and 6+ char password.");
        return;
    }

    const authAction = isLoginMode 
        ? auth.signInWithEmailAndPassword(email, pass) 
        : auth.createUserWithEmailAndPassword(email, pass);

    authAction.catch(err => showError(err.message));
};

function showError(msg) {
    errorBox.innerText = msg;
    errorBox.classList.remove("hidden");
}

auth.onAuthStateChanged(user => {
    if (user) {
        authOverlay.classList.add("hidden");
        mainApp.classList.remove("hidden");
        avatarBtn.innerText = user.email.charAt(0).toUpperCase();
        document.getElementById("user-display-email").innerText = user.email;
        fetchNotes(user.uid);
    } else {
        authOverlay.classList.remove("hidden");
        mainApp.classList.add("hidden");
    }
});

// Avatar Dropdown Toggle
avatarBtn.onclick = (e) => { e.stopPropagation(); avatarMenu.classList.toggle("hidden"); };
window.onclick = () => avatarMenu.classList.add("hidden");
document.getElementById("logout-btn").onclick = () => auth.signOut();

// --- 4. NOTE OPERATIONS ---

document.getElementById("save-note-btn").onclick = () => {
    const text = document.getElementById("note-input").value;
    if (!text.trim()) return;

    db.collection("notes").add({
        text: text,
        uid: auth.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById("note-input").value = "";
    });
};

function fetchNotes(uid) {
    // Basic query to avoid Index Missing errors
    db.collection("notes").where("uid", "==", uid).onSnapshot(snap => {
        const grid = document.getElementById("notes-grid");
        grid.innerHTML = "";
        
        snap.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : "Pending...";
            
            const card = document.createElement("div");
            card.className = "note-card";
            card.onclick = () => openModal(data.text, date);
            card.innerHTML = `
                <div class="note-preview">${data.text}</div>
                <div class="note-card-footer">
                    <span>${date}</span>
                    <i class="ri-delete-bin-line del-btn" onclick="event.stopPropagation(); deleteNote('${id}')"></i>
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// --- 5. MODAL & DELETE ---

function openModal(text, date) {
    document.getElementById("modal-body").innerText = text;
    document.getElementById("modal-date").innerText = date;
    viewModal.classList.remove("hidden");
}

document.getElementById("close-modal").onclick = () => viewModal.classList.add("hidden");
viewModal.onclick = (e) => { if (e.target === viewModal) viewModal.classList.add("hidden"); };

function deleteNote(id) {
    if (confirm("Permanently delete this memory?")) {
        db.collection("notes").doc(id).delete();
    }
}
