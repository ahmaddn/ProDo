// js/dashboard.js
// Dashboard rendering with Chart.js

const Dashboard = {
    charts: {
        donut: null,
        priority: null,
        category: null,
    },

    render() {
        const tasks = Storage.getTasks();
        const targets = Storage.getTargets();
        const categories = Storage.getCategories();
        const activities = Storage.getActivities();
        const stats = Storage.getStats();

        this.renderStatCards(tasks, stats);
        this.renderActivityStatCards(activities);
        this.renderDonutChart(tasks);
        this.renderPriorityChart(tasks);
        this.renderCategoryChart(tasks, categories);
        this.renderTargetList(targets);
        this.renderUpcomingTasks(tasks, categories);
        this.renderUpcomingActivities(activities);

        // Update date
        const dateEl = document.getElementById('dashboardDate');
        if (dateEl) dateEl.textContent = dayjs().format('dddd, D MMMM YYYY');
    },

    getActivityStatus(act, today) {
        const start = dayjs(act.start).startOf('day');
        const end = act.end ? dayjs(act.end).startOf('day') : start;
        if (today.isAfter(end)) return 'past';
        if (today.isBefore(start)) return 'upcoming';
        return 'ongoing';
    },

    formatActivityDateRange(act) {
        const start = dayjs(act.start);
        const end = act.end ? dayjs(act.end) : null;
        if (!end || start.isSame(end, 'day')) return start.format('D MMM YYYY');
        if (start.isSame(end, 'month')) return `${start.format('D')} – ${end.format('D MMM YYYY')}`;
        if (start.isSame(end, 'year')) return `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`;
        return `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`;
    },

    renderActivityStatCards(activities) {
        const today = dayjs().startOf('day');
        const total = activities.length;
        let ongoing = 0;
        let upcoming = 0;
        let past = 0;

        activities.forEach(act => {
            const status = this.getActivityStatus(act, today);
            if (status === 'ongoing') ongoing++;
            else if (status === 'upcoming') upcoming++;
            else past++;
        });

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        set('statTotalActivities', total);
        set('statOngoingActivities', ongoing);
        set('statUpcomingActivities', upcoming);
        set('statPastActivities', past);
    },

    renderStatCards(tasks, stats) {
        const today = dayjs().startOf('day');
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const overdue = tasks.filter(t => !t.completed && t.dueDate && dayjs(t.dueDate).isBefore(today)).length;
        const streak = stats.streak || 0;

        document.getElementById('statTotalTasks').textContent = total;
        document.getElementById('statCompleted').textContent = completed;
        document.getElementById('statOverdue').textContent = overdue;
        document.getElementById('statStreak').textContent = streak;
    },

    renderDonutChart(tasks) {
        const today = dayjs().startOf('day');
        const completed = tasks.filter(t => t.completed).length;
        const overdue = tasks.filter(t => !t.completed && t.dueDate && dayjs(t.dueDate).isBefore(today)).length;
        const active = tasks.filter(t => !t.completed).length - overdue;
        const total = tasks.length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        document.getElementById('donutPercent').textContent = percent + '%';

        const ctx = document.getElementById('chartDonut');
        if (!ctx) return;

        if (this.charts.donut) this.charts.donut.destroy();

        this.charts.donut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Selesai', 'Aktif', 'Terlewat'],
                datasets: [{
                    data: [completed || 0, active > 0 ? active : 0, overdue || 0],
                    backgroundColor: ['#10b981', '#6366f1', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } }
                },
                animation: { animateRotate: true, duration: 600 }
            }
        });
    },

    renderPriorityChart(tasks) {
        const high = tasks.filter(t => t.priority === 'high').length;
        const medium = tasks.filter(t => t.priority === 'medium').length;
        const low = tasks.filter(t => t.priority === 'low').length;

        const ctx = document.getElementById('chartPriority');
        if (!ctx) return;

        if (this.charts.priority) this.charts.priority.destroy();

        this.charts.priority = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Tinggi', 'Sedang', 'Rendah'],
                datasets: [{
                    label: 'Jumlah Tugas',
                    data: [high, medium, low],
                    backgroundColor: ['#fecaca', '#fde68a', '#bbf7d0'],
                    borderColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} tugas` } } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } }
                }
            }
        });
    },

    renderCategoryChart(tasks, categories) {
        const catData = categories.map(cat => ({
            name: cat.name,
            count: tasks.filter(t => t.categoryId === cat.id).length
        }));
        const noCategory = tasks.filter(t => !t.categoryId).length;
        if (noCategory > 0) catData.push({ name: 'Lainnya', count: noCategory });

        const labels = catData.map(c => c.name);
        const data = catData.map(c => c.count);
        const colors = [
            '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6',
            '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
        ];

        const ctx = document.getElementById('chartCategory');
        if (!ctx) return;

        if (this.charts.category) this.charts.category.destroy();

        this.charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Jumlah Tugas',
                    data,
                    backgroundColor: colors.map(c => c + '33'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} tugas` } } },
                scales: {
                    x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
                    y: { grid: { display: false }, ticks: { font: { size: 11 } } }
                }
            }
        });
    },

    renderTargetList(targets) {
        const el = document.getElementById('dashTargetList');
        if (!el) return;

        if (targets.length === 0) {
            el.innerHTML = '<div class="text-center text-sm text-slate-400 py-6">Belum ada target yang dibuat.</div>';
            return;
        }

        el.innerHTML = targets.map(t => {
            const isCompleted = t.progress >= 100;
            const typeLabel = { daily: 'Harian', weekly: 'Mingguan', longterm: 'Jangka Panjang' }[t.type] || t.type;
            return `
                <div class="p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div class="flex justify-between items-center mb-1.5">
                        <span class="text-sm font-medium text-slate-800">${t.name}</span>
                        <span class="text-xs font-bold ${isCompleted ? 'text-success' : 'text-secondary'}">${t.progress}%</span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                        <div class="${isCompleted ? 'bg-success' : 'bg-secondary'} h-1.5 rounded-full transition-all duration-500" style="width: ${t.progress}%"></div>
                    </div>
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">${typeLabel}</span>
                </div>
            `;
        }).join('');
    },

    renderUpcomingTasks(tasks, categories) {
        const el = document.getElementById('dashUpcomingList');
        if (!el) return;

        const today = dayjs().startOf('day');
        const upcoming = tasks
            .filter(t => !t.completed && t.dueDate && !dayjs(t.dueDate).isBefore(today))
            .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
            .slice(0, 6);

        if (upcoming.length === 0) {
            el.innerHTML = '<div class="text-center text-sm text-slate-400 py-6">Tidak ada tugas mendatang.</div>';
            return;
        }

        const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' };
        const priorityLabel = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

        el.innerHTML = upcoming.map(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            const catAttrs = cat ? UI.getCategoryDisplayAttrs(cat.color) : null;
            const catBadge = cat
                ? `<span class="text-[10px] px-1.5 py-0.5 rounded-full ${catAttrs.className}" style="${catAttrs.style}">${cat.name}</span>`
                : '';
            const isToday = dayjs(t.dueDate).isSame(today, 'day');
            const dueTxt = isToday ? 'Hari ini' : dayjs(t.dueDate).format('D MMM');
            return `
                <div class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div class="w-2 h-2 rounded-full flex-shrink-0 ${isToday ? 'bg-warning' : 'bg-primary'}"></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-slate-800 truncate">${t.title}</p>
                        <div class="flex items-center gap-1.5 mt-0.5">
                            <span class="text-xs text-slate-400">${dueTxt}</span>
                            ${catBadge}
                        </div>
                    </div>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority]}">${priorityLabel[t.priority]}</span>
                </div>
            `;
        }).join('');
    },

    renderUpcomingActivities(activities) {
        const el = document.getElementById('dashUpcomingActivities');
        if (!el) return;

        const today = dayjs().startOf('day');
        const relevant = activities
            .filter(act => this.getActivityStatus(act, today) !== 'past')
            .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf())
            .slice(0, 6);

        if (relevant.length === 0) {
            el.innerHTML = '<div class="text-center text-sm text-slate-400 py-6">Tidak ada kegiatan mendatang.</div>';
            return;
        }

        const statusLabel = { ongoing: 'Berlangsung', upcoming: 'Mendatang' };
        const statusColors = {
            ongoing: 'bg-emerald-100 text-emerald-700',
            upcoming: 'bg-teal-100 text-teal-700'
        };

        el.innerHTML = relevant.map(act => {
            const status = this.getActivityStatus(act, today);
            const dateTxt = status === 'ongoing' ? 'Berlangsung' : this.formatActivityDateRange(act);

            return `
                <div class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div class="w-2 h-2 rounded-full flex-shrink-0 ${status === 'ongoing' ? 'bg-teal-500' : 'bg-primary'}"></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-slate-800 truncate">${act.name}</p>
                        <div class="flex items-center gap-1.5 mt-0.5">
                            <span class="text-xs text-slate-400">${dateTxt}</span>
                        </div>
                    </div>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[status]}">${statusLabel[status]}</span>
                </div>
            `;
        }).join('');
    }
};
