const CLIENT_ID = '165371481053-bke2g7h24up7v2rtdm3ohpvd8cavpovr.apps.googleusercontent.com';
const API_KEY = 'AIzaSyB5RT6Y3yGdspz9MBVFIQ2fVfRYNm_CtLs';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

let tokenClient;

window.onload = () => {
  gapi.load("client", async () => {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (tokenResponse) => {
        await loadCalendar();
      },
    });

    // トークンをリクエスト（自動ログイン）
    tokenClient.requestAccessToken();
  });
};

async function loadCalendar() {
  const year = 2024;
  const month = 3; // 0 = January, so 3 = April
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // カレンダーの日付を設定
  const calendarGrid = document.querySelector(".calendar-grid");
  const existingDays = calendarGrid.querySelectorAll(".calendar-day");

  const firstDayOffset = (startDate.getDay() + 1) % 7; // 土曜始まりに対応
  existingDays.forEach((cell, i) => {
    const dayNum = i - firstDayOffset + 1;
    const dayNumberEl = cell.querySelector(".day-number");
    const eventListEl = cell.querySelector(".event-list");

    if (dayNum > 0 && dayNum <= endDate.getDate()) {
      dayNumberEl.textContent = dayNum;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cell.dataset.date = dateStr;
      eventListEl.innerHTML = ""; // 初期化
    } else {
      dayNumberEl.textContent = "";
      eventListEl.innerHTML = "";
      cell.dataset.date = "";
    }
  });

  // Googleカレンダーから予定を取得
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

  // 各日付のマスに予定を表示
  events.forEach((event) => {
    const date = event.start.date || event.start.dateTime?.slice(0, 10);
    const cell = document.querySelector(`[data-date="${date}"]`);
    if (cell) {
      const eventList = cell.querySelector(".event-list");
      const currentEvents = eventList.querySelectorAll(".event");
      if (currentEvents.length < 10) {
        const el = document.createElement("div");
        el.className = "event";
        el.textContent = event.summary || "（無題）";
        eventList.appendChild(el);
      }
    }
  });
}
