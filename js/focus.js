let focusInterval = null;
let focusTaskRef = null;
let focusStartTime = 0;
let focusTotalPaused = 0;
let focusPauseStart = 0;
let focusIsPaused = false;
let focusTick = 0;

function renderBigTimer(timerStr) {
    const rows = ['', '', '', '', ''];
    for (const ch of timerStr) {
        const glyph = DIGITS[ch] || ['     ', '     ', '     ', '     ', '     '];
        for (let i = 0; i < 5; i++) {
            rows[i] += glyph[i] + '  ';
        }
    }
    return rows.join('\n');
}

function beginFocusMode(taskObj) {
    focusTaskRef = taskObj;
    focusStartTime = Date.now();
    focusTotalPaused = 0;
    focusPauseStart = 0;
    focusIsPaused = false;
    focusTick = 0;

    switchScreen('focus');
    updateFocusUI();

    if (focusInterval) clearInterval(focusInterval);
    focusInterval = setInterval(() => {
        updateFocusUI();
        if (!focusIsPaused) focusTick++;
    }, 250);
}

function getFocusElapsedSeconds() {
    const now = focusIsPaused ? focusPauseStart : Date.now();
    return Math.max(0, Math.floor((now - focusStartTime - focusTotalPaused) / 1000));
}

function formatHMS(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateFocusUI() {
    const elapsed = getFocusElapsedSeconds();
    const timerStr = formatHMS(elapsed);
    const hours = Math.floor(elapsed / 3600);

    // Đổi màu khung theo số giờ tập trung (0h: cyan, <2h: yellow, >=2h: red)
    const colorClass = hours === 0 ? 'text-cyan' : (hours < 2 ? 'text-yellow' : 'text-red');
    const borderClass = hours === 0 ? 'border-cyan' : (hours < 2 ? 'border-yellow' : 'border-red');

    const outerFrame = document.getElementById('outer-frame');
    outerFrame.className = `panel ${borderClass} main-frame`;

    const spinner = focusIsPaused ? "||" : SPINNERS[focusTick % 4];
    const ornament = focusIsPaused ? "||" : ORNAMENTS[focusTick % 4];
    let wave = "";
    if (focusIsPaused) {
        wave = "       [ P A U S E D ]       ";
    } else {
        const waveArr = [];
        for (let i = 0; i < 22; i++) {
            waveArr.push(WAVE_SEQ[(i + focusTick) % 4]);
        }
        wave = waveArr.join('  ');
    }

    document.getElementById('frame-title-left').textContent = `F O C U S  S E S S I O N  [${spinner}]`;
    document.getElementById('frame-title-right').textContent = "";
    document.getElementById('focus-ornament').textContent = ornament;

    const timerEl = document.getElementById('focus-ascii-timer');
    timerEl.className = `ascii-timer ${colorClass}`;
    timerEl.textContent = renderBigTimer(timerStr);

    document.getElementById('focus-task-name').textContent = focusTaskRef ? focusTaskRef.name : "";
    document.getElementById('focus-wave').textContent = wave;
}

function togglePauseFocus() {
    focusIsPaused = !focusIsPaused;
    if (focusIsPaused) {
        focusPauseStart = Date.now();
    } else {
        focusTotalPaused += (Date.now() - focusPauseStart);
    }
    updateFocusUI();
}

function finishFocusSession(markDone) {
    if (focusInterval) {
        clearInterval(focusInterval);
        focusInterval = null;
    }
    const finalTimeStr = formatHMS(getFocusElapsedSeconds());

    if (markDone && focusTaskRef) {
        focusTaskRef.done = true;
        saveTasks();
        showInfoModal(
            "Kết quả Focus",
            `<div class="text-green bold mb-2">[V] Hoàn thành!</div>
             <div>Task: <span class="text-cyan">${escapeHtml(focusTaskRef.name)}</span></div>
             <div>Thời gian: <span class="text-yellow">${finalTimeStr}</span></div>`,
            () => switchScreen('page2')
        );
    } else {
        showInfoModal(
            "Đã dừng Focus",
            `<div class="text-dim">Đã hủy phiên. Thời gian đã tập trung: <span class="text-yellow">${finalTimeStr}</span></div>`,
            () => switchScreen('page2')
        );
    }
}