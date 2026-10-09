// 화면 확인용 샘플 데이터 (저장 기능은 아직 없음)
const sampleEntries = [
  { date: "2026-10-01", type: "income", category: "용돈", memo: "10월 용돈", amount: 50000 },
  { date: "2026-10-03", type: "expense", category: "간식", memo: "편의점 음료", amount: 1800 },
  { date: "2026-10-03", type: "expense", category: "교통", memo: "버스", amount: 1500 },
  { date: "2026-10-06", type: "expense", category: "식비", memo: "친구랑 떡볶이", amount: 6000 },
  { date: "2026-10-08", type: "expense", category: "문구", memo: "노트, 형광펜", amount: 4200 },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatWon(value) {
  return value.toLocaleString("ko-KR") + "원";
}

function formatDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

function renderSummary(entries) {
  const income = entries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  document.getElementById("totalIncome").textContent = formatWon(income);
  document.getElementById("totalExpense").textContent = formatWon(expense);
  document.getElementById("totalBalance").textContent = formatWon(income - expense);
}

function renderHistory(entries) {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  if (entries.length === 0) {
    list.innerHTML = '<p class="empty">아직 기록된 내역이 없어요.</p>';
    return;
  }

  // 날짜별로 묶어서 최신 날짜부터 표시
  const groups = {};
  entries.forEach(e => (groups[e.date] ||= []).push(e));
  const dates = Object.keys(groups).sort().reverse();

  dates.forEach(date => {
    const items = groups[date];
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
        <span class="entry-amount ${e.type}">${e.type === "income" ? "+" : "-"}${formatWon(e.amount)}</span>`;
      row.querySelector(".entry-category").textContent = e.category;
      row.querySelector(".entry-memo").textContent = e.memo || "-";
      group.appendChild(row);
    });

    list.appendChild(group);
  });
}

// 날짜 입력 기본값: 오늘
document.querySelector('input[name="date"]').valueAsDate = new Date();

// 폼 제출은 아직 기능 없음 (새로고침만 막아 둠)
document.getElementById("entryForm").addEventListener("submit", event => {
  event.preventDefault();
});

renderSummary(sampleEntries);
renderHistory(sampleEntries);
