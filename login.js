import { auth } from '../../firebase/firebase-init.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#loginForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = form.email.value;
    const password = form.password.value;

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('Logged in as:', userCredential.user.email);
        window.location.href = '../../driver/dashboard/dashboard.html';
      })
      .catch((error) => {
        console.error('Login error:', error.message);
        alert('Login failed: ' + error.message);
      });
  });
});
