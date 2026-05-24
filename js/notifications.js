// js/notifications.js

const AppNotifications = {
    async init() {
        // No permission request needed for Telegram, just settings setup
    },

    async notify(message) {
        const settings = Storage.getTgSettings();
        if (!settings.botToken || !settings.chatId) return { success: false, message: 'Token atau Chat ID kosong' };

        try {
            const url = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: settings.chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            const data = await response.json();
            return { success: response.ok, message: data.description };
        } catch (error) {
            console.error('Gagal mengirim notifikasi Telegram:', error);
            return { success: false, message: error.message || 'Network Error' };
        }
    },

    checkOverdueTasks(tasks) {
        const now = dayjs();
        const overdue = tasks.filter(t => !t.completed && t.dueDate && dayjs(t.dueDate).isBefore(now, 'day'));
        
        if (overdue.length > 0) {
            const message = `<b>Tugas Terlewat!</b>\n\nAnda memiliki ${overdue.length} tugas yang melewati tenggat waktu. Segera selesaikan di aplikasi ProDo!`;
            this.notify(message);
        }
    }
};
