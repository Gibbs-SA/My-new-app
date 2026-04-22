import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCYyjNs2dymfN_z-SG_gA9CLbhj-962fZo",
  authDomain: "myafricaproject-38aa9.firebaseapp.com",
  projectId: "myafricaproject-38aa9",
  storageBucket: "myafricaproject-38aa9.firebasestorage.app",
  messagingSenderId: "317377609689",
  appId: "1:317377609689:web:83b135127de196b85fe3c8"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };
