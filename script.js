// --- 1. IMPORT FIREBASE (Using the version from your snippet) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
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
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// --- 2. YOUR EXACT CONFIGURATION ---
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

// --- 3. APP LOGIC ---

let isLoginMode = true; // Tracks if user is trying to Login or Signup

// Toggle between Login and Signup visual
document.getElementById("toggle-auth").addEventListener("click", () => {
    isLoginMode = !isLoginMode;
    const title = document.getElementById("auth-title");
    const subtitle = document.getElementById("auth-subtitle");
    const btn = document.getElementById("auth-action-btn");
    const toggle = document.getElementById("toggle-auth");

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
document.getElementById("auth-action-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        errorMsg.innerText = ""; // Clear errors
    } catch (error) {
        console.error(error);
        if(error.code === 'auth/email-already-in-use') {
            errorMsg.innerText = "That email is already taken!";
        } else if (error.code === 'auth/wrong-password') {
            errorMsg.innerText = "Incorrect password, try again.";
        } else {
            errorMsg.innerText = error.message;
        }
    }
});

// Monitor Login Status
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("auth-overlay").classList.add("hidden");
        document.getElementById("main-app").classList.remove("hidden");
        
        // Update Navbar Info
        document.getElementById("user-email-display").innerText = user.email;
        // Set Avatar to First Letter of Email
        document.getElementById("user-avatar").innerText = user.email.charAt(0).toUpperCase();
        
        loadNotes(user.uid);
    } else {
        document.getElementById("auth-overlay").classList.remove("hidden");
        document.getElementById("main-app").classList.add("hidden");
    }
});

document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));


// --- 4. NOTE FUNCTIONS ---

// Save Note
document.getElementById("save-btn").addEventListener("click", async () => {
    const text = document.getElementById("note-text").value;
    const user = auth.currentUser;

    if (text.trim() === "") return; // Don't save empty notes

    if (user) {
        try {
            await addDoc(collection(db, "notes"), {
                text: text,
                uid: user.uid,
                timestamp: serverTimestamp()
            });
            document.getElementById("note-text").value = ""; // Clear box
        } catch (e) {
            console.error("Error saving:", e);
            alert("Error saving note. Check console.");
        }
    }
});

// Load Notes
function loadNotes(userId) {
    const q = query(collection(db, "notes"), where("uid", "==", userId), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        const grid = document.getElementById("notes-grid");
        grid.innerHTML = ""; // Clear grid before re-rendering

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const noteId = docSnap.id;
            
            // Format Time
            let timeString = "Just now";
            if(data.timestamp) {
                timeString = data.timestamp.toDate().toLocaleDateString() + " " + data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            // Create Card HTML
            const card = document.createElement("div");
            card.className = "note-card";
            
            card.innerHTML = `
                <div class="note-content">${data.text}</div>
                <div class="note-footer">
                    <span>${timeString}</span>
                    <i class="ri-delete-bin-heart-line delete-icon" id="del-${noteId}"></i>
                </div>
            `;

            grid.appendChild(card);

            // ATTACH DELETE EVENT LISTENER HERE
            // This waits for the button to be created, then attaches the click action
            setTimeout(() => {
                const delBtn = document.getElementById(`del-${noteId}`);
                if (delBtn) {
                    delBtn.onclick = async () => {
                        if(confirm("Delete this memory?")) {
                            await deleteDoc(doc(db, "notes", noteId));
                        }
                    };
                }
            }, 100);
        });
    });
}
