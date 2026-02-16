// --- FIREBASE CONFIG ---
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

// --- THEME ---
const themeToggle = document.getElementById("theme-toggle");
themeToggle.onclick = () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
};
document.documentElement.setAttribute("data-theme", localStorage.getItem("theme") || "light");

// --- AUTH LOGIC ---
let isLoginMode = true;
const authBtn = document.getElementById("auth-btn");

function notify(msg, type) {
    const statusBox = document.getElementById("auth-status-container");
    statusBox.innerText = msg;
    statusBox.className = `status-box ${type === 'err' ? 'err' : 'ok'}`;
    statusBox.classList.remove("hidden");
}

document.getElementById("forgot-password-link").onclick = () => {
    const email = document.getElementById("email").value;
    if (!email) return notify("Type email above first.", "err");
    auth.sendPasswordResetEmail(email)
        .then(() => notify("Reset link sent to inbox!", "ok"))
        .catch(e => notify(e.message, "err"));
};

document.getElementById("toggle-auth").onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById("auth-title").innerText = isLoginMode ? "Welcome Back" : "Create Account";
    authBtn.innerText = isLoginMode ? "Log In" : "Sign Up";
    document.getElementById("user-name").classList.toggle("hidden", isLoginMode);
    document.getElementById("forgot-pass-wrap").classList.toggle("hidden", !isLoginMode);
};

authBtn.onclick = () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    const name = document.getElementById("user-name").value;
    if (isLoginMode) {
        auth.signInWithEmailAndPassword(email, pass).catch(e => notify(e.message, "err"));
    } else {
        auth.createUserWithEmailAndPassword(email, pass)
            .then(cred => cred.user.updateProfile({ displayName: name }))
            .then(() => window.location.reload())
            .catch(e => notify(e.message, "err"));
    }
};

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("auth-overlay").classList.add("hidden");
        document.getElementById("main-app").classList.remove("hidden");
        const initial = user.displayName ? user.displayName.charAt(0) : user.email.charAt(0);
        document.getElementById("avatar-btn").innerText = initial;
        document.getElementById("user-display-name").innerText = user.displayName || "User";
        document.getElementById("user-display-email").innerText = user.email;
        fetchMemories(user.uid);
    } else {
        document.getElementById("auth-overlay").classList.remove("hidden");
        document.getElementById("main-app").classList.add("hidden");
    }
});

// --- DATABASE & SEARCH ---
let allNotes = [];
document.getElementById("save-note-btn").onclick = () => {
    const text = document.getElementById("note-input").value;
    if (!text.trim()) return;
    db.collection("notes").add({
        text: text,
        uid: auth.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => { document.getElementById("note-input").value = ""; });
};

function fetchMemories(uid) {
    db.collection("notes").where("uid", "==", uid).onSnapshot(snap => {
        allNotes = [];
        snap.forEach(doc => allNotes.push({ id: doc.id, ...doc.data() }));
        renderNotes(allNotes);
    });
}

function renderNotes(notes) {
    const grid = document.getElementById("notes-grid");
    grid.innerHTML = "";
    notes.forEach(data => {
        const lines = data.text.split('\n');
        const card = document.createElement("div");
        card.className = "note-card";
        card.innerHTML = `
            <div class="note-heading">${lines[0]}</div>
            <div class="note-preview">${lines.slice(1).join('\n') || "..."}</div>
            <div class="note-card-footer">
                <span>${data.createdAt ? data.createdAt.toDate().toLocaleDateString() : "Just now"}</span>
                <i class="ri-delete-bin-line" onclick="event.stopPropagation(); deleteNote('${data.id}')"></i>
            </div>
        `;
        card.onclick = () => {
            document.getElementById("modal-body").innerText = data.text;
            document.getElementById("view-modal").classList.remove("hidden");
        };
        grid.appendChild(card);
    });
}

document.getElementById("search-input").oninput = (e) => {
    const term = e.target.value.toLowerCase();
    renderNotes(allNotes.filter(n => n.text.toLowerCase().includes(term)));
};

// --- MODAL & MENU ---
const viewModal = document.getElementById("view-modal");
document.querySelector(".modal-content").onclick = (e) => e.stopPropagation();
viewModal.onclick = (e) => { if (e.target === viewModal) viewModal.classList.add("hidden"); };
document.getElementById("close-view-modal").onclick = () => viewModal.classList.add("hidden");

document.getElementById("avatar-btn").onclick = (e) => { 
    e.stopPropagation(); 
    document.getElementById("avatar-menu").classList.toggle("hidden"); 
};
window.onclick = () => document.getElementById("avatar-menu").classList.add("hidden");
document.getElementById("logout-btn").onclick = () => auth.signOut();
function deleteNote(id) { if (confirm("Delete memory?")) db.collection("notes").doc(id).delete(); }
