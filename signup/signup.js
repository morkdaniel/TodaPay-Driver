import { auth, db } from 'firebase-init.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#signup-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;
        const mobile = form.mobile.value;
        const toda = form.toda.value;
        const todaNo = form['toda-no'].value;
        const bodyNo = form['body-no'].value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "drivers", user.uid), {
                name,
                email,
                mobile,
                toda,
                todaNo,
                bodyNo,
                photoURL: "",
                createdAt: new Date()
            });

            window.location.href = `dashboard.html`;
        } catch (error) {
            console.error('Error signing up:', error.code, error.message);
            alert(`Sign-up failed: ${error.message}`);
        }
    });
});
