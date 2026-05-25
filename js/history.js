// js/history.js — Halaman riwayat tugas

const TaskHistory = {
    currentFilter: 'all',
    searchQuery: '',

    statusMeta: {
        todo: { label: 'Belum selesai', class: 'bg-slate-100 text-slate-700' },
        in_progress: { label: 'Sedang dikerjakan', class: 'bg-amber-100 text-amber-800' },
        completed: { label: 'Selesai', class: 'bg-emerald-100 text-emerald-800' }
    },

    render() {
        const el = document.getElementById('historyTaskList');
        if (!el) return;

        const tasks = Storage.getTasks();
        const categories = Storage.getCategories();
        let filtered = tasks;

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter((t) => Storage.getTaskStatus(t) === this.currentFilter);
        }

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter((t) =>
                t.title.toLowerCase().includes(q)
                || (t.progressNote && t.progressNote.toLowerCase().includes(q))
            );
        }

        filtered.sort((a, b) => {
            const da = a.updatedAt || a.createdAt || '';
            const db = b.updatedAt || b.createdAt || '';
            return db.localeCompare(da);
        });

        if (filtered.length === 0) {
            el.innerHTML = '<div class="text-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-2xl">Tidak ada tugas untuk filter ini.</div>';
            return;
        }

        el.innerHTML = filtered.map((task) => this.renderCard(task, categories)).join('');
        lucide.createIcons();
    },

    renderCard(task, categories) {
        const status = Storage.getTaskStatus(task);
        const meta = this.statusMeta[status] || this.statusMeta.todo;
        const cat = categories.find((c) => c.id === task.categoryId);
        let catHtml = '';
        if (cat) {
            const attrs = UI.getCategoryDisplayAttrs(cat.color);
            catHtml = `<span class="text-[10px] px-2 py-0.5 rounded-full ${attrs.className}" style="${attrs.style}">${cat.name}</span>`;
        }

        const due = task.dueDate
            ? (task.dueTime
                ? `${dayjs(task.dueDate).format('D MMM YYYY')} · ${task.dueTime}`
                : dayjs(task.dueDate).format('D MMM YYYY'))
            : '—';
        const updated = task.updatedAt
            ? dayjs(task.updatedAt).format('D MMM YYYY, HH:mm')
            : '—';
        const note = task.progressNote
            ? `<p class="text-sm text-slate-600 mt-2 line-clamp-2"><span class="font-medium text-slate-500">Catatan:</span> ${this.escape(task.progressNote)}</p>`
            : '';
        const pct = typeof task.progressPercent === 'number' ? task.progressPercent : 0;
        const historyCount = (task.historyLog || []).length;

        const lastLog = (task.historyLog || []).slice(-1)[0];
        const lastLogHtml = lastLog
            ? `<p class="text-xs text-slate-400 mt-1">Terakhir: ${this.escape(lastLog.note || '—')} (${dayjs(lastLog.at).format('D MMM, HH:mm')})</p>`
            : '';

        return `
            <div class="history-task-card bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow" data-id="${task.id}">
                <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <h3 class="font-semibold text-slate-800 ${status === 'completed' ? 'line-through text-slate-500' : ''}">${this.escape(task.title)}</h3>
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full ${meta.class}">${meta.label}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                    ${catHtml}
                    <span><i data-lucide="calendar" class="w-3 h-3 inline"></i> Jatuh tempo: ${due}</span>
                    <span><i data-lucide="percent" class="w-3 h-3 inline"></i> ${pct}%</span>
                    <span><i data-lucide="list" class="w-3 h-3 inline"></i> ${historyCount} entri riwayat</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                    <div class="h-1.5 rounded-full transition-all ${status === 'completed' ? 'bg-success' : 'bg-primary'}" style="width: ${pct}%"></div>
                </div>
                ${note}
                ${lastLogHtml}
                <p class="text-[10px] text-slate-400 mt-2">Diperbarui: ${updated}</p>
                <div class="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button type="button" class="history-progress-btn flex-1 py-2 px-3 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors" data-id="${task.id}">
                        Update progress
                    </button>
                    <button type="button" class="history-view-log-btn py-2 px-3 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors" data-id="${task.id}">
                        Riwayat
                    </button>
                </div>
            </div>
        `;
    },

    escape(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    showLogModal(taskId) {
        const task = Storage.getTasks().find((t) => t.id === taskId);
        if (!task) return;

        const logs = [...(task.historyLog || [])].reverse();
        const body = logs.length === 0
            ? '<p class="text-sm text-slate-500">Belum ada riwayat.</p>'
            : logs.map((log) => `
                <div class="py-2 border-b border-slate-100 last:border-0">
                    <div class="flex justify-between text-xs text-slate-500 mb-1">
                        <span class="font-medium uppercase">${this.formatLogType(log.type)}</span>
                        <span>${dayjs(log.at).format('D MMM YYYY, HH:mm')}</span>
                    </div>
                    <p class="text-sm text-slate-700">${this.escape(log.note || '—')}</p>
                    ${typeof log.progressPercent === 'number' ? `<p class="text-xs text-primary mt-0.5">${log.progressPercent}%</p>` : ''}
                </div>
            `).join('');

        UI.showInfo(`Riwayat: ${task.title}`, `<div class="max-h-64 overflow-y-auto">${body}</div>`);
    },

    formatLogType(type) {
        const map = {
            created: 'Dibuat',
            progress: 'Progress',
            in_progress: 'Sedang dikerjakan',
            completed: 'Selesai',
            reopened: 'Dibuka kembali'
        };
        return map[type] || type;
    }
};
