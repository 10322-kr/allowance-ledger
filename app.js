const STORAGE_KEY = "allowance-ledger-entries";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

let entries = loadEntries();
let viewYear;
let viewMonth; // 0~11

function loadEntries() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    alert("저장에 실패했어요. 브라우저 저장 공간 설정을 확인해 주세요.");
  }
}

// 기기 시간대 기준 오늘 날짜 (YYYY-MM-DD)
function todayString() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatWon(value) {
  return value.toLocaleString("ko-KR") + "원";
}

function formatDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

function setViewMonth(year, month) {
  const d = new Date(year, month, 1);
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
}

function entriesOfViewMonth() {
  const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-`;
  return entries.filter(e => e.date.startsWith(prefix));
}

function renderSummary(list) {
  const income = list.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expense = list.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  document.getElementById("totalIncome").textContent = formatWon(income);
  document.getElementById("totalExpense").textContent = formatWon(expense);
  document.getElementById("totalBalance").textContent = formatWon(income - expense);
}

function renderHistory(list) {
  const container = document.getElementById("historyList");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = '<p class="empty">아직 기록된 내역이 없어요.</p>';
    return;
  }

  // 날짜별로 묶어서 최신 날짜부터, 같은 날짜는 최근 입력부터 표시
  const groups = {};
  list.forEach(e => (groups[e.date] ||= []).push(e));
  const dates = Object.keys(groups).sort().reverse();

  dates.forEach(date => {
    const items = groups[date].sort((a, b) => b.createdAt - a.createdAt);
    const dayTotal = items.reduce((s, e) => s + (e.type === "income" ? e.amount : -e.amount), 0);

    const group = document.createElement("div");
    group.className = "day-group";
    group.innerHTML = `
      <div class="day-header">
        <span>${formatDay(date)}</span>
        <span>${dayTotal >= 0 ? "+" : "-"}${formatWon(Math.abs(dayTotal))}</span>
      </div>`;

    items.forEach(e => {
      const row = document.createElement("div");
      row.className = "entry-item";
      row.innerHTML = `
        <span class="entry-category"></span>
        <span class="entry-memo"></span>
        <span class="entry-amount ${e.type}">${e.type === "income" ? "+" : "-"}${formatWon(e.amount)}</span>
        <button type="button" class="delete-btn" aria-label="삭제">×</button>`;
      row.querySelector(".entry-category").textContent = e.category;
      row.querySelector(".entry-memo").textContent = e.memo || "-";
      row.querySelector(".delete-btn").dataset.id = e.id;
      group.appendChild(row);
    });

    container.appendChild(group);
  });
}

function render() {
  document.getElementById("currentMonth").textContent = `${viewYear}년 ${viewMonth + 1}월`;
  const list = entriesOfViewMonth();
  renderSummary(list);
  renderHistory(list);
}

const form = document.getElementById("entryForm");
const dateInput = form.elements.date;

form.addEventListener("submit", event => {
  event.preventDefault();

  const amount = Number(form.elements.amount.value);
  if (!dateInput.value || !Number.isFinite(amount) || amount <= 0) {
    alert("날짜와 0보다 큰 금액을 입력해 주세요.");
    return;
  }

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: dateInput.value,
    type: form.elements.type.value,
    category: form.elements.category.value,
    memo: form.elements.memo.value.trim(),
    amount: Math.round(amount),
    createdAt: Date.now(),
  };

  entries.push(entry);
  saveEntries();

  // 추가한 내역이 있는 달로 이동해서 바로 보이게 함
  const [y, m] = entry.date.split("-").map(Number);
  setViewMonth(y, m - 1);
  render();

  // 날짜·구분·분류는 연속 입력을 위해 유지하고 금액과 메모만 비움
  form.elements.amount.value = "";
  form.elements.memo.value = "";
  form.elements.amount.focus();
});

document.getElementById("historyList").addEventListener("click", event => {
  const button = event.target.closest(".delete-btn");
  if (!button) return;

  const entry = entries.find(e => e.id === button.dataset.id);
  if (!entry) return;

  const label = entry.memo || entry.category;
  if (!confirm(`'${label}' ${formatWon(entry.amount)} 내역을 삭제할까요?`)) return;

  entries = entries.filter(e => e.id !== entry.id);
  saveEntries();
  render();
});

document.getElementById("prevMonth").addEventListener("click", () => {
  setViewMonth(viewYear, viewMonth - 1);
  render();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  setViewMonth(viewYear, viewMonth + 1);
  render();
});

// 다른 탭에서 내역이 바뀌면 다시 불러와 합계와 목록을 갱신
window.addEventListener("storage", event => {
  if (event.key !== STORAGE_KEY) return;
  entries = loadEntries();
  render();
});

dateInput.value = todayString();
const now = new Date();
setViewMonth(now.getFullYear(), now.getMonth());
render();
