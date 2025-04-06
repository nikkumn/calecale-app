// script.js
const CLIENT_ID = '165371481053-bke2g7h24up7v2rtdm3ohpvd8cavpovr.apps.googleusercontent.com';
const API_KEY = 'AIzaSyB5RT6Y3yGdspz9MBVFIQ2fVfRYNm_CtLs';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

let tokenClient;
let currentDate = new Date();

window.onload = () => {
  renderCalendarGrid();
  gapi.load("client", async () => {
    await gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      prompt: '', // ポップアップを抑制して自動再認証
      callback: async () => {
        await loadCalendar(currentDate);
        setInterval(() => {
          loadCalendar(currentDate);
        }, 30000); // 30秒ごとに更新
      },
    });

    // すでにトークンがあれば自動読み込み、なければリクエスト
    if (gapi.client.getToken()) {
      await loadCalendar(currentDate);
      setInterval(() => {
        loadCalendar(currentDate);
      }, 30000); // 30秒ごとに更新
    } else {
      tokenClient.requestAccessToken();
    }
  });
};

function changeMonth(offset) {
  currentDate.setMonth(currentDate.getMonth() + offset);
  clearCalendarGrid();
  renderCalendarGrid();
  loadCalendar(currentDate);
}

function clearCalendarGrid() {
  const days = document.querySelectorAll(".calendar-day");
  days.forEach((day) => day.remove());
}

function renderCalendarGrid() {
  const grid = document.querySelector(".calendar-grid");
  for (let i = 0; i < 42; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.innerHTML = `
      <div class="day-number"></div>
      <div class="event-list"></div>
    `;
    grid.appendChild(cell);
  }
}

async function loadCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  document.getElementById("monthYear").textContent = `${year}年${month + 1}月`;

  const firstDayOffset = (startDate.getDay() + 1) % 7; // 土曜始まり対応
  const calendarCells = document.querySelectorAll(".calendar-day");

  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDayOffset + 1;
    const dayCell = calendarCells[i];
    const dayNumberEl = dayCell.querySelector(".day-number");
    const eventListEl = dayCell.querySelector(".event-list");
    eventListEl.innerHTML = "";

    if (dayNum > 0 && dayNum <= endDate.getDate()) {
      dayNumberEl.textContent = dayNum;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      dayCell.dataset.date = dateStr;
    } else {
      dayNumberEl.textContent = "";
      delete dayCell.dataset.date;
    }
  }

  const response = await gapi.client.calendar.events.list({
    calendarId: "primary",
    timeMin: startDate.toISOString(),
    timeMax: new Date(year, month + 1, 1).toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 300,
  });

  const events = response.result.items;
  const colorClasses = ["color-red", "color-blue", "color-green", "color-purple", "color-orange", "color-teal"];

  events.forEach((event, index) => {
    const date = event.start.date || event.start.dateTime?.slice(0, 10);
    const cell = document.querySelector(`[data-date="${date}"]`);
    if (cell) {
      const eventList = cell.querySelector(".event-list");
      if (eventList.childElementCount < 10) {
        const el = document.createElement("div");
        el.className = `event ${colorClasses[index % colorClasses.length]}`;
        el.textContent = event.summary || "（無題）";
        el.title = event.description || "詳細なし";
        el.onclick = () => alert(`タイトル: ${event.summary}\n説明: ${event.description || "なし"}\n開始: ${event.start.dateTime || event.start.date}`);
        eventList.appendChild(el);
      }
    }
  });
} 
