import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js"; // ✅ ADD THIS

const firebaseConfig = {
  apiKey: "AIzaSyD7sffVukCwSCGSbEswgPe_GnOzO4czEsU",
  authDomain: "todapay-1f14a.firebaseapp.com",
  projectId: "todapay-1f14a",
  storageBucket: "todapay-1f14a.appspot.com",
  messagingSenderId: "81039696135",
  appId: "1:81039696135:web:e1e162e7deaecc3470e5a2",
  measurementId: "G-4P7659VV7E"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // ✅ ADD THIS

export { app, analytics, db, auth, storage }; // ✅ EXPORT STORAGE
