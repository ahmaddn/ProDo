// js/ui.js

const UI = {
    elements: {
        taskList: document.getElementById('taskList'),
        categoryList: document.getElementById('categoryList'),
        targetList: document.getElementById('targetList'),
        
        streakCount: document.getElementById('streakCount'),
        todayProgressText: document.getElementById('todayProgressText'),
        todayProgressPercent: document.getElementById('todayProgressPercent'),
        todayProgressBar: document.getElementById('todayProgressBar'),
        motivationText: document.getElementById('motivationText'),
        currentDateText: document.getElementById('currentDateText'),
        
        naggingBanner: document.getElementById('naggingBanner'),
        naggingText: document.getElementById('naggingText'),
        
        newTaskCategory: document.getElementById('newTaskCategory'),
        newTaskTarget: document.getElementById('newTaskTarget'),

        toastContainer: document.getElementById('toastContainer'),
        confirmModal: document.getElementById('confirmModal'),
        confirmMessage: document.getElementById('confirmMessage'),
        confirmOkBtn: document.getElementById('confirmOkBtn'),
        confirmCancelBtn: document.getElementById('confirmCancelBtn')
    },

    init() {
        lucide.createIcons();
        const dateEl = document.getElementById('currentDateText');
        if (dateEl) dateEl.textContent = dayjs().format('dddd, D MMMM YYYY');
    },

    isCustomColor(color) {
        return typeof color === 'string' && color.startsWith('hex:');
    },

    normalizeHex(hex) {
        if (!hex) return '#6366f1';
        let h = hex.trim();
        if (!h.startsWith('#')) h = '#' + h;
        return h.length === 4 ? h : h.slice(0, 7).toLowerCase();
    },

    getHexFromColor(color) {
        if (this.isCustomColor(color)) return this.normalizeHex(color.slice(4));
        const preset = Storage.CATEGORY_COLORS.find(c => c.color === color);
        return preset?.hex || '#6366f1';
    },

    getCategoryDisplayAttrs(color, { active = false } = {}) {
        if (this.isCustomColor(color)) {
            const hex = this.getHexFromColor(color);
            let style = `background-color: ${hex}1a; color: ${hex};`;
            if (active) style += ` box-shadow: 0 0 0 2px white, 0 0 0 4px ${hex};`;
            return { className: '', style };
        }
        const ring = active ? ` ring-2 ring-offset-2 ${(color || '').split(' ')[2] || 'ring-slate-400'}` : '';
        return { className: `${color || ''}${ring}`, style: '' };
    },

    renderCategories(categories, activeCategoryId = 'all') {
        this.elements.categoryList.innerHTML = `
            <div class="category-pill whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border ${activeCategoryId === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}" data-id="all">
                Semua
            </div>
        `;
        
        categories.forEach(cat => {
            const isActive = activeCategoryId === cat.id;
            const attrs = this.getCategoryDisplayAttrs(cat.color, { active: isActive });
            this.elements.categoryList.innerHTML += `
                <div class="category-pill whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border-0 ${attrs.className}" style="${attrs.style}" data-id="${cat.id}">
                    ${cat.name}
                </div>
            `;
        });

        // Populate select
        this.elements.newTaskCategory.innerHTML = '<option value="">Tanpa Kategori</option>';
        categories.forEach(cat => {
            this.elements.newTaskCategory.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    },

    renderColorPicker(selectedColor) {
        const picker = document.getElementById('categoryColorPicker');
        const colorInput = document.getElementById('categoryColor');
        const wheel = document.getElementById('categoryColorWheel');
        const hexLabel = document.getElementById('categoryColorHex');
        const preview = document.getElementById('categoryColorPreview');
        if (!picker || !colorInput) return;

        const selected = selectedColor || Storage.CATEGORY_COLORS[0].color;
        colorInput.value = selected;
        const isCustom = this.isCustomColor(selected);
        const hex = this.getHexFromColor(selected);

        if (wheel) wheel.value = hex;
        if (hexLabel) hexLabel.textContent = hex.toUpperCase();
        if (preview) {
            const attrs = this.getCategoryDisplayAttrs(selected);
            preview.className = `text-sm font-medium px-3 py-1 rounded-full shrink-0 ${attrs.className}`;
            preview.style.cssText = attrs.style;
            const nameInput = document.getElementById('categoryName');
            preview.textContent = (nameInput && nameInput.value.trim()) || 'Preview';
        }

        picker.innerHTML = Storage.CATEGORY_COLORS.map(c => {
            const isSelected = !isCustom && c.color === selected;
            return `
                <button type="button" class="color-swatch w-8 h-8 rounded-full ${c.color.split(' ').slice(0, 2).join(' ')} ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'} transition-transform" data-color="${c.color}" title="${c.label}"></button>
            `;
        }).join('');
    },

    renderCategoryManageList(categories) {
        const el = document.getElementById('categoryManageList');
        if (!el) return;

        if (categories.length === 0) {
            el.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">Belum ada kategori.</p>';
            return;
        }

        el.innerHTML = categories.map(cat => {
            const attrs = this.getCategoryDisplayAttrs(cat.color);
            return `
            <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 group">
                <span class="text-sm font-medium px-3 py-1 rounded-full ${attrs.className}" style="${attrs.style}">${cat.name}</span>
                <div class="flex items-center gap-1">
                    <button type="button" class="edit-category-btn p-1.5 text-slate-400 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors" data-id="${cat.id}" title="Edit">
                        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button type="button" class="delete-category-btn p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors" data-id="${cat.id}" title="Hapus">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `;
        }).join('');

        lucide.createIcons();
    },

    renderTargets(targets) {
        if (targets.length === 0) {
            this.elements.targetList.innerHTML = '<div class="text-center text-sm text-slate-400 py-4">Belum ada target.</div>';
        } else {
            this.elements.targetList.innerHTML = '';
            targets.forEach(target => {
                const isCompleted = target.progress >= 100;
                let deadlineBadge = '';
                if (target.deadline) {
                    const dl = dayjs(target.deadline);
                    const isOverdue = dl.isBefore(dayjs().startOf('day')) && !isCompleted;
                    const dlText = dl.format('D MMM');
                    deadlineBadge = `<span class="text-[10px] ml-2 px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-100 text-danger' : 'bg-slate-200 text-slate-600'}"><i data-lucide="clock" class="w-3 h-3 inline"></i> ${dlText}</span>`;
                }

                this.elements.targetList.innerHTML += `
                    <div class="target-item p-3 rounded-xl border border-slate-100 bg-slate-50 relative group">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-medium text-sm text-slate-800 break-words pr-2">${target.name}</h4>
                            <div class="flex items-center gap-1 shrink-0">
                                <span class="text-xs font-bold ${isCompleted ? 'text-success' : 'text-secondary'} mr-1">${target.progress}%</span>
                                <button class="edit-target-btn opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary transition-opacity" data-id="${target.id}" title="Edit Target">
                                    <i data-lucide="edit-2" class="w-3 h-3"></i>
                                </button>
                                <button class="delete-target-btn opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-danger transition-opacity" data-id="${target.id}" title="Hapus Target">
                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>
                        <div class="w-full bg-slate-200 rounded-full h-1.5 mb-1.5">
                            <div class="${isCompleted ? 'bg-success' : 'bg-secondary'} h-1.5 rounded-full transition-all duration-500" style="width: ${target.progress}%"></div>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">${target.type === 'daily' ? 'Harian' : target.type === 'weekly' ? 'Mingguan' : 'Jangka Panjang'}</div>
                            ${deadlineBadge}
                        </div>
                    </div>
                `;
            });
            lucide.createIcons();
        }

        // Populate select for new tasks
        this.elements.newTaskTarget.innerHTML = '<option value="">Tidak ada target</option>';
        targets.forEach(target => {
            this.elements.newTaskTarget.innerHTML += `<option value="${target.id}">${target.name}</option>`;
        });
    },

    renderTaskProgressSnippet(task) {
        const pct = typeof task.progressPercent === 'number' ? task.progressPercent : 0;
        const status = Storage.getTaskStatus(task);
        if (!task.progressNote && pct === 0 && status === 'todo') return '';

        const statusLabel = status === 'in_progress' ? 'Sedang dikerjakan' : status === 'completed' ? 'Selesai' : '';
        const barColor = status === 'completed' ? 'bg-success' : 'bg-primary';

        return `
            <div class="mt-2">
                ${statusLabel ? `<span class="text-[10px] font-medium text-amber-700">${statusLabel} · ${pct}%</span>` : `<span class="text-[10px] text-slate-500">${pct}%</span>`}
                <div class="w-full bg-slate-100 rounded-full h-1 mt-0.5">
                    <div class="${barColor} h-1 rounded-full" style="width: ${pct}%"></div>
                </div>
                ${task.progressNote ? `<p class="text-[10px] text-slate-500 mt-0.5 line-clamp-1">${task.progressNote.replace(/</g, '&lt;')}</p>` : ''}
            </div>
        `;
    },

    resolveTaskColumn(task) {
        const status = Storage.getTaskStatus(task);
        if (status === 'completed' || task.completed) return 'done';
        if (status === 'in_progress') return 'focus';
        if (task.column) return task.column;
        if (task.completed) return 'done';
        const today = dayjs().startOf('day');
        const isOverdue = task.dueDate && dayjs(task.dueDate).isBefore(today);
        const isToday = task.dueDate && dayjs(task.dueDate).isSame(today, 'day');
        if (task.priority === 'high' || isOverdue || isToday) return 'focus';
        return 'todo';
    },

    renderTasks(tasks, categories) {
        const todoList = document.getElementById('taskListTodo');
        const importantList = document.getElementById('taskListImportant');
        const doneList = document.getElementById('taskListDone');

        if (!todoList || !importantList || !doneList) return;

        todoList.innerHTML = '';
        importantList.innerHTML = '';
        doneList.innerHTML = '';

        const today = dayjs().startOf('day');

        let countTodo = 0;
        let countImportant = 0;
        let countDone = 0;

        tasks.forEach(task => {
            const cat = categories.find(c => c.id === task.categoryId);
            let catBadge = '';
            if (cat) {
                const catAttrs = this.getCategoryDisplayAttrs(cat.color);
                catBadge = `<span class="text-[10px] px-2 py-0.5 rounded-full ml-2 ${catAttrs.className}" style="${catAttrs.style}">${cat.name}</span>`;
            }
            
            let priorityIcon = '';
            if (task.priority === 'high') priorityIcon = '<i data-lucide="arrow-up-circle" class="w-4 h-4 text-danger inline ml-1"></i>';
            else if (task.priority === 'low') priorityIcon = '<i data-lucide="arrow-down-circle" class="w-4 h-4 text-success inline ml-1"></i>';

            let dueText = '';
            let dueClass = 'text-slate-400';
            let isOverdue = false;
            let isToday = false;
            
            if (task.dueDate) {
                const dueDate = dayjs(task.dueDate);
                if (dueDate.isBefore(today)) {
                    dueText = 'Terlewat: ' + dueDate.format('D MMM');
                    dueClass = 'text-danger font-medium';
                    isOverdue = true;
                } else if (dueDate.isSame(today)) {
                    dueText = task.dueTime ? `Hari ini, ${task.dueTime}` : 'Hari ini';
                    dueClass = 'text-warning font-medium';
                    isToday = true;
                } else {
                    dueText = task.dueTime
                        ? `${dueDate.format('D MMM YYYY')}, ${task.dueTime}`
                        : dueDate.format('D MMM YYYY');
                }

                if (task.dueTime && !task.completed) {
                    const dueAt = dayjs(`${task.dueDate}T${task.dueTime}`);
                    if (dueAt.isValid() && dayjs().isAfter(dueAt)) {
                        dueText = task.dueTime
                            ? `Terlewat · ${dueDate.format('D MMM')}, ${task.dueTime}`
                            : `Terlewat: ${dueDate.format('D MMM')}`;
                        dueClass = 'text-danger font-medium';
                        isOverdue = true;
                        isToday = false;
                    }
                }
            }

            const dueBadge = dueText ? `
                <div class="flex items-center gap-1 text-xs ${dueClass} mt-1">
                    <i data-lucide="calendar" class="w-3 h-3"></i> ${dueText}
                </div>
            ` : '';

            const taskHtml = `
                <div class="task-item group flex items-start gap-3 p-3 rounded-xl border ${isOverdue && !task.completed ? 'border-danger/30 bg-red-50' : 'border-slate-200 bg-white'} shadow-sm hover:shadow-md transition-shadow" data-id="${task.id}">
                    <div class="task-handle pt-1 cursor-grab opacity-20 group-hover:opacity-100 transition-opacity">
                        <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                    </div>
                    <button class="toggle-task-btn mt-0.5 flex-shrink-0 w-5 h-5 rounded border ${task.completed ? 'bg-primary border-primary text-white flex items-center justify-center' : 'border-slate-300 hover:border-primary'} transition-colors" data-id="${task.id}">
                        ${task.completed ? '<i data-lucide="check" class="w-4 h-4 check-icon-anim"></i>' : ''}
                    </button>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center flex-wrap">
                            <h3 class="task-title font-medium text-sm text-slate-800 break-words ${task.completed ? 'line-through text-slate-400' : ''}">${task.title}</h3>
                            ${priorityIcon}
                            ${catBadge}
                        </div>
                        ${dueBadge}
                        ${this.renderTaskProgressSnippet(task)}
                    </div>
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-col sm:flex-row">
                        <button class="task-progress-btn p-1.5 text-slate-400 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 rounded-lg" data-id="${task.id}" title="Update progress">
                            <i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i>
                        </button>
                        <button class="edit-task-btn p-1.5 text-slate-400 hover:text-primary bg-slate-50 hover:bg-indigo-50 rounded-lg" data-id="${task.id}">
                            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                        </button>
                        <button class="delete-task-btn p-1.5 text-slate-400 hover:text-danger bg-slate-50 hover:bg-red-50 rounded-lg" data-id="${task.id}">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
            `;

            const column = this.resolveTaskColumn(task);

            if (column === 'done') {
                doneList.innerHTML += taskHtml;
                countDone++;
            } else if (column === 'focus') {
                importantList.innerHTML += taskHtml;
                countImportant++;
            } else {
                todoList.innerHTML += taskHtml;
                countTodo++;
            }
        });

        // Show empty states if needed
        const emptyState = `<div class="kanban-empty text-center text-xs text-slate-400 py-6 border-2 border-dashed border-slate-200 rounded-xl">Kosong</div>`;
        if (countTodo === 0) todoList.innerHTML = emptyState;
        if (countImportant === 0) importantList.innerHTML = emptyState;
        if (countDone === 0) doneList.innerHTML = emptyState;

        // Update counts
        const countTodoEl = document.getElementById('countTodo');
        const countImportantEl = document.getElementById('countImportant');
        const countDoneEl = document.getElementById('countDone');
        
        if (countTodoEl) countTodoEl.textContent = countTodo;
        if (countImportantEl) countImportantEl.textContent = countImportant;
        if (countDoneEl) countDoneEl.textContent = countDone;

        lucide.createIcons();
    },


    updateDailyProgress(tasks, streak) {
        const todayTasks = tasks.filter(t => {
            if (t.dueDate && dayjs(t.dueDate).isSame(dayjs(), 'day')) return true;
            // Also count tasks created today if no due date (optional logic, let's keep it simple: due today or overdue but not completed)
            if (!t.completed && t.dueDate && dayjs(t.dueDate).isBefore(dayjs(), 'day')) return true; 
            return false;
        });

        // If no explicit tasks due today, just take all active tasks as today's focus to motivate user
        const focusTasks = todayTasks.length > 0 ? todayTasks : tasks;
        
        const completed = focusTasks.filter(t => t.completed).length;
        const total = focusTasks.length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        this.elements.todayProgressText.textContent = `${completed}/${total}`;
        this.elements.todayProgressPercent.textContent = `${percent}% Selesai`;
        this.elements.todayProgressBar.style.width = `${percent}%`;
        const streakEl = document.getElementById('streakCount');
        if (streakEl) streakEl.textContent = `${streak} Hari Streak`;

        // Motivations
        if (total === 0) {
            this.elements.motivationText.textContent = "Tambahkan tugas untuk hari ini!";
        } else if (percent === 0) {
            this.elements.motivationText.textContent = "Ayo mulai tugas pertamamu hari ini!";
        } else if (percent < 50) {
            this.elements.motivationText.textContent = "Awal yang bagus, teruskan!";
        } else if (percent < 100) {
            this.elements.motivationText.textContent = "Sedikit lagi selesai! Semangat!";
        } else {
            this.elements.motivationText.textContent = "Luar biasa! Semua tugas hari ini selesai.";
        }
    },

    updateNaggingBanner(tasks) {
        const today = dayjs().startOf('day');
        const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && dayjs(t.dueDate).isBefore(today));
        const activeTargets = Storage.getTargets().filter(t => t.progress < 100);

        if (overdueTasks.length > 0) {
            this.elements.naggingBanner.classList.remove('hidden');
            this.elements.naggingText.textContent = `Anda memiliki ${overdueTasks.length} tugas yang MELEWATI BATAS WAKTU! Segera selesaikan.`;
            this.elements.naggingBanner.classList.replace('bg-warning', 'bg-danger');
        } else if (activeTargets.length > 0 && tasks.filter(t => !t.completed).length > 0) {
            // Not overdue, but has targets and active tasks -> mild nagging (focus mode)
            // Just occasionally show it or if they have targets they haven't touched.
            // Let's only show banner for strictly overdue to avoid annoying too much, but for targets we highlight sidebar.
            this.elements.naggingBanner.classList.add('hidden');
        } else {
            this.elements.naggingBanner.classList.add('hidden');
        }
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const isError = type === 'error';
        toast.className = `flex items-center gap-3 py-3 px-4 rounded-xl shadow-lg border animate-fade-in ${isError ? 'bg-danger text-white border-red-600' : 'bg-surface text-slate-800 border-slate-200'}`;
        
        const iconClass = isError ? 'alert-circle' : 'check-circle';
        const iconColorClass = isError ? 'text-white' : 'text-success';

        toast.innerHTML = `
            <i data-lucide="${iconClass}" class="w-5 h-5 ${iconColorClass}"></i>
            <span class="text-sm font-medium">${message}</span>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /** Jalankan operasi: toast jika sukses, log error ke console jika gagal (mendukung Promise) */
    runOp(actionLabel, operation, successMessage) {
        try {
            const result = operation();
            if (result && typeof result.then === 'function') {
                return result
                    .then((value) => {
                        if (successMessage) this.showToast(successMessage);
                        return { ok: true, result: value };
                    })
                    .catch((error) => {
                        console.error(`[ProDo] Gagal ${actionLabel}:`, error);
                        this.showToast(`Gagal ${actionLabel}.`, 'error');
                        return { ok: false, error };
                    });
            }
            if (successMessage) this.showToast(successMessage);
            return { ok: true, result };
        } catch (error) {
            console.error(`[ProDo] Gagal ${actionLabel}:`, error);
            this.showToast(`Gagal ${actionLabel}.`, 'error');
            return { ok: false, error };
        }
    },

    async runOpAsync(actionLabel, operation, successMessage) {
        try {
            const result = await operation();
            if (successMessage) this.showToast(successMessage);
            return { ok: true, result };
        } catch (error) {
            console.error(`[ProDo] Gagal ${actionLabel}:`, error);
            this.showToast(`Gagal ${actionLabel}.`, 'error');
            return { ok: false, error };
        }
    },

    showInfo(title, htmlContent) {
        const titleEl = document.getElementById('confirmModalTitle');
        if (titleEl) titleEl.textContent = title;
        this.elements.confirmMessage.innerHTML = htmlContent;
        this.elements.confirmCancelBtn.classList.add('hidden');
        this.elements.confirmOkBtn.textContent = 'Tutup';
        this.elements.confirmModal.classList.remove('hidden');

        const cleanup = () => {
            this.elements.confirmModal.classList.add('hidden');
            this.elements.confirmMessage.textContent = 'Apakah Anda yakin?';
            if (titleEl) titleEl.textContent = 'Konfirmasi';
            this.elements.confirmCancelBtn.classList.remove('hidden');
            this.elements.confirmOkBtn.textContent = 'Ya, Lanjutkan';
            this.elements.confirmOkBtn.removeEventListener('click', okHandler);
        };

        const okHandler = () => cleanup();
        this.elements.confirmOkBtn.addEventListener('click', okHandler);
    },

    showConfirm(message, onConfirm) {
        this.elements.confirmMessage.textContent = message;
        this.elements.confirmModal.classList.remove('hidden');
        
        const cleanup = () => {
            this.elements.confirmModal.classList.add('hidden');
            this.elements.confirmOkBtn.removeEventListener('click', okHandler);
            this.elements.confirmCancelBtn.removeEventListener('click', cancelHandler);
        };

        const okHandler = () => {
            cleanup();
            if (onConfirm) onConfirm();
        };

        const cancelHandler = () => {
            cleanup();
        };

        this.elements.confirmOkBtn.addEventListener('click', okHandler);
        this.elements.confirmCancelBtn.addEventListener('click', cancelHandler);
    }
};
