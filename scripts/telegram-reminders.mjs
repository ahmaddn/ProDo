/**
 * Pengingat Telegram 24/7 — dijalankan oleh GitHub Actions (cron).
 * Logika sama dengan js/notifications.js (H-3, H-1, H, terlewat).
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = process.env.REMINDER_TIMEZONE || 'Asia/Jakarta';

function initFirebase() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
        console.error('FIREBASE_SERVICE_ACCOUNT tidak diset.');
        process.exit(1);
    }
    const serviceAccount = JSON.parse(raw);
    if (!getApps().length) {
        initializeApp({ credential: cert(serviceAccount) });
    }
    return getFirestore();
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatDate(dateStr) {
    return dayjs(dateStr).tz(TZ).format('D MMM YYYY');
}

function daysUntil(dateStr, today) {
    return dayjs(dateStr).tz(TZ).startOf('day').diff(today, 'day');
}

async function sendTelegram(botToken, chatId, message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });
    const data = await res.json();
    return res.ok;
}

async function getAllUserIds(db) {
    const ids = new Set();
    for (const col of ['tasks', 'activities', 'targets', 'categories']) {
        const snap = await db.collectionGroup(col).get();
        snap.forEach((doc) => {
            const uid = doc.ref.parent.parent?.id;
            if (uid) ids.add(uid);
        });
    }
    return [...ids];
}

async function processUser(db, uid) {
    const userRef = db.collection('users').doc(uid);
    const settingsDoc = await userRef.collection('meta').doc('settings').get();
    if (!settingsDoc.exists) return { uid, skipped: 'no settings' };

    const { botToken, chatId } = settingsDoc.data();
    if (!botToken || !chatId) return { uid, skipped: 'no telegram' };

    const logRef = userRef.collection('meta').doc('notificationLog');
    const logDoc = await logRef.get();
    const sent = logDoc.exists ? { ...(logDoc.data().sent || {}) } : {};

    const todayKey = dayjs().tz(TZ).format('YYYY-MM-DD');
    const today = dayjs().tz(TZ).startOf('day');

    const tasksSnap = await userRef.collection('tasks').get();
    const actsSnap = await userRef.collection('activities').get();

    let sentCount = 0;

    async function trySend(key, message) {
        if (sent[key] === todayKey) return;
        const ok = await sendTelegram(botToken, chatId, message);
        if (ok) {
            sent[key] = todayKey;
            sentCount++;
            console.log(`  sent ${key}`);
        } else {
            console.warn(`  failed ${key}`);
        }
    }

    for (const doc of tasksSnap.docs) {
        const task = { id: doc.id, ...doc.data() };
        if (task.completed || !task.dueDate) continue;

        const days = daysUntil(task.dueDate, today);
        const title = escapeHtml(task.title);
        const due = formatDate(task.dueDate);

        if (days < 0) {
            await trySend(
                `task:${task.id}:overdue`,
                `<b>Tugas terlewat</b>\n\n"${title}"\nJatuh tempo: ${due}\n\nSegera selesaikan di ProDo.`
            );
        } else if (days === 3) {
            await trySend(
                `task:${task.id}:h-3`,
                `<b>Pengingat tugas (H-3)</b>\n\n"${title}"\nJatuh tempo 3 hari lagi (${due}).`
            );
        } else if (days === 1) {
            await trySend(
                `task:${task.id}:h-1`,
                `<b>Pengingat tugas (H-1)</b>\n\n"${title}"\nJatuh tempo besok (${due}).`
            );
        } else if (days === 0) {
            await trySend(
                `task:${task.id}:h0`,
                `<b>Pengingat tugas (Hari H)</b>\n\n"${title}"\nJatuh tempo hari ini.`
            );
        }
    }

    for (const doc of actsSnap.docs) {
        const act = { id: doc.id, ...doc.data() };
        if (!act.start) continue;

        const days = daysUntil(act.start, today);
        const title = escapeHtml(act.name);
        const start = formatDate(act.start);
        const range = act.end && act.end !== act.start
            ? `${start} – ${formatDate(act.end)}`
            : start;

        if (days === 3) {
            await trySend(
                `activity:${act.id}:h-3`,
                `<b>Pengingat kegiatan (H-3)</b>\n\n"${title}"\nMulai 3 hari lagi (${range}).`
            );
        } else if (days === 1) {
            await trySend(
                `activity:${act.id}:h-1`,
                `<b>Pengingat kegiatan (H-1)</b>\n\n"${title}"\nMulai besok (${range}).`
            );
        } else if (days === 0) {
            await trySend(
                `activity:${act.id}:h0`,
                `<b>Pengingat kegiatan (Hari H)</b>\n\n"${title}"\nKegiatan dimulai hari ini (${range}).`
            );
        }
    }

    if (sentCount > 0) {
        await logRef.set({ sent }, { merge: true });
    }

    return { uid, sentCount };
}

async function main() {
    const db = initFirebase();
    const uids = await getAllUserIds(db);
    console.log(`Users found: ${uids.length} (${TZ})`);

    for (const uid of uids) {
        console.log(`Processing ${uid}...`);
        try {
            const result = await processUser(db, uid);
            console.log(`  →`, result);
        } catch (err) {
            console.error(`  error:`, err.message);
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
