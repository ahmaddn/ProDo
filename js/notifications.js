// js/notifications.js — Pengingat Telegram (H-3, H-1, H, terlewat)

const AppNotifications = {
    _checkTimer: null,
    _debounceTimer: null,
    _running: false,
  /** Interval cek saat aplikasi terbuka (15 menit) */
    CHECK_INTERVAL_MS: 15 * 60 * 1000,

    async init() {
        this.startScheduler();
    },

    startScheduler() {
        if (this._checkTimer) clearInterval(this._checkTimer);
        this._checkTimer = setInterval(() => this.runScheduledChecks(), this.CHECK_INTERVAL_MS);

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.scheduleChecks();
        });

        window.addEventListener('prodo:data-changed', () => this.scheduleChecks());
    },

    scheduleChecks() {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this.runScheduledChecks(), 2500);
    },

    async runScheduledChecks() {
        if (this._running || !Storage.isLoggedIn()) return;

        const settings = Storage.getTgSettings();
        if (!settings.botToken || !settings.chatId) return;

        this._running = true;
        try {
            const tasks = Storage.getTasks();
            const activities = Storage.getActivities();
            await this._checkTaskReminders(tasks);
            await this._checkActivityReminders(activities);
        } finally {
            this._running = false;
        }
    },

    _daysUntil(dateStr, today) {
        return dayjs(dateStr).startOf('day').diff(today, 'day');
    },

    _escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    _formatDate(dateStr) {
        return dayjs(dateStr).format('D MMM YYYY');
    },

    async _trySend(key, message) {
        if (Storage.wasNotificationSentToday(key)) return false;
        const result = await this.notify(message);
        if (result.success) {
            await Storage.markNotificationSent(key);
            return true;
        }
        return false;
    },

    async _checkTaskReminders(tasks) {
        const today = dayjs().startOf('day');

        for (const task of tasks) {
            if (task.completed || !task.dueDate) continue;

            const days = this._daysUntil(task.dueDate, today);
            const title = this._escapeHtml(task.title);
            const due = this._formatDate(task.dueDate);

            if (days < 0) {
                await this._trySend(
                    `task:${task.id}:overdue`,
                    `<b>Tugas terlewat</b>\n\n"${title}"\nJatuh tempo: ${due}\n\nSegera selesaikan di ProDo.`
                );
            } else if (days === 3) {
                await this._trySend(
                    `task:${task.id}:h-3`,
                    `<b>Pengingat tugas (H-3)</b>\n\n"${title}"\nJatuh tempo 3 hari lagi (${due}).`
                );
            } else if (days === 1) {
                await this._trySend(
                    `task:${task.id}:h-1`,
                    `<b>Pengingat tugas (H-1)</b>\n\n"${title}"\nJatuh tempo besok (${due}).`
                );
            } else if (days === 0) {
                await this._trySend(
                    `task:${task.id}:h0`,
                    `<b>Pengingat tugas (Hari H)</b>\n\n"${title}"\nJatuh tempo hari ini.`
                );
            }
        }
    },

    async _checkActivityReminders(activities) {
        const today = dayjs().startOf('day');

        for (const act of activities) {
            if (!act.start) continue;

            const days = this._daysUntil(act.start, today);
            const title = this._escapeHtml(act.name);
            const start = this._formatDate(act.start);
            const range = act.end && act.end !== act.start
                ? `${start} – ${this._formatDate(act.end)}`
                : start;

            if (days === 3) {
                await this._trySend(
                    `activity:${act.id}:h-3`,
                    `<b>Pengingat kegiatan (H-3)</b>\n\n"${title}"\nMulai 3 hari lagi (${range}).`
                );
            } else if (days === 1) {
                await this._trySend(
                    `activity:${act.id}:h-1`,
                    `<b>Pengingat kegiatan (H-1)</b>\n\n"${title}"\nMulai besok (${range}).`
                );
            } else if (days === 0) {
                await this._trySend(
                    `activity:${act.id}:h0`,
                    `<b>Pengingat kegiatan (Hari H)</b>\n\n"${title}"\nKegiatan dimulai hari ini (${range}).`
                );
            }
        }
    },

    async notify(message) {
        const settings = Storage.getTgSettings();
        if (!settings.botToken || !settings.chatId) {
            return { success: false, message: 'Token atau Chat ID kosong' };
        }

        try {
            const url = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: settings.chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            const data = await response.json();
            return { success: response.ok, message: data.description };
        } catch (error) {
            console.error('[ProDo] Gagal mengirim notifikasi Telegram:', error);
            return { success: false, message: error.message || 'Network Error' };
        }
    }
};
