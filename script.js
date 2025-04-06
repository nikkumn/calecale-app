// script.js
const CLIENT_ID = '165371481053-bke2g7h24up7v2rtdm3ohpvd8cavpovr.apps.googleusercontent.com';
const API_KEY = 'AIzaSyB5RT6Y3yGdspz9MBVFIQ2fVfRYNm_CtLs';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

let tokenClient;
let currentDate = new Date();

const googleColors = {
  "1": "#a4bdfc", "2": "#7ae7bf", "3": "#dbadff", "4": "#ff887c", "5": "#fbd75b",
  "6": "#ff8c00", "7": "#46d6db", "8": "#e1e1e1", "9": "#5484ed", "10": "#51b749",
  "11": "#dc2127"
};

window.onload = () => {
  renderCalendarGrid();
  gapi.load("client", async () => {
    await gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      prompt: '',
      callback: async (response) => {
        gapi.client.setToken(response);
        await loadCalendar(currentDate);
        setInterval(() => {
          loadCalendar(currentDate);
        }, 300000); // 5分ごとに更新
      },
    });

    if (gapi.client.getToken()) {
      await loadCalendar(currentDate);
      setInterval(() => {
        loadCalendar(currentDate);
      }, 300000);
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
  grid.innerHTML = "";
  for (let i = 0; i < 42; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    cell.innerHTML = `
      <div class="day-number" style="font-size: 8px; color: #000;"></div>
      <div class="event-list" style="height: 80px;"></div>
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

  const firstDayOffset = (startDate.getDay() + 1) % 7;
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

  events.forEach((event) => {
    const start = event.start.date || event.start.dateTime?.slice(0, 10);
    const end = event.end.date || event.end.dateTime?.slice(0, 10);
    if (!start || !end) return;

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    endDateObj.setDate(endDateObj.getDate() - 1);

    let current = new Date(startDateObj);
    while (current <= endDateObj) {
      const dateStr = current.toISOString().split("T")[0];
      const cell = document.querySelector(`[data-date="${dateStr}"]`);
      if (cell) {
        const eventList = cell.querySelector(".event-list");
        if (eventList.childElementCount < 10) {
          const el = document.createElement("div");
          el.className = "event";
          el.textContent = event.summary || "（無題）";
          el.title = event.description || "詳細なし";
          el.style.fontSize = "6px";
          el.style.height = "8px";
          el.style.lineHeight = "8px";
          el.style.overflow = "hidden";
          el.style.whiteSpace = "nowrap";
          el.style.textOverflow = "ellipsis";
          el.style.width = "100%";
          el.style.color = "#000";
          el.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

          if (event.colorId && googleColors[event.colorId]) {
            el.style.backgroundColor = googleColors[event.colorId];
          } else {
            el.style.backgroundColor = "#a4bdfc"; // ピーコック色
          }

          el.onclick = () => alert(`タイトル: ${event.summary}\n説明: ${event.description || "なし"}\n開始: ${event.start.dateTime || event.start.date}`);
          eventList.appendChild(el);
        }
      }
      current.setDate(current.getDate() + 1);
    }
  });
}
