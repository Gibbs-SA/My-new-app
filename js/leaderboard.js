import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export async function saveScore(user, score, level) {
  if (!user || score <= 0) return false;
  try {
    const q = query(
      collection(db, 'scores'),
      where('uid', '==', user.uid),
      orderBy('score', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    const personalBest = snap.empty ? 0 : snap.docs[0].data().score;
    if (score <= personalBest) return false;

    await addDoc(collection(db, 'scores'), {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || '',
      score,
      level,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('saveScore error:', err);
    return false;
  }
}

export async function loadLeaderboard(limitCount = 10) {
  try {
    const q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('loadLeaderboard error:', err);
    return [];
  }
}

export function renderLeaderboard(entries, currentUid) {
  const list = document.getElementById('leaderboard-list');
  list.innerHTML = '';
  if (entries.length === 0) {
    list.innerHTML = '<li style="color:#888;font-size:8px;text-align:center;padding:20px">기록이 없습니다</li>';
    return;
  }
  entries.forEach((entry, i) => {
    const li = document.createElement('li');
    const isMe = entry.uid === currentUid;
    li.innerHTML = `
      <span class="rank">#${i + 1}</span>
      <span class="name ${isMe ? 'me' : ''}">${escapeHtml(entry.displayName)}</span>
      <span class="score">${entry.score.toLocaleString()}</span>
    `;
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
