let currentScreen = 'page1';

// Bảo vệ chuỗi HTML
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

// Tính số ngày còn lại tới target_date
function daysLeft() {
    const parts = (config.target_date || "").split("-");
    if (parts.length !== 3) return "?";
    const target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? "?" : (diff >= 0 ? diff : 0);
}

// Tính thống kê Task (Hôm nay, Tuần này, Tháng này, Tất cả)
function getTaskStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = (today.getDay() + 6) % 7; // Thứ 2 = 0 ... Chủ nhật = 6
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    let doneToday = 0, doneWeek = 0, doneMonth = 0, doneTotal = 0;

    for (const t of tasks) {
        if (!t.done) continue;
        doneTotal++;
        const parts = (t.date || "").split("-");
        if (parts.length === 3) {
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (d.getTime() === today.getTime()) doneToday++;
            if (d >= weekStart) doneWeek++;
            if (d >= monthStart) doneMonth++;
        }
    }
    return { doneToday, doneWeek, doneMonth, doneTotal };
}

// Vẽ 4 ô thống kê ở Trang 1
function renderStatsCards() {
    const { doneToday, doneWeek, doneMonth, doneTotal } = getTaskStats();
    const aimWeek = config.aim_week || 20;
    const aimMonth = config.aim_month || 80;

    function buildCard(title, done, total, isGoal) {
        let innerHtml = '';
        if (isGoal) {
            const pct = total > 0 ? Math.min(done / total, 1.0) : 0;
            const filled = Math.floor(pct * 20);
            const bar = `<span class="text-magenta">${'┃'.repeat(filled)}</span><span class="text-dim">${'┃'.repeat(20 - filled)}</span>`;
            innerHtml = `
                <div class="text-cyan bold">${done}/${total}</div>
                <div class="progress-bar-ascii">${bar}</div>
            `;
        } else {
            innerHtml = `<div class="text-cyan bold">${done} completed</div>`;
        }
        return `
            <div class="panel border-yellow stat-card">
                <div class="panel-label text-cyan">${title}</div>
                ${innerHtml}
            </div>
        `;
    }

    document.getElementById('p1-stats-grid').innerHTML =
        buildCard("TODAY", doneToday, 1, false) +
        buildCard("THIS WEEK", doneWeek, aimWeek, true) +
        buildCard("THIS MONTH", doneMonth, aimMonth, true) +
        buildCard("ALL TIME", doneTotal, doneTotal, false);
}

// Cập nhật đồng hồ thực tế trên Trang 1
function updateClock() {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-GB', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }).replace(',', ' •').toUpperCase();
    const timeFormatted = now.toTimeString().split(' ')[0];

    document.getElementById('p1-title').textContent = config.title;
    document.getElementById('p1-version').textContent = `v${VERSION}`;
    document.getElementById('p1-date').textContent = dateFormatted;
    document.getElementById('p1-clock').textContent = timeFormatted;
}

// Chuyển đổi giữa các màn hình
function switchScreen(screenName) {
    currentScreen = screenName;
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(`screen-${screenName}`).classList.add('active');

    const outerFrame = document.getElementById('outer-frame');
    outerFrame.className = 'panel border-cyan main-frame';

    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    if (screenName === 'page1') {
        document.getElementById('frame-title-left').textContent = "";
        document.getElementById('frame-title-right').textContent = `${daysLeft()} days until ${config.target_date}`;
        document.getElementById('p1-quote').textContent = randomQuote;
        updateClock();
        renderStatsCards();
    } else if (screenName === 'page2') {
        document.getElementById('frame-title-left').textContent = config.title;
        document.getElementById('frame-title-right').textContent = `${daysLeft()} days until ${config.target_date}`;
        document.getElementById('p2-quote').textContent = randomQuote;
        renderQuickTaskList();
    } else if (screenName === 'calendar') {
        document.getElementById('frame-title-left').textContent = "LỊCH TUẦN";
        document.getElementById('frame-title-right').textContent = `${daysLeft()} days until ${config.target_date}`;
        renderWeeklyCalendar();
    }
}

// Hiển thị danh sách công việc ở Trang 2
function renderQuickTaskList() {
    const container = document.getElementById('quick-task-list');
    const sorted = getSortedTasks();
    if (sorted.length === 0) {
        container.innerHTML = `<div class="text-dim">Chưa có task nào. Nhấn phím [1] để thêm mới!</div>`;
        return;
    }

    container.innerHTML = sorted.map((t, idx) => {
        const realIdx = tasks.indexOf(t);
        const icon = t.done ? '[v]' : '[ ]';
        return `
            <div class="task-row ${t.done ? 'done' : ''}">
                <div>
                    <span class="text-dim">${idx + 1}.</span>
                    <span class="${t.done ? 'text-green' : 'text-cyan'}">${icon}</span>
                    <span class="task-title">${escapeHtml(t.name)}</span>
                    <span class="text-dim">(${t.date} ${t.time})</span>
                </div>
                <div class="task-actions">
                    <button title="Tick/Bỏ tick" onclick="quickToggle(${realIdx})">✓</button>
                    <button title="Focus" onclick="quickFocus(${realIdx})">▶</button>
                    <button title="Sửa" onclick="quickEdit(${realIdx})">✎</button>
                    <button title="Xoá" class="text-red" onclick="quickDelete(${realIdx})">✕</button>
                </div>
            </div>
        `;
    }).join('');
}

function quickToggle(realIdx) {
    tasks[realIdx].done = !tasks[realIdx].done;
    saveTasks();
    renderQuickTaskList();
}

function quickFocus(realIdx) {
    beginFocusMode(tasks[realIdx]);
}

function quickEdit(realIdx) {
    const t = tasks[realIdx];
    openModal(
        "Sửa tên Task",
        `<div class="form-field">
            <label>Tên mới cho '${escapeHtml(t.name)}':</label>
            <input type="text" id="inp-edit-name" value="${escapeHtml(t.name)}">
        </div>`,
        [
            { text: "Huỷ", action: closeModal },
            {
                text: "Lưu", action: () => {
                    const val = document.getElementById('inp-edit-name').value.trim();
                    if (val) {
                        t.name = val;
                        saveTasks();
                        closeModal();
                        renderQuickTaskList();
                    }
                }
            }
        ]
    );
}

function quickDelete(realIdx) {
    const t = tasks[realIdx];
    openModal(
        "Xác nhận xoá",
        `<div class="text-red">Bạn có chắc muốn xoá task <b>'${escapeHtml(t.name)}'</b>?</div>`,
        [
            { text: "Huỷ", action: closeModal },
            {
                text: "Xoá", action: () => {
                    tasks.splice(realIdx, 1);
                    saveTasks();
                    closeModal();
                    renderQuickTaskList();
                }
            }
        ]
    );
}

// Hiển thị Lịch tuần 7 ngày (4 cột x 2 hàng giống show_weekly_calendar)
function renderWeeklyCalendar() {
    const grid = document.getElementById('calendar-grid');
    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Sat"];
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    let html = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;
        const dispDate = `${dd}/${mm}/${yyyy}`;
        const dayLabel = dayNames[d.getDay()];

        const dayTasks = tasks
            .filter(t => t.date === isoDate)
            .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));

        let contentHtml = '';
        if (dayTasks.length === 0) {
            contentHtml = `<div>Không có task nào.</div><div class="text-dim">Trống (Nghỉ ngơi)</div>`;
        } else {
            contentHtml = dayTasks.map(t => {
                const status = t.done ? `<span class="text-green">[v]</span>` : `<span class="text-cyan">[ ]</span>`;
                return `<div>${status} ${escapeHtml(t.name)} <span class="text-dim">(${t.time})</span></div>`;
            }).join('');
        }

        html += `
            <div class="panel border-gray cal-cell">
                <div class="panel-label text-yellow bold">[${dayLabel} ${dispDate}]</div>
                <div style="margin-top: 8px;">${contentHtml}</div>
            </div>
        `;
    }
    // Ô thứ 8 trống giống bản gốc Python
    html += `<div class="panel border-gray cal-cell"></div>`;
    grid.innerHTML = html;
}

// ==================== HỆ THỐNG MODAL CRUD ====================
function openModal(title, bodyHtml, buttons) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';
    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.className = 'btn-Action';
        b.textContent = btn.text;
        b.onclick = btn.action;
        footer.appendChild(b);
    });
    document.getElementById('modal-overlay').classList.remove('hidden');
    const firstInput = document.querySelector('#modal-body input');
    if (firstInput) firstInput.focus();
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function showInfoModal(title, htmlContent, onClose) {
    openModal(title, htmlContent, [{
        text: "Đóng [Enter]",
        action: () => {
            closeModal();
            if (onClose) onClose();
        }
    }]);
}

// 1. Thêm Task
function openAddTaskModal() {
    openModal(
        "1 [+] Thêm Task Mới",
        `<div class="form-field">
            <label>Tên task mới:</label>
            <input type="text" id="inp-task-name" placeholder="Nhập tên công việc...">
        </div>
        <div class="form-field">
            <label>Ngày (YYYY-MM-DD):</label>
            <input type="date" id="inp-task-date" value="${getTodayStr()}">
        </div>
        <div class="form-field">
            <label>Giờ (HH:MM):</label>
            <input type="time" id="inp-task-time" value="${getCurrentTimeStr()}">
        </div>`,
        [
            { text: "Huỷ", action: closeModal },
            {
                text: "Thêm Task", action: () => {
                    const name = document.getElementById('inp-task-name').value.trim();
                    const date = document.getElementById('inp-task-date').value || getTodayStr();
                    const time = document.getElementById('inp-task-time').value || getCurrentTimeStr();
                    if (!name) return alert("Tên task không được để trống!");
                    tasks.push({ name, done: false, date, time });
                    saveTasks();
                    closeModal();
                    switchScreen('page2');
                }
            }
        ]
    );
}

// 2, 3, 4, 8: Chọn số thứ tự Task để thao tác
function openTaskListModal(mode) {
    const sorted = getSortedTasks();
    if (sorted.length === 0) {
        return showInfoModal("Thông báo", `<div class="text-yellow">Chưa có task nào trong danh sách!</div>`);
    }

    const titles = {
        toggle: "2 [v] Chọn số Task cần Tick/Bỏ tick",
        delete: "3 [x] Chọn số Task cần Xoá",
        edit: "4 [/] Chọn số Task cần Sửa",
        focus: "8 [>] Chọn Task để bắt đầu Focus"
    };

    const listHtml = sorted.map((t, i) =>
        `<div><span class="text-dim">${i + 1}.</span> [${t.done ? 'v' : ' '}] ${escapeHtml(t.name)}</div>`
    ).join('');

    openModal(
        titles[mode],
        `<div style="max-height:180px; overflow-y:auto; margin-bottom:12px;">${listHtml}</div>
         <div class="form-field">
            <label>Nhập số thứ tự (1 - ${sorted.length}):</label>
            <input type="number" id="inp-task-idx" min="1" max="${sorted.length}" value="1">
         </div>`,
        [
            { text: "Huỷ", action: closeModal },
            {
                text: "Xác nhận", action: () => {
                    const idx = parseInt(document.getElementById('inp-task-idx').value, 10) - 1;
                    if (isNaN(idx) || idx < 0 || idx >= sorted.length) {
                        return alert("Số thứ tự không hợp lệ!");
                    }
                    const realIdx = tasks.indexOf(sorted[idx]);
                    closeModal();
                    if (mode === 'toggle') quickToggle(realIdx);
                    else if (mode === 'delete') quickDelete(realIdx);
                    else if (mode === 'edit') quickEdit(realIdx);
                    else if (mode === 'focus') quickFocus(realIdx);
                }
            }
        ]
    );
}

// 5. Đổi Title
function openTitleModal() {
    openModal(
        "5 [#] Đổi Title",
        `<div class="form-field">
            <label>Title mới:</label>
            <input type="text" id="inp-new-title" value="${escapeHtml(config.title)}">
        </div>`,
        [
            { text: "Huỷ", action: closeModal },
            {
                text: "Cập nhật", action: () => {
                    const val = document.getElementById('inp-new-title').value.trim();
                    if (val) {
                        config.title = val;
                        saveConfig();
                        closeModal();
                        switchScreen(currentScreen);
                    }
                }
            }
        ]
    );
}

// 6. Đổi ngày mục tiêu
function openDateModal() {
    openModal(
        "6 [@] Đổi Ngày Mục Tiêu",
        `<div class="form-field">
            <label>Ngày mục tiêu (YYYY-MM-DD):</label>
            <input type="date" id="inp-target-date" value="${config.target_date}">
        </div>`,
        [
            { text: "Huỷ", action: closeModal },
            {
                text: "Cập nhật", action: () => {
                    const val = document.getElementById('inp-target-date').value;
                    if (val) {
                        config.target_date = val;
                        saveConfig();
                        closeModal();
                        switchScreen(currentScreen);
                    }
                }
            }
        ]
    );
}

// 9. Đặt Aim tuần/tháng
function openAimModal() {
    openModal(
        "9 [%] Đặt Aim Tuần / Tháng",
        `<div class="form-field">
            <label>Aim tuần hiện tại (${config.aim_week}):</label>
            <input type="number" id="inp-aim-week" min="1" value="${config.aim_week}">
        </div>
        <div class="form-field">
            <label>Aim tháng hiện tại (${config.aim_month}):</label>
            <input type="number" id="inp-aim-month" min="1" value="${config.aim_month}">
        </div>`,
        [
            { text: "Huỷ", action: closeModal },
            {
                text: "Lưu Aim", action: () => {
                    const w = parseInt(document.getElementById('inp-aim-week').value, 10);
                    const m = parseInt(document.getElementById('inp-aim-month').value, 10);
                    if (w > 0) config.aim_week = w;
                    if (m > 0) config.aim_month = m;
                    saveConfig();
                    closeModal();
                    switchScreen(currentScreen);
                }
            }
        ]
    );
}

// Xuất / Nhập file JSON để đồng bộ với bản Python
function exportData() {
    const dataStr = JSON.stringify({ config, tasks }, null, 4);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyOS_Backup_${getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (Array.isArray(parsed)) {
                tasks = parsed;
                saveTasks();
            } else if (parsed.tasks || parsed.config) {
                if (parsed.config) { config = parsed.config; saveConfig(); }
                if (parsed.tasks) { tasks = parsed.tasks; saveTasks(); }
            }
            switchScreen(currentScreen);
            alert("Đã nhập dữ liệu JSON thành công!");
        } catch {
            alert("File JSON không hợp lệ!");
        }
    };
    reader.readAsText(file);
}

// Lắng nghe phím tắt bàn phím giống hệt bản Console
document.addEventListener('keydown', e => {
    const modalOpen = !document.getElementById('modal-overlay').classList.contains('hidden');
    if (modalOpen) {
        if (e.key === 'Escape') closeModal();
        return;
    }

    const key = e.key.toLowerCase();
    if (currentScreen === 'page1') {
        if (key === 's') switchScreen('page2');
        else if (key === '9') openAimModal();
    } else if (currentScreen === 'page2') {
        if (key === 's') switchScreen('page1');
        else if (key === '1') openAddTaskModal();
        else if (key === '2') openTaskListModal('toggle');
        else if (key === '3') openTaskListModal('delete');
        else if (key === '4') openTaskListModal('edit');
        else if (key === '5') openTitleModal();
        else if (key === '6') openDateModal();
        else if (key === '7') switchScreen('calendar');
        else if (key === '8') openTaskListModal('focus');
        else if (key === '9') openAimModal();
    } else if (currentScreen === 'calendar') {
        if (e.key === 'Enter' || e.key === 'Escape' || key === 's') switchScreen('page2');
    } else if (currentScreen === 'focus') {
        if (key === '1') finishFocusSession(true);
        else if (key === '2') togglePauseFocus();
        else if (key === '0') finishFocusSession(false);
    }
});

// Khởi chạy đồng hồ mỗi giây và mở Trang 1
setInterval(() => {
    if (currentScreen === 'page1') updateClock();
}, 1000);

window.onload = () => switchScreen('page1');