// js/app.js

document.addEventListener('DOMContentLoaded', async () => {
    UI.init();
    await Storage.init();
    await AppNotifications.init();

    // State
    let currentFilter = 'all';
    let currentCategory = 'all';
    let searchQuery = '';
    let activePage = 'dashboard'; // 'dashboard' | 'todolist'

    // ─── Elements ────────────────────────────────────────────────
    const taskForm        = document.getElementById('taskForm');
    const taskInput       = document.getElementById('taskInput');
    const addTaskModal    = document.getElementById('addTaskModal');
    const openAddTaskBtn  = document.getElementById('openAddTaskBtn');
    const newTaskCategory = document.getElementById('newTaskCategory');
    const newTaskPriority = document.getElementById('newTaskPriority');
    const newTaskDueDate  = document.getElementById('newTaskDueDate');
    const newTaskDueTime  = document.getElementById('newTaskDueTime');
    const taskDueTimeWrap = document.getElementById('taskDueTimeWrap');
    const newTaskTarget   = document.getElementById('newTaskTarget');
    const filterSelect    = document.getElementById('filterSelect');
    const searchInput     = document.getElementById('searchInput');
    const closeNaggingBtn = document.getElementById('closeNaggingBtn');
    const naggingBanner   = document.getElementById('naggingBanner');

    const settingsModal   = document.getElementById('settingsModal');
    const exportImportBtn = document.getElementById('exportImportBtn');
    const exportDataBtn   = document.getElementById('exportDataBtn');
    const importDataInput = document.getElementById('importDataInput');
    const clearDataBtn    = document.getElementById('clearDataBtn');
    const closeModals     = document.querySelectorAll('.close-modal-btn');
    const tgBotTokenInput = document.getElementById('tgBotToken');
    const tgChatIdInput   = document.getElementById('tgChatId');
    const saveTgSettingsBtn = document.getElementById('saveTgSettingsBtn');
    const openTestTgBtn   = document.getElementById('openTestTgBtn');
    const testTgModal     = document.getElementById('testTgModal');
    const tgTestMessage   = document.getElementById('tgTestMessage');
    const sendTgTestBtn   = document.getElementById('sendTgTestBtn');

    const targetModal     = document.getElementById('targetModal');
    const addTargetBtn    = document.getElementById('addTargetBtn');
    const targetModalForm = document.getElementById('targetModalForm');
    const targetIdInput   = document.getElementById('targetId');
    const targetNameInput = document.getElementById('targetName');
    const targetTypeInput = document.getElementById('targetType');
    const targetProgressInput = document.getElementById('targetProgress');
    const targetDeadlineInput = document.getElementById('targetDeadline');

    const activityModal       = document.getElementById('activityModal');
    const activityModalForm   = document.getElementById('activityModalForm');
    const activityModalTitle  = document.getElementById('activityModalTitle');
    const activityIdInput     = document.getElementById('activityId');
    const activityNameInput   = document.getElementById('activityName');
    const activityStartDate   = document.getElementById('activityStartDate');
    const activityEndDate     = document.getElementById('activityEndDate');
    const openAddActivityBtn  = document.getElementById('openAddActivityBtn');
    const deleteActivityBtn   = document.getElementById('deleteActivityBtn');

    const categoryModal       = document.getElementById('categoryModal');
    const categoryModalForm   = document.getElementById('categoryModalForm');
    const openCategoryModalBtn = document.getElementById('openCategoryModalBtn');
    const categoryIdInput     = document.getElementById('categoryId');
    const categoryNameInput   = document.getElementById('categoryName');
    const categoryColorInput  = document.getElementById('categoryColor');
    const categoryColorPicker = document.getElementById('categoryColorPicker');
    const categoryColorWheel  = document.getElementById('categoryColorWheel');
    const categoryManageList  = document.getElementById('categoryManageList');

    // Auth
    const authContainer  = document.getElementById('authContainer');
    const appContainer   = document.getElementById('appContainer');
    const authForm       = document.getElementById('authForm');
    const authUsername   = document.getElementById('authUsername');
    const authPassword   = document.getElementById('authPassword');
    const authSubmitBtn  = document.getElementById('authSubmitBtn');
    const authSwitchBtn  = document.getElementById('authSwitchBtn');
    const authSwitchText = document.getElementById('authSwitchText');
    const authSubtitle   = document.getElementById('authSubtitle');
    const logoutBtn      = document.getElementById('logoutBtn');
    const pageTabs       = document.getElementById('pageTabs');
    const streakBadge    = document.getElementById('streakBadge');
    const streakCountEl  = document.getElementById('streakCount');

    // Pages
    const pageDashboard  = document.getElementById('pageDashboard');
    const pageTodolist   = document.getElementById('pageTodolist');
    const pageCalendar   = document.getElementById('pageCalendar');
    const pageHistory    = document.getElementById('pageHistory');
    const tabDashboard   = document.getElementById('tabDashboard');
    const tabTodolist    = document.getElementById('tabTodolist');
    const tabCalendar    = document.getElementById('tabCalendar');
    const tabHistory     = document.getElementById('tabHistory');

    const taskProgressModal       = document.getElementById('taskProgressModal');
    const taskProgressTaskId      = document.getElementById('taskProgressTaskId');
    const taskProgressTaskName    = document.getElementById('taskProgressTaskName');
    const taskProgressPercent     = document.getElementById('taskProgressPercent');
    const taskProgressPercentLabel = document.getElementById('taskProgressPercentLabel');
    const taskProgressNote        = document.getElementById('taskProgressNote');
    const taskProgressSaveBtn     = document.getElementById('taskProgressSaveBtn');
    const taskProgressCompleteBtn = document.getElementById('taskProgressCompleteBtn');
    const closeTaskProgressModal  = document.getElementById('closeTaskProgressModal');
    const historySearchInput      = document.getElementById('historySearchInput');

    let authMode = 'login';

    newTaskDueDate.value = dayjs().format('YYYY-MM-DD');
    setTaskDueDateMin();

    function setTaskDueDateMin() {
        if (newTaskDueDate) {
            newTaskDueDate.min = dayjs().format('YYYY-MM-DD');
        }
    }

    function syncTaskDueTimeField() {
        if (!taskDueTimeWrap || !newTaskDueDate) return;
        taskDueTimeWrap.classList.toggle('hidden', !newTaskDueDate.value);
    }

    function getTaskDueTimeForSave(dueDate) {
        if (!dueDate) return null;
        const t = newTaskDueTime?.value?.trim();
        return t || null;
    }

    setTaskDueDateMin();
    newTaskDueDate.addEventListener('change', syncTaskDueTimeField);
    syncTaskDueTimeField();

    // ─── Page Navigation (sequential keyframe transitions) ───────
    const allPages = [
        { el: pageDashboard, key: 'dashboard' },
        { el: pageTodolist,  key: 'todolist'  },
        { el: pageCalendar,  key: 'calendar'  },
        { el: pageHistory,   key: 'history'   }
    ];

    let isTransitioning = false;

    function showPage(el) {
        el.classList.remove('hidden');
        if (el === pageCalendar) el.classList.add('flex');
    }
    function hidePage(el) {
        el.classList.add('hidden');
        el.classList.remove('page-anim-in', 'page-anim-out');
        if (el === pageCalendar) el.classList.remove('flex');
    }

    function triggerRender(page) {
        if (page === 'dashboard') Dashboard.render();
        if (page === 'todolist') renderTodolist();
        if (page === 'calendar' && typeof CalendarUI !== 'undefined') {
            setTimeout(() => CalendarUI.render(), 50);
        }
        if (page === 'history' && typeof TaskHistory !== 'undefined') {
            TaskHistory.render();
        }
    }

    function updateTabs(page) {
        tabDashboard.classList.toggle('active-tab', page === 'dashboard');
        tabTodolist.classList.toggle('active-tab', page === 'todolist');
        tabCalendar.classList.toggle('active-tab', page === 'calendar');
        tabHistory.classList.toggle('active-tab', page === 'history');
    }

    function switchPage(page) {
        if (activePage === page || isTransitioning) return;
        isTransitioning = true;

        const outEl = allPages.find(p => p.key === activePage)?.el;
        const inEl  = allPages.find(p => p.key === page)?.el;
        activePage = page;

        updateTabs(page);

        // Step 1: animate current page OUT (180ms)
        if (outEl) {
            outEl.classList.remove('page-anim-in');
            outEl.classList.add('page-anim-out');
        }

        setTimeout(() => {
            // Step 2: hide outgoing, show incoming, trigger render
            if (outEl) hidePage(outEl);
            if (inEl) {
                showPage(inEl);
                triggerRender(page);
                // Step 3: animate incoming page IN (280ms)
                inEl.classList.remove('page-anim-out');
                // force browser to register display:block before animating
                void inEl.offsetWidth;
                inEl.classList.add('page-anim-in');
            }
            isTransitioning = false;
        }, 180); // matches pageOut duration
    }

    // Initialise without animation (on login / page load)
    function initPage(page) {
        activePage = page;
        allPages.forEach(p => {
            p.el.classList.remove('page-anim-in', 'page-anim-out');
            if (p.key === page) {
                showPage(p.el);
            } else {
                hidePage(p.el);
            }
        });
        updateTabs(page);
        triggerRender(page);
    }

    tabDashboard.addEventListener('click', () => switchPage('dashboard'));
    tabTodolist.addEventListener('click',  () => switchPage('todolist'));
    tabCalendar.addEventListener('click',  () => switchPage('calendar'));
    tabHistory.addEventListener('click',  () => switchPage('history'));

    // ─── Auth ────────────────────────────────────────────────────
    function setAuthLoading(loading) {
        authSubmitBtn.disabled = loading;
        authSubmitBtn.textContent = loading ? 'Memuat...' : (authMode === 'login' ? 'Masuk' : 'Daftar');
    }

    async function checkAuthState() {
        if (Storage.isLoggedIn()) {
            const migrated = await Storage.migrateFromLocalStorage();
            if (migrated) UI.showToast('Data lama berhasil dipindahkan ke cloud.');

            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            appContainer.classList.add('flex');
            logoutBtn.classList.remove('hidden');
            exportImportBtn.classList.remove('hidden');
            pageTabs.classList.remove('hidden');
            pageTabs.classList.add('flex');
            streakBadge.classList.remove('hidden');
            streakBadge.classList.add('flex');
            initPage('dashboard');
            AppNotifications.runScheduledChecks();
        } else {
            authContainer.classList.remove('hidden');
            appContainer.classList.add('hidden');
            appContainer.classList.remove('flex');
            logoutBtn.classList.add('hidden');
            exportImportBtn.classList.add('hidden');
            pageTabs.classList.add('hidden');
            pageTabs.classList.remove('flex');
            streakBadge.classList.add('hidden');
            settingsModal.classList.add('hidden');
        }
    }

    window.addEventListener('prodo:data-changed', () => {
        if (Storage.isLoggedIn()) refreshCurrentPage();
    });

    window.addEventListener('prodo:firestore-error', (e) => {
        UI.showToast(e.detail?.message || 'Gagal mengakses database.', 'error');
    });

    authSwitchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (authMode === 'login') {
            authMode = 'register';
            authSubmitBtn.textContent = 'Daftar';
            authSwitchText.textContent = 'Sudah punya akun?';
            authSwitchBtn.textContent = 'Masuk sekarang';
            authSubtitle.textContent = 'Buat akun baru untuk memulai.';
        } else {
            authMode = 'login';
            authSubmitBtn.textContent = 'Masuk';
            authSwitchText.textContent = 'Belum punya akun?';
            authSwitchBtn.textContent = 'Daftar sekarang';
            authSubtitle.textContent = 'Masuk untuk mengelola tugas Anda.';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authUsername.value.trim();
        const pass = authPassword.value.trim();
        if (!email || !pass) return;

        setAuthLoading(true);
        try {
            if (authMode === 'login') {
                const ok = await Storage.loginUser(email, pass);
                if (ok) {
                    authUsername.value = '';
                    authPassword.value = '';
                    await checkAuthState();
                    AppNotifications.runScheduledChecks();
                    UI.showToast('Berhasil masuk!');
                } else {
                    console.error('[ProDo] Login gagal: email atau password salah');
                    UI.showToast('Email atau password salah.', 'error');
                }
            } else {
                const ok = await Storage.registerUser(email, pass);
                if (ok) {
                    authUsername.value = '';
                    authPassword.value = '';
                    await checkAuthState();
                    AppNotifications.runScheduledChecks();
                    UI.showToast('Akun berhasil dibuat!');
                } else {
                    console.error('[ProDo] Registrasi gagal: email sudah digunakan');
                    UI.showToast('Email sudah terdaftar.', 'error');
                }
            }
        } catch (err) {
            console.error('[ProDo] Auth error:', err);
            UI.showToast(err.message || 'Gagal autentikasi. Periksa konfigurasi Firebase.', 'error');
        } finally {
            setAuthLoading(false);
        }
    });

    logoutBtn.addEventListener('click', () => {
        UI.showConfirm('Yakin ingin keluar?', () => {
            UI.runOp('keluar', async () => {
                await Storage.logoutUser();
                await checkAuthState();
            }, 'Berhasil keluar.');
        });
    });

    // ─── Todolist Render ─────────────────────────────────────────
    function renderTodolist() {
        const categories = Storage.getCategories();
        const targets    = Storage.getTargets();
        const stats      = Storage.getStats();
        let tasks        = Storage.getTasks();

        // Update streak badge
        streakCountEl.textContent = `${stats.streak} Hari Streak`;

        if (searchQuery) tasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
        if (currentCategory !== 'all') tasks = tasks.filter(t => t.categoryId === currentCategory);

        const today = dayjs().startOf('day');
        if (currentFilter === 'active')        tasks = tasks.filter(t => !t.completed);
        if (currentFilter === 'completed')     tasks = tasks.filter(t => t.completed);
        if (currentFilter === 'high-priority') tasks = tasks.filter(t => t.priority === 'high');
        if (currentFilter === 'today')         tasks = tasks.filter(t => t.dueDate && dayjs(t.dueDate).isSame(today, 'day'));

        tasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const pMap = { high: 1, medium: 2, low: 3 };
            if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
            if (a.dueDate && b.dueDate) return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return 0;
        });

        UI.renderCategories(categories, currentCategory);
        UI.renderTargets(targets);
        UI.renderTasks(tasks, categories);
        UI.updateDailyProgress(Storage.getTasks(), stats.streak);
        UI.updateNaggingBanner(Storage.getTasks());
        initSortable();
    }

    // Re-render whichever page is active (used after mutations)
    function refreshCurrentPage() {
        if (activePage === 'dashboard') Dashboard.render();
        else if (activePage === 'todolist') renderTodolist();
        else if (activePage === 'calendar' && typeof CalendarUI !== 'undefined') CalendarUI.render();
        else if (activePage === 'history' && typeof TaskHistory !== 'undefined') TaskHistory.render();
    }

    function syncProgressPercentLabel() {
        const v = parseInt(taskProgressPercent.value, 10) || 0;
        taskProgressPercentLabel.textContent = `${v}%`;
    }

    function openTaskProgressModal(task, intent = 'progress') {
        taskProgressTaskId.value = task.id;
        taskProgressTaskName.textContent = task.title;
        const pct = intent === 'complete'
            ? (task.progressPercent > 0 ? task.progressPercent : 100)
            : (task.progressPercent || 0);
        taskProgressPercent.value = pct;
        syncProgressPercentLabel();
        taskProgressNote.value = task.progressNote || '';
        taskProgressModal.classList.remove('hidden');
        lucide.createIcons();
    }

    function closeTaskProgressModalFn() {
        taskProgressModal.classList.add('hidden');
        renderTodolist();
    }

    taskProgressPercent.addEventListener('input', syncProgressPercentLabel);
    closeTaskProgressModal.addEventListener('click', closeTaskProgressModalFn);

    taskProgressSaveBtn.addEventListener('click', () => {
        const id = taskProgressTaskId.value;
        const note = taskProgressNote.value.trim();
        const percent = parseInt(taskProgressPercent.value, 10) || 0;
        if (!note && percent === 0) {
            UI.showToast('Isi catatan progress atau geser persentase.', 'error');
            return;
        }
        UI.runOp('menyimpan progress', async () => {
            await Storage.saveTaskProgress(id, {
                action: percent >= 100 ? 'completed' : 'in_progress',
                note: note || `Progress ${percent}%`,
                progressPercent: percent
            });
            taskProgressModal.classList.add('hidden');
            refreshCurrentPage();
        }, 'Progress tugas disimpan.');
    });

    taskProgressCompleteBtn.addEventListener('click', () => {
        const id = taskProgressTaskId.value;
        const note = taskProgressNote.value.trim();
        const percent = parseInt(taskProgressPercent.value, 10) || 100;
        UI.runOp('menyelesaikan tugas', async () => {
            await Storage.saveTaskProgress(id, {
                action: 'completed',
                note: note || 'Tugas selesai',
                progressPercent: Math.max(percent, 100)
            });
            await Storage.checkAndUpdateStreak();
            taskProgressModal.classList.add('hidden');
            refreshCurrentPage();
        }, 'Tugas ditandai selesai.');
    });

    function getDefaultColumn({ priority, dueDate }) {
        const today = dayjs().startOf('day');
        if (priority === 'high') return 'focus';
        if (dueDate && dayjs(dueDate).isSame(today, 'day')) return 'focus';
        return 'todo';
    }

    async function handleKanbanDrop(evt) {
        const taskEl = evt.item;
        if (!taskEl.classList.contains('task-item')) return;

        const taskId = taskEl.dataset.id;
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('[ProDo] Gagal memindahkan tugas: tugas tidak ditemukan', taskId);
            return;
        }

        const toColumn = evt.to.id;

        if (toColumn === 'taskListDone') {
            openTaskProgressModal(task, 'complete');
            return;
        }

        let updates = {};
        let successMsg = 'Tugas dipindahkan.';

        if (toColumn === 'taskListImportant') {
            updates = { completed: false, column: 'focus', status: 'in_progress' };
            successMsg = 'Tugas dipindah ke Fokus / Hari Ini.';
        } else if (toColumn === 'taskListTodo') {
            updates = { completed: false, column: 'todo', status: 'todo' };
            successMsg = 'Tugas dipindah ke Belum Dimulai.';
        }

        UI.runOp('memindahkan tugas', async () => {
            await Storage.updateTask(task.id, updates);
            renderTodolist();
        }, successMsg);
    }

    function initSortable() {
        if (!window.Sortable) return;
        document.querySelectorAll('.task-column').forEach(el => {
            if (el._sortable) el._sortable.destroy();
            el._sortable = Sortable.create(el, {
                group: 'kanban',
                handle: '.task-handle',
                animation: 150,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                filter: '.kanban-empty',
                onAdd(evt) {
                    const empty = evt.to.querySelector('.kanban-empty');
                    if (empty) empty.remove();
                },
                onEnd(evt) {
                    if (evt.from !== evt.to) {
                        void handleKanbanDrop(evt);
                    }
                },
            });
        });
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    let editingTaskId = null;

    // ─── Task Form (Modal) ───────────────────────────────────────
    function populateTaskFormDropdowns() {
        const categories = Storage.getCategories();
        const targets    = Storage.getTargets();
        newTaskCategory.innerHTML = '<option value="">Tanpa Kategori</option>' +
            categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        newTaskTarget.innerHTML = '<option value="">Tidak ada target</option>' +
            targets.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }

    function openAddTaskModal() {
        editingTaskId = null;
        populateTaskFormDropdowns();
        document.getElementById('taskModalTitle').textContent = 'Tugas Baru';
        newTaskPriority.value = 'medium';
        newTaskDueDate.value  = dayjs().format('YYYY-MM-DD');
        setTaskDueDateMin();
        if (newTaskDueTime) newTaskDueTime.value = '';
        syncTaskDueTimeField();
        taskInput.value = '';
        addTaskModal.classList.remove('hidden');
        setTimeout(() => taskInput.focus(), 100);
    }

    function openEditTaskModal(task) {
        editingTaskId = task.id;
        populateTaskFormDropdowns();
        document.getElementById('taskModalTitle').textContent = 'Edit Tugas';
        taskInput.value       = task.title;
        newTaskCategory.value = task.categoryId || '';
        newTaskPriority.value = task.priority;
        newTaskDueDate.value  = task.dueDate || '';
        setTaskDueDateMin();
        if (newTaskDueTime) newTaskDueTime.value = task.dueTime || '';
        syncTaskDueTimeField();
        newTaskTarget.value   = task.targetId || '';
        addTaskModal.classList.remove('hidden');
        setTimeout(() => taskInput.focus(), 100);
    }

    openAddTaskBtn.addEventListener('click', openAddTaskModal);

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = taskInput.value.trim();
        if (!title) return;

        const dueDate = newTaskDueDate.value || null;
        const dueTime = getTaskDueTimeForSave(dueDate);
        const priority = newTaskPriority.value;

        if (dueDate && dueDate < dayjs().format('YYYY-MM-DD')) {
            UI.showToast('Jatuh tempo tidak boleh sebelum hari ini.', 'error');
            return;
        }

        if (editingTaskId) {
            const tasks = Storage.getTasks();
            const task = tasks.find(t => t.id === editingTaskId);
            if (!task) {
                console.error('[ProDo] Gagal memperbarui tugas: tugas tidak ditemukan', editingTaskId);
                return;
            }
            UI.runOp('memperbarui tugas', async () => {
                await Storage.updateTask(task.id, {
                    title,
                    categoryId: newTaskCategory.value || null,
                    priority,
                    dueDate,
                    dueTime,
                    targetId: newTaskTarget.value || null
                });
            }, 'Tugas berhasil diperbarui!');
        } else {
            UI.runOp('menambah tugas', () => Storage.addTask({
                title,
                categoryId: newTaskCategory.value || null,
                priority,
                dueDate,
                dueTime,
                targetId: newTaskTarget.value || null,
                column: getDefaultColumn({ priority, dueDate })
            }), 'Tugas berhasil ditambahkan!');
        }

        editingTaskId = null;
        addTaskModal.classList.add('hidden');
        if (activePage === 'todolist') {
            renderTodolist();
        } else {
            switchPage('todolist');
        }
    });

    // ─── Task Interactions (Delegated) ───────────────────────────
    pageTodolist.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.toggle-task-btn');
        const deleteBtn = e.target.closest('.delete-task-btn');
        const editBtn   = e.target.closest('.edit-task-btn');
        const progressBtn = e.target.closest('.task-progress-btn');

        if (progressBtn) {
            const task = Storage.getTasks().find(t => t.id === progressBtn.dataset.id);
            if (task) openTaskProgressModal(task, 'progress');
            return;
        }

        if (toggleBtn) {
            const tasks = Storage.getTasks();
            const task  = tasks.find(t => t.id === toggleBtn.dataset.id);
            if (!task) {
                console.error('[ProDo] Gagal mengubah status tugas: tugas tidak ditemukan', toggleBtn.dataset.id);
                return;
            }
            if (!task.completed) {
                openTaskProgressModal(task, 'complete');
                return;
            }
            UI.runOp('membuka kembali tugas', async () => {
                await Storage.saveTaskProgress(task.id, {
                    action: 'reopened',
                    note: 'Tugas dibuka kembali',
                    progressPercent: 0
                });
                refreshCurrentPage();
            }, 'Tugas dibuka kembali.');
        }

        if (deleteBtn) {
            UI.showConfirm('Yakin ingin menghapus tugas ini?', () => {
                UI.runOp('menghapus tugas', async () => {
                    await Storage.deleteTask(deleteBtn.dataset.id);
                    renderTodolist();
                }, 'Tugas dihapus.');
            });
        }

        if (editBtn) {
            const tasks = Storage.getTasks();
            const task  = tasks.find(t => t.id === editBtn.dataset.id);
            if (task) openEditTaskModal(task);
        }
    });

    // ─── Category Filter ─────────────────────────────────────────
    document.getElementById('categoryList').addEventListener('click', (e) => {
        const pill = e.target.closest('.category-pill');
        if (pill) { currentCategory = pill.dataset.id; renderTodolist(); }
    });

    function resetCategoryForm() {
        categoryIdInput.value = '';
        categoryNameInput.value = '';
        document.getElementById('categoryModalTitle').textContent = 'Kelola Kategori';
        UI.renderColorPicker();
    }

    function openCategoryModal() {
        resetCategoryForm();
        UI.renderCategoryManageList(Storage.getCategories());
        categoryModal.classList.remove('hidden');
        lucide.createIcons();
        setTimeout(() => categoryNameInput.focus(), 100);
    }

    function refreshAfterCategoryChange() {
        if (currentCategory !== 'all' && !Storage.getCategories().find(c => c.id === currentCategory)) {
            currentCategory = 'all';
        }
        if (activePage === 'todolist') renderTodolist();
        else if (activePage === 'dashboard') Dashboard.render();
    }

    openCategoryModalBtn.addEventListener('click', openCategoryModal);

    categoryColorPicker.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (!swatch) return;
        categoryColorInput.value = swatch.dataset.color;
        UI.renderColorPicker(swatch.dataset.color);
    });

    categoryColorWheel.addEventListener('input', (e) => {
        const hex = e.target.value;
        categoryColorInput.value = `hex:${hex}`;
        UI.renderColorPicker(`hex:${hex}`);
    });

    categoryNameInput.addEventListener('input', () => {
        if (!categoryModal.classList.contains('hidden')) {
            UI.renderColorPicker(categoryColorInput.value);
        }
    });

    categoryManageList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-category-btn');
        const deleteBtn = e.target.closest('.delete-category-btn');

        if (editBtn) {
            const cat = Storage.getCategories().find(c => c.id === editBtn.dataset.id);
            if (cat) {
                categoryIdInput.value = cat.id;
                categoryNameInput.value = cat.name;
                categoryColorInput.value = cat.color;
                document.getElementById('categoryModalTitle').textContent = 'Edit Kategori';
                UI.renderColorPicker(cat.color);
            }
        }

        if (deleteBtn) {
            const catId = deleteBtn.dataset.id;
            const cat = Storage.getCategories().find(c => c.id === catId);
            UI.showConfirm(`Yakin ingin menghapus kategori "${cat?.name || ''}"? Tugas terkait akan kehilangan kategorinya.`, () => {
                UI.runOp('menghapus kategori', async () => {
                    await Storage.deleteCategory(catId);
                    resetCategoryForm();
                    UI.renderCategoryManageList(Storage.getCategories());
                    refreshAfterCategoryChange();
                }, 'Kategori dihapus.');
            });
        }
    });

    categoryModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = categoryNameInput.value.trim();
        if (!name) return;

        const color = categoryColorInput.value || Storage.CATEGORY_COLORS[0].color;
        const id = categoryIdInput.value;

        if (id) {
            UI.runOp('memperbarui kategori', () => Storage.updateCategory({ id, name, color }), 'Kategori diperbarui!');
        } else {
            UI.runOp('menambah kategori', () => Storage.addCategory({ id: generateId(), name, color }), 'Kategori ditambahkan!');
        }

        resetCategoryForm();
        UI.renderCategoryManageList(Storage.getCategories());
        refreshAfterCategoryChange();
    });

    filterSelect.addEventListener('change', (e) => { currentFilter = e.target.value; renderTodolist(); });
    searchInput.addEventListener('input',  (e) => { searchQuery = e.target.value; renderTodolist(); });

    // ─── History Page ────────────────────────────────────────────
    document.getElementById('historyStatusFilters')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.history-filter-btn');
        if (!btn) return;
        document.querySelectorAll('.history-filter-btn').forEach((b) => {
            b.classList.remove('active-history-filter', 'bg-slate-800', 'text-white');
            b.classList.add('bg-slate-100', 'text-slate-600');
        });
        btn.classList.add('active-history-filter', 'bg-slate-800', 'text-white');
        btn.classList.remove('bg-slate-100', 'text-slate-600');
        TaskHistory.currentFilter = btn.dataset.status;
        TaskHistory.render();
    });

    historySearchInput?.addEventListener('input', (e) => {
        TaskHistory.searchQuery = e.target.value;
        TaskHistory.render();
    });

    pageHistory?.addEventListener('click', (e) => {
        const progressBtn = e.target.closest('.history-progress-btn');
        const logBtn = e.target.closest('.history-view-log-btn');
        if (progressBtn) {
            const task = Storage.getTasks().find(t => t.id === progressBtn.dataset.id);
            if (task) openTaskProgressModal(task, 'progress');
        }
        if (logBtn) TaskHistory.showLogModal(logBtn.dataset.id);
    });

    // ─── Targets ─────────────────────────────────────────────────
    addTargetBtn.addEventListener('click', () => {
        targetModalForm.reset();
        targetIdInput.value = '';
        targetNameInput.value = '';
        targetTypeInput.value = 'daily';
        targetProgressInput.value = '0';
        targetDeadlineInput.value = '';
        document.getElementById('targetModalTitle').textContent = 'Tambah Target';
        targetModal.classList.remove('hidden');
    });

    document.getElementById('targetList').addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-target-btn');
        const editBtn = e.target.closest('.edit-target-btn');

        if (deleteBtn) {
            UI.showConfirm('Yakin ingin menghapus target ini?', () => {
                UI.runOp('menghapus target', async () => {
                    await Storage.deleteTarget(deleteBtn.dataset.id);
                    renderTodolist();
                }, 'Target dihapus.');
            });
        }

        if (editBtn) {
            const targets = Storage.getTargets();
            const target = targets.find(t => t.id === editBtn.dataset.id);
            if (target) {
                document.getElementById('targetModalTitle').textContent = 'Edit Target';
                targetIdInput.value = target.id;
                targetNameInput.value = target.name;
                targetTypeInput.value = target.type;
                targetProgressInput.value = target.progress;
                targetDeadlineInput.value = target.deadline || '';
                targetModal.classList.remove('hidden');
            }
        }
    });

    targetModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = targetIdInput.value || generateId();
        const targetData = {
            id: id || generateId(),
            name: targetNameInput.value.trim(),
            type: targetTypeInput.value,
            progress: parseInt(targetProgressInput.value, 10),
            deadline: targetDeadlineInput.value || null
        };
        if (targetIdInput.value) {
            UI.runOp('memperbarui target', () => Storage.updateTarget(targetData), 'Target disimpan!');
        } else {
            UI.runOp('menambah target', () => Storage.addTarget(targetData), 'Target disimpan!');
        }

        targetModal.classList.add('hidden');
        renderTodolist();
    });

    // ─── Activity Interactions ───────────────────────────────────
    openAddActivityBtn.addEventListener('click', () => {
        activityModalTitle.textContent = 'Tambah Kegiatan';
        activityIdInput.value = '';
        activityNameInput.value = '';
        activityStartDate.value = dayjs().format('YYYY-MM-DD');
        activityEndDate.value = '';
        deleteActivityBtn.classList.add('hidden');
        activityModal.classList.remove('hidden');
    });

    activityModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = activityNameInput.value.trim();
        const start = activityStartDate.value;
        const end = activityEndDate.value || null;
        if (!name || !start) return;

        const id = activityIdInput.value;
        const activityData = {
            id: id || generateId(),
            name,
            start,
            end
        };

        if (id) {
            UI.runOp('memperbarui kegiatan', () => Storage.updateActivity(activityData), 'Kegiatan diperbarui!');
        } else {
            UI.runOp('menambah kegiatan', () => Storage.addActivity(activityData), 'Kegiatan ditambahkan!');
        }

        activityModal.classList.add('hidden');
        refreshCurrentPage();
    });

    deleteActivityBtn.addEventListener('click', () => {
        const id = activityIdInput.value;
        if (id) {
            UI.showConfirm('Yakin ingin menghapus kegiatan ini?', () => {
                UI.runOp('menghapus kegiatan', async () => {
                    await Storage.deleteActivity(id);
                    activityModal.classList.add('hidden');
                    refreshCurrentPage();
                }, 'Kegiatan dihapus.');
            });
        }
    });

    // Delegated events for calendar activities will be handled in calendar.js via CalendarUI

    // ─── App Settings & Export ───────────────────────────────────────────
    exportImportBtn.addEventListener('click', () => {
        if (!Storage.isLoggedIn()) return;
        const s = Storage.getTgSettings();
        tgBotTokenInput.value = s.botToken;
        tgChatIdInput.value   = s.chatId;
        settingsModal.classList.remove('hidden');
    });

    saveTgSettingsBtn.addEventListener('click', () => {
        UI.runOp('menyimpan pengaturan Telegram', () =>
            Storage.saveTelegramSettings({
                botToken: tgBotTokenInput.value.trim(),
                chatId: tgChatIdInput.value.trim()
            }), 'Pengaturan Telegram berhasil disimpan!');
    });

    openTestTgBtn.addEventListener('click', () => {
        testTgModal.classList.remove('hidden');
    });

    sendTgTestBtn.addEventListener('click', async () => {
        const msg = tgTestMessage.value.trim() || 'Halo! Ini pesan tes.';
        const originalHTML = sendTgTestBtn.innerHTML;
        sendTgTestBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Mengirim...';
        sendTgTestBtn.disabled = true;
        lucide.createIcons();

        await Storage.saveTelegramSettings({
            botToken: tgBotTokenInput.value.trim(),
            chatId: tgChatIdInput.value.trim()
        });
        const result = await AppNotifications.notify(msg);

        sendTgTestBtn.innerHTML = originalHTML;
        sendTgTestBtn.disabled = false;
        lucide.createIcons();

        if (result.success) {
            UI.showToast('Pesan berhasil terkirim ke Telegram!');
            testTgModal.classList.add('hidden');
        } else {
            console.error('[ProDo] Gagal mengirim pesan Telegram:', result);
            UI.showToast(`Gagal: ${result.message || 'Periksa Token & Chat ID!'}`, 'error');
        }
    });

    closeModals.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('div.fixed').classList.add('hidden');
        });
    });

    closeNaggingBtn.addEventListener('click', () => naggingBanner.classList.add('hidden'));

    exportDataBtn.addEventListener('click', () => {
        UI.runOp('export data', async () => {
            const data = await Storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prodo-backup-${dayjs().format('YYYY-MM-DD')}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'Export dimulai. File sedang diunduh.');
    });

    importDataInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            UI.runOp('import data', async () => {
                try {
                    const data = typeof ev.target.result === 'string'
                        ? JSON.parse(ev.target.result)
                        : ev.target.result;
                    await Storage.importData(data);
                    refreshCurrentPage();
                    settingsModal.classList.add('hidden');
                } catch (err) {
                    console.error('[ProDo] Import gagal:', err);
                    UI.showToast('Format file JSON tidak valid.', 'error');
                    throw err;
                }
            }, 'Data berhasil diimpor!');
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    clearDataBtn.addEventListener('click', () => {
        UI.showConfirm('PERINGATAN! Semua data akun yang sedang login (tugas, target, kategori, kegiatan, pengaturan) akan dihapus permanen. Akun lain tidak terpengaruh. Lanjutkan?', () => {
            UI.runOp('menghapus semua data', async () => {
                await Storage.clearAll();
                refreshCurrentPage();
                settingsModal.classList.add('hidden');
            }, 'Semua data berhasil dihapus.');
        });
    });

    // ─── Boot ────────────────────────────────────────────────────
    await checkAuthState();
});
