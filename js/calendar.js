// js/calendar.js

const CalendarUI = {
    calendar: null,

    init() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl || !window.FullCalendar) return;

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            events: this.getEvents.bind(this),
            eventClick: this.handleEventClick.bind(this),
            eventContent: this.renderEventContent.bind(this),
            eventDidMount: () => { if (window.lucide) lucide.createIcons(); },
            contentHeight: 'auto',
            themeSystem: 'standard',
            buttonText: {
                today: 'Hari Ini',
                month: 'Bulan',
                week: 'Minggu',
                list: 'Agenda'
            }
        });
    },

    renderEventContent(arg) {
        const { type, raw } = arg.event.extendedProps;
        let icon = 'calendar';
        if (type === 'task') icon = raw?.completed ? 'check-circle-2' : 'list-checks';
        else if (type === 'target') icon = 'target';
        else if (type === 'activity') icon = 'calendar-heart';

        const title = arg.event.title;
        return {
            html: `<div class="fc-custom-event flex items-center gap-1 min-w-0 px-0.5">
                <i data-lucide="${icon}" class="w-3 h-3 shrink-0"></i>
                <span class="truncate">${title}</span>
            </div>`
        };
    },

    getEvents(fetchInfo, successCallback, failureCallback) {
        if (!Storage.isLoggedIn()) {
            successCallback([]);
            return;
        }

        const events = [];
        
        // 1. Tasks (Biru)
        const tasks = Storage.getTasks();
        tasks.forEach(task => {
            if (task.dueDate) {
                events.push({
                    id: 'task_' + task.id,
                    title: task.title,
                    start: task.dueDate,
                    allDay: true,
                    backgroundColor: task.completed ? '#94a3b8' : '#6366f1', // slate-400 : primary
                    borderColor: 'transparent',
                    extendedProps: { type: 'task', raw: task }
                });
            }
        });

        // 2. Targets (Pink)
        const targets = Storage.getTargets();
        targets.forEach(target => {
            if (target.deadline) {
                const isCompleted = target.progress >= 100;
                events.push({
                    id: 'target_' + target.id,
                    title: `${target.name} (${target.progress}%)`,
                    start: target.deadline,
                    allDay: true,
                    backgroundColor: isCompleted ? '#94a3b8' : '#ec4899', // slate-400 : secondary
                    borderColor: 'transparent',
                    extendedProps: { type: 'target', raw: target }
                });
            }
        });

        // 3. Activities (Teal)
        const activities = Storage.getActivities();
        activities.forEach(act => {
            events.push({
                id: 'act_' + act.id,
                title: act.name,
                start: act.start,
                end: act.end ? dayjs(act.end).add(1, 'day').format('YYYY-MM-DD') : null, // FullCalendar end date is exclusive
                allDay: true,
                backgroundColor: '#14b8a6', // teal-500
                borderColor: 'transparent',
                extendedProps: { type: 'activity', raw: act }
            });
        });

        successCallback(events);
    },

    handleEventClick(info) {
        const type = info.event.extendedProps.type;
        const raw = info.event.extendedProps.raw;

        if (type === 'activity') {
            // Open edit modal
            document.getElementById('activityModalTitle').textContent = 'Edit Kegiatan';
            document.getElementById('activityId').value = raw.id;
            document.getElementById('activityName').value = raw.name;
            document.getElementById('activityStartDate').value = raw.start;
            document.getElementById('activityEndDate').value = raw.end || '';
            document.getElementById('deleteActivityBtn').classList.remove('hidden');
            document.getElementById('activityModal').classList.remove('hidden');
        } else if (type === 'task') {
            UI.showToast(`Tugas: ${raw.title}`);
        } else if (type === 'target') {
            UI.showToast(`Target: ${raw.name}`);
        }
    },

    render() {
        if (!this.calendar) {
            this.init();
            if (this.calendar) this.calendar.render();
        } else {
            this.calendar.refetchEvents();
            this.calendar.render(); // Ensure resizing is correct
        }
    }
};
