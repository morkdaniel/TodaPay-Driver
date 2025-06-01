import { auth, db, storage } from '../../firebase/firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  getDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  const scanBtn = document.getElementById('scan-btn');
  const kioskInput = document.getElementById('kiosk-id-input');
  const logsContainer = document.getElementById('travel-logs');

  const profileTrigger = document.getElementById('profile-trigger');
  const modal = document.getElementById('profile-modal');
  const uploadInput = document.getElementById('upload-input');
  const viewFullBtn = document.getElementById('view-fullsize-btn');
  const modalPreview = document.getElementById('modal-profile-preview');
  const driverName = document.querySelector('.driver-name');
  const cameraScanBtn = document.getElementById('camera-scan-btn');
  const scannerModal = document.getElementById('scanner-modal');
  console.log('Scanner modal hidden on load:', scannerModal.classList.contains('hidden'));
  const closeScanner = document.getElementById('close-scanner');
  console.log('Camera scan button exists:', !!cameraScanBtn);
  
  let html5QrCode;

  let currentUser = null;
  let photoURL = '/images/no-profile.png';

  // 🔐 Auth check
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = '/driver/login/login.html';
    } else {
      currentUser = user;
      try {
        const userDoc = await getDoc(doc(db, 'drivers', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          photoURL = data.photoURL || '/images/no-profile.png';
          document.querySelector('.driver-photo').src = photoURL;
          modalPreview.src = photoURL;
          driverName.textContent = data.name || 'Driver';
        }

        const logsRef = collection(db, 'travelLogs');
        const q = query(logsRef, where('driverId', '==', user.uid), orderBy('timestamp', 'desc'));

        onSnapshot(q, (snapshot) => {
          logsContainer.innerHTML = '';

          if (snapshot.empty) {
            logsContainer.innerHTML = '<p class="empty-message">No rides yet.</p>';
            return;
          }

          snapshot.forEach((doc, index) => {
            const log = doc.data();
            const div = document.createElement('div');
            div.classList.add('log-entry');
            div.innerHTML = `
              <span>${snapshot.size - index}</span>
              <span>${log.destination}</span>
              <span>${log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>₱${parseFloat(log.fare).toFixed(2)}</span>
            `;
            logsContainer.appendChild(div);
          });
        });
      } catch (err) {
        console.error('Error loading dashboard:', err.message);
        alert('Could not load dashboard data.');
      }
    }
  });

  // 🚪 Logout
  logoutBtn.addEventListener('click', () => {
    signOut(auth)
      .then(() => window.location.href = '/driver/login/login.html')
      .catch((error) => {
        console.error('Sign out error:', error.message);
        alert('Error signing out.');
      });
  });

  // 📸 Upload new profile picture
  uploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `profilePhotos/${currentUser.uid}`);
      await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'drivers', currentUser.uid), {
        photoURL: downloadURL
      });

      document.querySelector('.driver-photo').src = downloadURL;
      modalPreview.src = downloadURL;
      alert('Profile picture updated!');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload photo.');
    }
  });

  // 📲 Scan handler
  async function handleScannedKioskId(kioskId) {
    scanBtn.disabled = true;
    cameraScanBtn.disabled = true;

    try {
      const q = query(collection(db, "kiosks"), where("kioskId", "==", kioskId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('Kiosk ID not found.');
        return;
      }

      const docRef = querySnapshot.docs[0];
      const data = docRef.data();

      if (data.used) {
        alert('This QR code has already been used.');
        return;
      }

      const createdAt = data.createdAt?.toDate?.();
      if (!createdAt) {
        alert('Invalid timestamp.');
        return;
      }

      const now = new Date();
      const ageMs = now - createdAt;
      const maxAge = 5 * 60 * 1000;

      if (ageMs > maxAge) {
        await updateDoc(docRef.ref, { expired: true });
        alert('This QR code has expired.');
        return;
      }

      await updateDoc(docRef.ref, {
        used: true,
        usedAt: new Date()
      });

      await addDoc(collection(db, 'travelLogs'), {
        driverId: auth.currentUser.uid,
        destination: data.destination,
        passengerCount: data.passengerCount,
        fare: data.fare,
        timestamp: serverTimestamp()
      });

      alert(`Ride to ${data.destination} for ${data.passengerCount} pax (₱${data.fare}) accepted.`);
      kioskInput.value = '';
    } catch (err) {
      console.error('Scan error:', err);
      alert('Something went wrong while scanning the kiosk.');
    } finally {
      scanBtn.disabled = false;
      cameraScanBtn.disabled = false;
    }
  }

  // 🔍 Manual scan
  scanBtn.addEventListener('click', () => {
    const id = kioskInput.value.trim();
    if (id) {
      handleScannedKioskId(id);
    } else {
      alert('Please enter or scan a Kiosk ID.');
    }
  });

  // 📷 Camera scan (✅ fixed)
  cameraScanBtn.addEventListener('click', async () => {
    scannerModal.classList.remove('hidden');

    try {
      html5QrCode = new window.Html5Qrcode("qr-reader");

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          console.log("Scanned:", decodedText);
          await handleScannedKioskId(decodedText);

          try {
            await html5QrCode.stop();
          } catch (err) {
            console.warn("Could not stop scanner after scan", err);
          }

          scannerModal.classList.add('hidden');
          html5QrCode.clear();
          html5QrCode = null;
        },
        (errorMessage) => {
          // Ignore scan errors
        }
      );
    } catch (err) {
      console.error("Failed to start scanner", err);
      alert("Could not access camera.");
      scannerModal.classList.add('hidden');
    }
  });

  // ❌ Close scanner
  closeScanner.addEventListener('click', () => {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        scannerModal.classList.add('hidden');
        html5QrCode.clear();
        html5QrCode = null;
      }).catch((err) => {
        console.warn("Failed to stop scanner:", err);
        scannerModal.classList.add('hidden');
      });
    } else {
      scannerModal.classList.add('hidden');
    }
  });

  // 👁️ View full-size image
  viewFullBtn.addEventListener('click', () => {
    window.open(modalPreview.src, '_blank');
  });

  // 🧾 Toggle profile modal
  profileTrigger.addEventListener('click', () => {
    modal.classList.toggle('hidden');
  });
});
