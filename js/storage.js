// js/storage.js

const Storage = {
    KEYS_BASE: {
        TASKS: 'prodo_tasks',
        TARGETS: 'prodo_targets',
        CATEGORIES: 'prodo_categories',
        STATS: 'prodo_stats',
        TG_SETTINGS: 'prodo_tg_settings',
        ACTIVITIES: 'prodo_activities'
    },
    USERS_KEY: 'prodo_users',
    CURRENT_USER_KEY: 'prodo_current_user',
    currentUser: null,

    KEYS: {}, // dynamically generated based on currentUser

    DEFAULT_CATEGORIES: [
        { id: 'cat_work', name: 'Pekerjaan', color: 'bg-blue-100 text-blue-700 ring-blue-400' },
        { id: 'cat_personal', name: 'Pribadi', color: 'bg-emerald-100 text-emerald-700 ring-emerald-400' },
        { id: 'cat_health', name: 'Kesehatan', color: 'bg-pink-100 text-pink-700 ring-pink-400' }
    ],

    CATEGORY_COLORS: [
        { id: 'blue', label: 'Biru', hex: '#2563eb', color: 'bg-blue-100 text-blue-700 ring-blue-400' },
        { id: 'emerald', label: 'Hijau', hex: '#059669', color: 'bg-emerald-100 text-emerald-700 ring-emerald-400' },
        { id: 'pink', label: 'Pink', hex: '#db2777', color: 'bg-pink-100 text-pink-700 ring-pink-400' },
        { id: 'amber', label: 'Kuning', hex: '#d97706', color: 'bg-amber-100 text-amber-700 ring-amber-400' },
        { id: 'purple', label: 'Ungu', hex: '#9333ea', color: 'bg-purple-100 text-purple-700 ring-purple-400' },
        { id: 'cyan', label: 'Cyan', hex: '#0891b2', color: 'bg-cyan-100 text-cyan-700 ring-cyan-400' },
        { id: 'rose', label: 'Merah', hex: '#e11d48', color: 'bg-rose-100 text-rose-700 ring-rose-400' },
        { id: 'indigo', label: 'Indigo', hex: '#4f46e5', color: 'bg-indigo-100 text-indigo-700 ring-indigo-400' }
    ],

    DEFAULT_STATS: {
        streak: 0,
        lastCompletedDate: null
    },

    init() {
        this.currentUser = localStorage.getItem(this.CURRENT_USER_KEY);
        if (this.currentUser) {
            this.setKeysForUser(this.currentUser);
            this.initUserData();
        }
    },

    setKeysForUser(username) {
        this.KEYS = {
            TASKS: `${this.KEYS_BASE.TASKS}_${username}`,
            TARGETS: `${this.KEYS_BASE.TARGETS}_${username}`,
            CATEGORIES: `${this.KEYS_BASE.CATEGORIES}_${username}`,
            STATS: `${this.KEYS_BASE.STATS}_${username}`,
            TG_SETTINGS: `${this.KEYS_BASE.TG_SETTINGS}_${username}`,
            ACTIVITIES: `${this.KEYS_BASE.ACTIVITIES}_${username}`
        };
    },

    initUserData() {
        if (!localStorage.getItem(this.KEYS.CATEGORIES)) {
            this.saveCategories(this.DEFAULT_CATEGORIES);
        }
        if (!localStorage.getItem(this.KEYS.STATS)) {
            this.saveStats(this.DEFAULT_STATS);
        }
        if (!localStorage.getItem(this.KEYS.TASKS)) {
            this.saveTasks([]);
        }
        if (!localStorage.getItem(this.KEYS.TARGETS)) {
            this.saveTargets([]);
        }
        if (!localStorage.getItem(this.KEYS.ACTIVITIES)) {
            this.saveActivities([]);
        }
    },

    // --- Authentication ---
    getUsers() {
        return JSON.parse(localStorage.getItem(this.USERS_KEY) || '{}');
    },
    registerUser(username, password) {
        const users = this.getUsers();
        if (users[username]) return false; // Username exists
        users[username] = { password }; // simple plain text for local demo
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        return true;
    },
    loginUser(username, password) {
        const users = this.getUsers();
        if (users[username] && users[username].password === password) {
            localStorage.setItem(this.CURRENT_USER_KEY, username);
            this.currentUser = username;
            this.setKeysForUser(username);
            this.initUserData();
            return true;
        }
        return false;
    },
    logoutUser() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
        this.currentUser = null;
        this.KEYS = {};
    },
    isLoggedIn() {
        return !!this.currentUser;
    },

    // --- Tasks ---
    getTasks() {
        return JSON.parse(localStorage.getItem(this.KEYS.TASKS) || '[]');
    },
    saveTasks(tasks) {
        localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
    },
    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);
        this.syncTargetProgress();
    },
    updateTask(updatedTask) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            tasks[index] = updatedTask;
            this.saveTasks(tasks);
            this.syncTargetProgress();
        }
    },
    deleteTask(taskId) {
        const tasks = this.getTasks();
        const newTasks = tasks.filter(t => t.id !== taskId);
        this.saveTasks(newTasks);
        this.syncTargetProgress();
    },

    // --- Targets ---
    getTargets() {
        return JSON.parse(localStorage.getItem(this.KEYS.TARGETS) || '[]');
    },
    saveTargets(targets) {
        localStorage.setItem(this.KEYS.TARGETS, JSON.stringify(targets));
    },
    addTarget(target) {
        const targets = this.getTargets();
        targets.push(target);
        this.saveTargets(targets);
    },
    updateTarget(updatedTarget) {
        const targets = this.getTargets();
        const index = targets.findIndex(t => t.id === updatedTarget.id);
        if (index !== -1) {
            targets[index] = updatedTarget;
            this.saveTargets(targets);
        }
    },
    deleteTarget(targetId) {
        const targets = this.getTargets();
        const newTargets = targets.filter(t => t.id !== targetId);
        this.saveTargets(newTargets);
        
        // Remove target reference from tasks
        const tasks = this.getTasks();
        let changed = false;
        tasks.forEach(t => {
            if (t.targetId === targetId) {
                t.targetId = null;
                changed = true;
            }
        });
        if(changed) this.saveTasks(tasks);
    },
    syncTargetProgress() {
        const targets = this.getTargets();
        const tasks = this.getTasks();
        
        let changed = false;
        targets.forEach(target => {
            const relatedTasks = tasks.filter(t => t.targetId === target.id);
            if (relatedTasks.length > 0) {
                const completedCount = relatedTasks.filter(t => t.completed).length;
                const percent = Math.round((completedCount / relatedTasks.length) * 100);
                if (target.progress !== percent) {
                    target.progress = percent;
                    changed = true;
                }
            }
        });

        if (changed) {
            this.saveTargets(targets);
        }
    },

    // --- Activities ---
    getActivities() {
        return JSON.parse(localStorage.getItem(this.KEYS.ACTIVITIES) || '[]');
    },
    saveActivities(activities) {
        localStorage.setItem(this.KEYS.ACTIVITIES, JSON.stringify(activities));
    },
    addActivity(activity) {
        const activities = this.getActivities();
        activities.push(activity);
        this.saveActivities(activities);
    },
    updateActivity(updatedActivity) {
        const activities = this.getActivities();
        const index = activities.findIndex(a => a.id === updatedActivity.id);
        if (index !== -1) {
            activities[index] = updatedActivity;
            this.saveActivities(activities);
        }
    },
    deleteActivity(activityId) {
        const activities = this.getActivities();
        const newActivities = activities.filter(a => a.id !== activityId);
        this.saveActivities(newActivities);
    },

    // --- Categories ---
    getCategories() {
        return JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES) || '[]');
    },
    saveCategories(categories) {
        localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
    },
    addCategory(category) {
        const categories = this.getCategories();
        categories.push(category);
        this.saveCategories(categories);
    },
    updateCategory(updatedCategory) {
        const categories = this.getCategories();
        const index = categories.findIndex(c => c.id === updatedCategory.id);
        if (index !== -1) {
            categories[index] = updatedCategory;
            this.saveCategories(categories);
        }
    },
    deleteCategory(categoryId) {
        const categories = this.getCategories().filter(c => c.id !== categoryId);
        this.saveCategories(categories);

        const tasks = this.getTasks();
        let changed = false;
        tasks.forEach(t => {
            if (t.categoryId === categoryId) {
                t.categoryId = null;
                changed = true;
            }
        });
        if (changed) this.saveTasks(tasks);
    },

    // --- Stats & Streak ---
    getStats() {
        return JSON.parse(localStorage.getItem(this.KEYS.STATS) || JSON.stringify(this.DEFAULT_STATS));
    },
    saveStats(stats) {
        localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
    },
    checkAndUpdateStreak() {
        const stats = this.getStats();
        const todayStr = dayjs().format('YYYY-MM-DD');
        
        if (stats.lastCompletedDate) {
            const lastDate = dayjs(stats.lastCompletedDate);
            const today = dayjs(todayStr);
            const diffDays = today.diff(lastDate, 'day');

            if (diffDays === 1) {
                // Consecutive day
                stats.streak += 1;
                stats.lastCompletedDate = todayStr;
            } else if (diffDays > 1) {
                // Streak broken
                stats.streak = 1;
                stats.lastCompletedDate = todayStr;
            }
            // if diffDays === 0, already completed a task today, do nothing to streak
        } else {
            // First time completing a task
            stats.streak = 1;
            stats.lastCompletedDate = todayStr;
        }
        
        this.saveStats(stats);
        return stats.streak;
    },

    // --- Telegram Settings ---
    getTgSettings() {
        return JSON.parse(localStorage.getItem(this.KEYS.TG_SETTINGS) || '{"botToken":"","chatId":""}');
    },
    saveTgSettings(settings) {
        localStorage.setItem(this.KEYS.TG_SETTINGS, JSON.stringify(settings));
    },

    // --- Export / Import ---
    exportData() {
        const data = {
            tasks: this.getTasks(),
            targets: this.getTargets(),
            categories: this.getCategories(),
            stats: this.getStats(),
            activities: this.getActivities(),
            version: '1.0',
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prodo_backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.tasks) this.saveTasks(data.tasks);
            if (data.targets) this.saveTargets(data.targets);
            if (data.categories) this.saveCategories(data.categories);
            if (data.stats) this.saveStats(data.stats);
            if (data.activities) this.saveActivities(data.activities);
            return true;
        } catch (e) {
            console.error("Import failed:", e);
            return false;
        }
    },
    clearAll() {
        localStorage.removeItem(this.KEYS.TASKS);
        localStorage.removeItem(this.KEYS.TARGETS);
        localStorage.removeItem(this.KEYS.CATEGORIES);
        localStorage.removeItem(this.KEYS.STATS);
        localStorage.removeItem(this.KEYS.TG_SETTINGS);
        localStorage.removeItem(this.KEYS.ACTIVITIES);
        this.init();
    }
};
