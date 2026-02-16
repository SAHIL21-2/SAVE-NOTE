// --- 1. IMPORTS (The Modern Way) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- 2. CONFIGURATION (Your Specific Data) ---
const firebaseConfig = {
    apiKey: "AIzaSyAwt0DhSHWkQUHMFrcanpDg9270v8IcpV8",
    authDomain: "save-note-146ec.firebaseapp.com",
    projectId: "save-note-146ec",
    storageBucket: "save-note-146ec.firebasestorage.app",
    messagingSenderId: "1015048681656",
    appId: "1:1015048681656:web:ebff97743021c3dd65dc4d",
    measurementId: "G-VEMRQ2Y53E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 3. AUTHENTICATION LOGIC ---

// Listen for login state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Logged In
        document.getElementById("login-overlay").style.display = "none";
        document.getElementById("main-app").style.display = "block";
        document.getElementById("user-email").innerText = user.email;
        loadNotes(user.uid);
    } else {
        // Logged Out
        document.getElementById("login-overlay").style.display = "flex";
        document.getElementById("main-app").style.display = "none";
    }
});

// Sign Up Event
document.getElementById("signup-btn").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    
    createUserWithEmailAndPassword(auth, email, pass)
        .catch((error) => {
            document.getElementById("auth-msg").innerText = error.message;
        });
});

// Log In Event
document.getElementById("login-btn").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, pass)
        .catch((error) => {
            document.getElementById("auth-msg").innerText = "Error: " + error.message;
        });
});

// Log Out Event
document.getElementById("logout-btn").addEventListener("click", () => {
    signOut(auth);
});

// --- 4. DATABASE LOGIC (Cloud Firestore) ---

// Add a Note
document.getElementById("add-btn").addEventListener("click", async () => {
    const text = document.getElementById("note-text").value;
    const user = auth.currentUser;

    if (text.trim() === "") return;

    if (user) {
        try {
            await addDoc(collection(db, "notes"), {
                text: text,
                uid: user.uid, // This makes it private to this user
                timestamp: serverTimestamp()
            });
            document.getElementById("note-text").value = ""; // Clear input
        } catch (e) {
            console.error("Error adding note: ", e);
            alert("Could not save note. Check console.");
        }
    }
});

// Load Notes (Real-time Listener)
function loadNotes(userId) {
    const notesRef = collection(db, "notes");
    // Create a query against the collection
    const q = query(notesRef, where("uid", "==", userId), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        const container = document.getElementById("notes-container");
        container.innerHTML = ""; // Clear list to avoid duplicates

        snapshot.forEach((docSnap) => {
            const note = docSnap.data();
            const noteId = docSnap.id;
            
            // Create HTML Element
            const card = document.createElement("div");
            card.className = "note-card";
            
            // Delete Button Logic (We attach the function directly to the element)
            const deleteBtn = document.createElement("i");
            deleteBtn.className = "ri-delete-bin-line delete-icon";
            deleteBtn.onclick = () => deleteNote(noteId);

            const p = document.createElement("p");
            p.innerText = note.text;

            card.appendChild(p);
            card.appendChild(deleteBtn);
            container.appendChild(card);
        });
    });
}

// Delete Note Function
async function deleteNote(noteId) {
    await deleteDoc(doc(db, "notes", noteId));
}
