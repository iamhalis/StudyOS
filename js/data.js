const VERSION = "6.01";
const CONFIG_KEY = "study_os_config";
const TASKS_KEY = "study_os_tasks";

// Danh sách Quotes nguyên bản (đã lọc bỏ emoji đầu câu giống hàm split trong Python)
const QUOTES = [
    "'Hãy sống như thể ngày mai bạn sẽ chết. Hãy học như thể bạn sẽ sống mãi mãi.' — Mahatma Gandhi",
    "'Thành công không phải là cuối cùng, thất bại không phải là tận cùng: điều quan trọng là lòng can đảm để tiếp tục.' — Winston Churchill",
    "'Mọi thứ luôn có vẻ bất khả thi cho đến khi nó được hoàn thành.' — Nelson Mandela",
    "'Vinh quang lớn nhất của chúng ta không phải là không bao giờ ngã, mà là luôn đứng dậy sau mỗi lần vấp ngã.' — Khổng Tử",
    "'Cách duy nhất để làm nên những điều vĩ đại là yêu điều mình làm.' — Steve Jobs",
    "'Hãy tin rằng bạn có thể, và bạn đã đi được nửa chặng đường.' — Theodore Roosevelt",
    "'Giáo dục là vũ khí mạnh nhất mà bạn có thể dùng để thay đổi thế giới.' — Nelson Mandela",
    "'Đầu tư vào tri thức luôn mang lại lợi nhuận cao nhất.' — Benjamin Franklin",
    "'Điều quan trọng là đừng bao giờ ngừng đặt câu hỏi.' — Albert Einstein",
    "'Người chưa từng mắc sai lầm là người chưa từng thử điều gì mới.' — Albert Einstein",
    "'Thành công thường đến với những người quá bận rộn để đi tìm nó.' — Henry David Thoreau",
    "'Hãy làm những gì bạn có thể, với những gì bạn có, ở nơi bạn đang đứng.' — Theodore Roosevelt",
    "'Chất lượng không phải là một hành động, mà là một thói quen.' — Aristotle",
    "'Bí quyết để tiến lên phía trước là bắt đầu.' — Mark Twain",
    "'Bạn sẽ bỏ lỡ 100% cơ hội nếu không dám thử.' — Wayne Gretzky",
    "'Tôi càng làm việc chăm chỉ, tôi càng gặp nhiều may mắn.' — Samuel Goldwyn",
    "'Chiến thắng bản thân là chiến thắng vĩ đại nhất.' — Khổng Tử",
    "'Tôi không thất bại. Tôi chỉ tìm ra 10.000 cách không hiệu quả.' — Thomas Edison",
    "'Tương lai thuộc về những người tin vào vẻ đẹp của ước mơ.' — Eleanor Roosevelt",
    "'Thiên tài là 1% cảm hứng và 99% mồ hôi.' — Thomas Edison"
];

// Bộ ký tự đồng hồ ASCII trong Focus Session
const DIGITS = {
    '0': ['╔═══╗','║   ║','║   ║','║   ║','╚═══╝'],
    '1': ['  ║  ','  ║  ','  ║  ','  ║  ','  ║  '],
    '2': ['╔═══╗','    ║','╔═══╝','║    ','╚═══╝'],
    '3': ['╔═══╗','    ║','╔═══╣','    ║','╚═══╝'],
    '4': ['║   ║','║   ║','╚═══╣','    ║','    ║'],
    '5': ['╔═══╗','║    ','╚═══╗','    ║','╚═══╝'],
    '6': ['╔═══╗','║    ','╠═══╗','║   ║','╚═══╝'],
    '7': ['╔═══╗','    ║','    ║','    ║','    ║'],
    '8': ['╔═══╗','║   ║','╠═══╣','║   ║','╚═══╝'],
    '9': ['╔═══╗','║   ║','╚═══╣','    ║','╚═══╝'],
    ':': ['     ','  ●  ','     ','  ●  ','     ']
};

const SPINNERS  = ['-', '\\', '|', '/'];
const ORNAMENTS = ['*', '+', '*', '+'];
const WAVE_SEQ  = ['·', '.', '•', '.'];

// Khởi tạo Config & Tasks từ LocalStorage
let config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {
    title: "Study OS",
    target_date: "2027-06-01",
    aim_week: 20,
    aim_month: 80
};

let tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];

function saveConfig() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function getTodayStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getCurrentTimeStr() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getSortedTasks() {
    return [...tasks].sort((a, b) => {
        const dA = a.date || "9999-99-99";
        const dB = b.date || "9999-99-99";
        if (dA !== dB) return dA.localeCompare(dB);
        return (a.time || "99:99").localeCompare(b.time || "99:99");
    });
}