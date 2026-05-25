/**
 * ProDo Storage — Firebase Auth + Firestore dengan cache in-memory.
 * API sinkron (getTasks, dll.) membaca cache; operasi tulis mengembalikan Promise.
 */
const Storage = {
    CATEGORY_COLORS: [
        { color: 'bg-blue-100 text-blue-700', label: 'Biru', hex: '#3b82f6' },
        { color: 'bg-green-100 text-green-700', label: 'Hijau', hex: '#22c55e' },
        { color: 'bg-purple-100 text-purple-700', label: 'Ungu', hex: '#a855f7' },
        { color: 'bg-amber-100 text-amber-700', label: 'Kuning', hex: '#f59e0b' },
        { color: 'bg-rose-100 text-rose-700', label: 'Merah', hex: '#f43f5e' },
        { color: 'bg-teal-100 text-teal-700', label: 'Teal', hex: '#14b8a6' },
        { color: 'bg-slate-100 text-slate-700', label: 'Abu', hex: '#64748b' }
    ],

    _auth: null,
    _db: null,
    _uid: null,
    _ready: false,
    _unsubs: [],

    cache: {
        tasks: [],
        targets: [],
        categories: [],
        stats: { streak: 0, lastActiveDate: null },
        activities: [],
        tgSettings: { botToken: '', chatId: '' },
        notificationLog: {}
    },

    _configErrorMessage() {
        if (window.__FIREBASE_CONFIG_MISSING__ || typeof FIREBASE_CONFIG === 'undefined') {
            return 'File js/firebase-config.js tidak ada di server. Untuk GitHub Pages: commit & push file tersebut ke repo (lihat README → Deploy GitHub Pages).';
        }
        if (!FIREBASE_CONFIG.apiKey || String(FIREBASE_CONFIG.apiKey).includes('YOUR_')) {
            return 'Isi js/firebase-config.js dengan data dari Firebase Console (Project Settings → Your apps).';
        }
        return 'Firebase belum dikonfigurasi.';
    },

    _isConfigured() {
        if (window.__FIREBASE_CONFIG_MISSING__) return false;
        return typeof FIREBASE_CONFIG !== 'undefined'
            && FIREBASE_CONFIG.apiKey
            && !String(FIREBASE_CONFIG.apiKey).includes('YOUR_');
    },

    _userCol(name) {
        return this._db.collection('users').doc(this._uid).collection(name);
    },

    _dispatchChange() {
        window.dispatchEvent(new CustomEvent('prodo:data-changed'));
    },

    async init() {
        if (!this._isConfigured()) {
            console.warn('[ProDo]', this._configErrorMessage());
            return;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        this._auth = firebase.auth();
        this._db = firebase.firestore();

        return new Promise((resolve) => {
            this._auth.onAuthStateChanged(async (user) => {
                this._tearDownListeners();
                if (user) {
                    this._uid = user.uid;
                    try {
                        await this._loadAll();
                        this._subscribeRealtime();
                        this._ready = true;
                    } catch (err) {
                        console.error('[ProDo] Firestore:', this._firestoreErrorMessage(err));
                        this._ready = false;
                        window.dispatchEvent(new CustomEvent('prodo:firestore-error', {
                            detail: { message: this._firestoreErrorMessage(err) }
                        }));
                    }
                } else {
                    this._uid = null;
                    this._ready = false;
                    this._resetCache();
                }
                resolve();
            });
        });
    },

    _resetCache() {
        this.cache = {
            tasks: [],
            targets: [],
            categories: [],
            stats: { streak: 0, lastActiveDate: null },
            activities: [],
            tgSettings: { botToken: '', chatId: '' },
            notificationLog: {}
        };
    },

    _tearDownListeners() {
        this._unsubs.forEach((fn) => fn());
        this._unsubs = [];
    },

    _subscribeRealtime() {
        const cols = ['tasks', 'targets', 'categories', 'activities'];
        const onSnapError = (err) => {
            console.error('[ProDo] Firestore listener:', this._firestoreErrorMessage(err));
        };

        cols.forEach((col) => {
            const unsub = this._userCol(col).onSnapshot(
                (snap) => {
                    this.cache[col] = col === 'tasks'
                        ? snap.docs.map((d) => this.normalizeTask({ id: d.id, ...d.data() }))
                        : snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    this._dispatchChange();
                },
                onSnapError
            );
            this._unsubs.push(unsub);
        });

        const metaUnsub = this._db.collection('users').doc(this._uid)
            .collection('meta').doc('stats')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const d = doc.data();
                    this.cache.stats = {
                        streak: d.streak ?? 0,
                        lastActiveDate: d.lastActiveDate ?? null
                    };
                }
                this._dispatchChange();
            }, onSnapError);
        this._unsubs.push(metaUnsub);

        const settingsUnsub = this._db.collection('users').doc(this._uid)
            .collection('meta').doc('settings')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const d = doc.data();
                    this.cache.tgSettings = {
                        botToken: d.botToken || '',
                        chatId: d.chatId || ''
                    };
                }
                this._dispatchChange();
            }, onSnapError);
        this._unsubs.push(settingsUnsub);

        const notifUnsub = this._db.collection('users').doc(this._uid)
            .collection('meta').doc('notificationLog')
            .onSnapshot((doc) => {
                this.cache.notificationLog = doc.exists ? (doc.data().sent || {}) : {};
            }, onSnapError);
        this._unsubs.push(notifUnsub);
    },

    async _loadAll() {
        const [tasksSnap, targetsSnap, catsSnap, actsSnap, statsDoc, settingsDoc, notifDoc] = await Promise.all([
            this._userCol('tasks').get(),
            this._userCol('targets').get(),
            this._userCol('categories').get(),
            this._userCol('activities').get(),
            this._db.collection('users').doc(this._uid).collection('meta').doc('stats').get(),
            this._db.collection('users').doc(this._uid).collection('meta').doc('settings').get(),
            this._db.collection('users').doc(this._uid).collection('meta').doc('notificationLog').get()
        ]);

        this.cache.tasks = tasksSnap.docs.map((d) => this.normalizeTask({ id: d.id, ...d.data() }));
        this.cache.targets = targetsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.cache.categories = catsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.cache.activities = actsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (statsDoc.exists) {
            const d = statsDoc.data();
            this.cache.stats = { streak: d.streak ?? 0, lastActiveDate: d.lastActiveDate ?? null };
        } else {
            this.cache.stats = { streak: 0, lastActiveDate: null };
        }

        if (settingsDoc.exists) {
            const d = settingsDoc.data();
            this.cache.tgSettings = { botToken: d.botToken || '', chatId: d.chatId || '' };
        } else {
            this.cache.tgSettings = { botToken: '', chatId: '' };
        }

        this.cache.notificationLog = notifDoc.exists ? (notifDoc.data().sent || {}) : {};

        if (this.cache.categories.length === 0) {
            await this._seedDefaults();
        }
    },

    async _seedDefaults() {
        const defaults = [
            { name: 'Kerja', color: 'blue', icon: 'briefcase' },
            { name: 'Pribadi', color: 'green', icon: 'user' },
            { name: 'Belajar', color: 'purple', icon: 'book-open' }
        ];
        const batch = this._db.batch();
        defaults.forEach((cat) => {
            const ref = this._userCol('categories').doc();
            batch.set(ref, { ...cat, createdAt: new Date().toISOString() });
        });
        await batch.commit();
    },

    _metaRef(name) {
        return this._db.collection('users').doc(this._uid).collection('meta').doc(name);
    },

    isLoggedIn() {
        return this._ready && !!this._uid;
    },

    getCurrentUser() {
        if (!this._auth || !this._auth.currentUser) return null;
        const u = this._auth.currentUser;
        return { email: u.email, uid: u.uid };
    },

    async _waitForReady(timeoutMs = 15000) {
        const start = Date.now();
        while (!this._ready && Date.now() - start < timeoutMs) {
            await new Promise((r) => setTimeout(r, 50));
        }
        if (!this._ready) throw new Error('Gagal memuat data pengguna');
    },

    _firestoreErrorMessage(error) {
        const projectId = typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG.projectId : 'proyek-anda';
        const rulesUrl = `https://console.firebase.google.com/project/${projectId}/firestore/rules`;
        if (error?.code === 'permission-denied') {
            return `Akses Firestore ditolak. Buka ${rulesUrl} → salin isi file firestore.rules dari proyek ini → Publish. Pastikan Anda sudah login di aplikasi.`;
        }
        return error?.message || 'Gagal mengakses Firestore.';
    },

    _authErrorMessage(error) {
        const projectId = typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG.projectId : 'proyek-anda';
        const authUrl = `https://console.firebase.google.com/project/${projectId}/authentication`;
        const map = {
            'auth/configuration-not-found': `Firebase Authentication belum aktif. Buka ${authUrl} → klik "Get started" → Sign-in method → aktifkan Email/Password → Save.`,
            'auth/operation-not-allowed': 'Metode Email/Password belum diaktifkan di Firebase Console (Authentication → Sign-in method).',
            'auth/unauthorized-domain': 'Domain situs ini belum diizinkan. Tambahkan di Authentication → Settings → Authorized domains (mis. localhost).'
        };
        return map[error?.code] || error?.message || 'Gagal autentikasi.';
    },

    async registerUser(email, password) {
        if (!this._isConfigured()) throw new Error(this._configErrorMessage());
        try {
            await this._auth.createUserWithEmailAndPassword(email, password);
            await this._waitForReady();
            return true;
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') return false;
            throw new Error(this._authErrorMessage(e));
        }
    },

    async loginUser(email, password) {
        if (!this._isConfigured()) throw new Error(this._configErrorMessage());
        try {
            await this._auth.signInWithEmailAndPassword(email, password);
            await this._waitForReady();
            return true;
        } catch (e) {
            if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password'
                || e.code === 'auth/user-not-found' || e.code === 'auth/invalid-email') {
                return false;
            }
            throw new Error(this._authErrorMessage(e));
        }
    },

    async logoutUser() {
        await this._auth.signOut();
    },

    // ─── Tasks (read sync, write async) ──────────────────────────

    getTasks() {
        return this.cache.tasks.map((t) => this.normalizeTask(t));
    },

    normalizeTask(task) {
        const t = { ...task };
        if (!t.status) {
            if (t.completed) t.status = 'completed';
            else if (t.column === 'focus' || (t.progressPercent > 0 && t.progressNote)) t.status = 'in_progress';
            else t.status = 'todo';
        }
        t.progressNote = t.progressNote || '';
        t.progressPercent = typeof t.progressPercent === 'number' ? t.progressPercent : 0;
        t.historyLog = Array.isArray(t.historyLog) ? t.historyLog : [];
        t.dueTime = t.dueTime || null;
        return t;
    },

    getTaskStatus(task) {
        return this.normalizeTask(task).status;
    },

    async addTask(task) {
        const id = 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        const now = new Date().toISOString();
        const newTask = {
            id,
            title: task.title,
            categoryId: task.categoryId || null,
            priority: task.priority || 'medium',
            dueDate: task.dueDate || null,
            dueTime: task.dueTime || null,
            targetId: task.targetId || null,
            completed: false,
            status: 'todo',
            column: task.column || 'todo',
            progressNote: '',
            progressPercent: 0,
            historyLog: [{ at: now, type: 'created', note: 'Tugas dibuat', progressPercent: 0 }],
            createdAt: now,
            updatedAt: now
        };
        await this._userCol('tasks').doc(id).set(newTask);
        this.cache.tasks.push(newTask); // Manually update cache for immediate sync
        if (newTask.targetId) {
            await this.syncTargetProgress(newTask.targetId);
        }
        return newTask;
    },

    async saveTaskProgress(id, { action, note = '', progressPercent = 0 }) {
        const task = this.cache.tasks.find((t) => t.id === id);
        if (!task) throw new Error('Tugas tidak ditemukan');

        const now = new Date().toISOString();
        const pct = Math.min(100, Math.max(0, Number(progressPercent) || 0));
        const entry = { at: now, type: action, note: String(note || '').trim(), progressPercent: pct };
        const historyLog = [...(task.historyLog || []), entry];

        const updates = {
            historyLog,
            progressNote: entry.note,
            progressPercent: pct,
            updatedAt: now
        };

        if (action === 'completed') {
            Object.assign(updates, { completed: true, status: 'completed', column: 'done' });
        } else if (action === 'in_progress') {
            Object.assign(updates, { completed: false, status: 'in_progress', column: 'focus' });
        } else if (action === 'reopened') {
            Object.assign(updates, { completed: false, status: 'todo', column: 'todo', progressPercent: 0, progressNote: '' });
        } else if (action === 'progress') {
            const status = pct >= 100 ? 'completed' : 'in_progress';
            Object.assign(updates, {
                completed: pct >= 100,
                status,
                column: pct >= 100 ? 'done' : 'focus'
            });
        }

        await this.updateTask(id, updates);
        // syncTargetProgress is already handled inside updateTask
        return updates;
    },

    _parseIdAndUpdates(idOrDoc, maybeUpdates) {
        if (typeof idOrDoc === 'object' && idOrDoc !== null && idOrDoc.id) {
            const updates = { ...idOrDoc };
            const id = updates.id;
            delete updates.id;
            return { id, updates: maybeUpdates || updates };
        }
        return { id: idOrDoc, updates: maybeUpdates || {} };
    },

    async updateTask(idOrTask, maybeUpdates) {
        const { id, updates } = this._parseIdAndUpdates(idOrTask, maybeUpdates);
        
        // Find old target to sync if it's being changed
        const oldTask = this.cache.tasks.find((t) => t.id === id);
        const oldTargetId = oldTask ? oldTask.targetId : null;

        await this._userCol('tasks').doc(id).update(updates);
        
        const idx = this.cache.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) Object.assign(this.cache.tasks[idx], updates);
        
        const newTask = this.cache.tasks.find((t) => t.id === id);
        const newTargetId = newTask ? newTask.targetId : null;

        if (updates.completed !== undefined || updates.targetId !== undefined || updates.status !== undefined) {
            // Sync old target if targetId was changed to something else
            if (oldTargetId && oldTargetId !== newTargetId) {
                await this.syncTargetProgress(oldTargetId);
            }
            // Sync new target
            if (newTargetId) {
                await this.syncTargetProgress(newTargetId);
            }
        }
    },

    async deleteTask(id) {
        const task = this.cache.tasks.find((t) => t.id === id);
        const targetId = task ? task.targetId : null;
        
        await this._userCol('tasks').doc(id).delete();
        this.cache.tasks = this.cache.tasks.filter((t) => t.id !== id);
        
        if (targetId) {
            await this.syncTargetProgress(targetId);
        }
    },

    async toggleTask(id) {
        const task = this.cache.tasks.find((t) => t.id === id);
        if (!task) return;
        const completed = !task.completed;
        const column = completed ? 'done' : (task.column === 'done' ? 'todo' : task.column);
        await this.updateTask(id, { completed, column });
        // syncTargetProgress is already handled inside updateTask
        await this.updateStreak();
    },

    // ─── Targets ─────────────────────────────────────────────────

    getTargets() {
        return [...this.cache.targets];
    },

    async addTarget(target) {
        const id = target.id || ('tg_' + Date.now());
        const newTarget = {
            id,
            name: target.name || target.title || '',
            type: target.type || 'daily',
            progress: target.progress ?? 0,
            deadline: target.deadline || null,
            createdAt: target.createdAt || new Date().toISOString()
        };
        await this._userCol('targets').doc(id).set(newTarget);
        return newTarget;
    },

    async updateTarget(idOrTarget, maybeUpdates) {
        const { id, updates } = this._parseIdAndUpdates(idOrTarget, maybeUpdates);
        await this._userCol('targets').doc(id).update(updates);
        const idx = this.cache.targets.findIndex((t) => t.id === id);
        if (idx !== -1) Object.assign(this.cache.targets[idx], updates);
    },

    async deleteTarget(id) {
        await this._userCol('targets').doc(id).delete();
        this.cache.targets = this.cache.targets.filter((t) => t.id !== id);
        const linked = this.cache.tasks.filter((t) => t.targetId === id);
        for (const task of linked) {
            await this.updateTask(task.id, { targetId: null });
        }
    },

    async syncTargetProgress(targetId) {
        if (!targetId) return;
        const target = this.cache.targets.find((t) => t.id === targetId);
        if (!target) return;
        const linked = this.cache.tasks.filter((t) => t.targetId === targetId);
        const total = linked.length;
        const done = linked.filter((t) => t.completed).length;
        const progress = total === 0 ? 0 : Math.round((done / total) * 100);
        await this.updateTarget(targetId, { progress });
    },

    // ─── Categories ──────────────────────────────────────────────

    getCategories() {
        return [...this.cache.categories];
    },

    async addCategory(cat) {
        const id = cat.id || ('c_' + Date.now());
        const newCat = {
            id,
            name: cat.name,
            color: cat.color || 'blue',
            icon: cat.icon || 'folder',
            createdAt: new Date().toISOString()
        };
        await this._userCol('categories').doc(id).set(newCat);
        return newCat;
    },

    async updateCategory(idOrCat, maybeUpdates) {
        const { id, updates } = this._parseIdAndUpdates(idOrCat, maybeUpdates);
        await this._userCol('categories').doc(id).update(updates);
        const idx = this.cache.categories.findIndex((c) => c.id === id);
        if (idx !== -1) Object.assign(this.cache.categories[idx], updates);
    },

    async deleteCategory(id) {
        await this._userCol('categories').doc(id).delete();
        this.cache.categories = this.cache.categories.filter((c) => c.id !== id);
        const affected = this.cache.tasks.filter((t) => t.categoryId === id);
        for (const task of affected) {
            await this.updateTask(task.id, { categoryId: null });
        }
    },

    // ─── Activities ──────────────────────────────────────────────

    getActivities() {
        return [...this.cache.activities];
    },

    async addActivity(activity) {
        const id = activity.id || ('a_' + Date.now());
        const newAct = {
            id,
            name: activity.name || activity.title || '',
            start: activity.start || activity.date,
            end: activity.end || null,
            createdAt: activity.createdAt || new Date().toISOString()
        };
        await this._userCol('activities').doc(id).set(newAct);
        return newAct;
    },

    async updateActivity(idOrAct, maybeUpdates) {
        const { id, updates } = this._parseIdAndUpdates(idOrAct, maybeUpdates);
        await this._userCol('activities').doc(id).update(updates);
        const idx = this.cache.activities.findIndex((a) => a.id === id);
        if (idx !== -1) Object.assign(this.cache.activities[idx], updates);
    },

    async deleteActivity(id) {
        await this._userCol('activities').doc(id).delete();
        this.cache.activities = this.cache.activities.filter((a) => a.id !== id);
    },

    // ─── Stats & Telegram ────────────────────────────────────────

    getStats() {
        return { ...this.cache.stats };
    },

    async updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const stats = this.cache.stats;
        if (stats.lastActiveDate === today) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        const streak = stats.lastActiveDate === yStr ? (stats.streak || 0) + 1 : 1;
        const updated = { streak, lastActiveDate: today };
        await this._metaRef('stats').set(updated, { merge: true });
        this.cache.stats = updated;
    },

    getTelegramSettings() {
        return { ...this.cache.tgSettings };
    },

    getTgSettings() {
        return this.getTelegramSettings();
    },

    checkAndUpdateStreak() {
        return this.updateStreak();
    },

    async saveTelegramSettings(settings) {
        await this._metaRef('settings').set(settings, { merge: true });
        this.cache.tgSettings = { ...settings };
    },

    getNotificationLog() {
        return { ...(this.cache.notificationLog || {}) };
    },

    wasNotificationSentToday(key) {
        const today = dayjs().format('YYYY-MM-DD');
        return this.cache.notificationLog[key] === today;
    },

    async markNotificationSent(key) {
        const today = dayjs().format('YYYY-MM-DD');
        const sent = { ...this.getNotificationLog(), [key]: today };
        await this._metaRef('notificationLog').set({ sent }, { merge: true });
        this.cache.notificationLog = sent;
    },

    // ─── Export / Import / Clear ─────────────────────────────────

    async exportData() {
        return {
            version: 2,
            exportedAt: new Date().toISOString(),
            tasks: this.getTasks(),
            targets: this.getTargets(),
            categories: this.getCategories(),
            activities: this.getActivities(),
            stats: this.getStats(),
            tgSettings: this.getTelegramSettings()
        };
    },

    async importData(data) {
        if (!data || !data.tasks) throw new Error('Format data tidak valid');

        const batch = this._db.batch();
        const colNames = ['tasks', 'targets', 'categories', 'activities'];

        for (const col of colNames) {
            const snap = await this._userCol(col).get();
            snap.docs.forEach((d) => batch.delete(d.ref));
        }

        const sets = [
            { col: 'tasks', items: data.tasks || [] },
            { col: 'targets', items: data.targets || [] },
            { col: 'categories', items: data.categories || [] },
            { col: 'activities', items: data.activities || [] }
        ];

        sets.forEach(({ col, items }) => {
            items.forEach((item) => {
                const id = item.id || `${col.slice(0, 1)}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
                batch.set(this._userCol(col).doc(id), { ...item, id });
            });
        });

        if (data.stats) {
            batch.set(this._metaRef('stats'), data.stats, { merge: true });
        }
        if (data.tgSettings) {
            batch.set(this._metaRef('settings'), data.tgSettings, { merge: true });
        }

        await batch.commit();
        await this._loadAll();
    },

    async clearAll() {
        const batch = this._db.batch();
        for (const col of ['tasks', 'targets', 'categories', 'activities']) {
            const snap = await this._userCol(col).get();
            snap.docs.forEach((d) => batch.delete(d.ref));
        }
        batch.set(this._metaRef('stats'), { streak: 0, lastActiveDate: null });
        batch.set(this._metaRef('settings'), { botToken: '', chatId: '' });
        batch.set(this._metaRef('notificationLog'), { sent: {} });
        await batch.commit();
        this.cache.tgSettings = { botToken: '', chatId: '' };
        await this._loadAll();
        await this._seedDefaults();
    },

    /** Migrasi one-time dari localStorage lama (username-based) ke Firestore */
    async migrateFromLocalStorage() {
        const key = 'prodo_migrated_' + this._uid;
        if (localStorage.getItem(key)) return false;

        const oldUser = localStorage.getItem('prodo_current_user');
        if (!oldUser) return false;

        const tasks = JSON.parse(localStorage.getItem(`prodo_tasks_${oldUser}`) || '[]');
        const targets = JSON.parse(localStorage.getItem(`prodo_targets_${oldUser}`) || '[]');
        const categories = JSON.parse(localStorage.getItem(`prodo_categories_${oldUser}`) || '[]');
        const activities = JSON.parse(localStorage.getItem(`prodo_activities_${oldUser}`) || '[]');
        const stats = JSON.parse(localStorage.getItem(`prodo_stats_${oldUser}`) || '{"streak":0}');
        const tg = JSON.parse(localStorage.getItem(`prodo_tg_${oldUser}`) || '{}');

        if (tasks.length === 0 && categories.length === 0) return false;

        await this.importData({
            tasks, targets, categories, activities,
            stats, tgSettings: tg
        });
        localStorage.setItem(key, '1');
        return true;
    }
};
