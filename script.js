const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = 'YOUR_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
    scope: SCOPES,
  }).then(() => {
    // ログイン状態をチェック
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
      gapi.auth2.getAuthInstance().signIn();
    }
    loadCalendar();
  });
}

function loadCalendar() {
  const calendarEl = document.getElementById("calendar");

  // 表示月の日付生成（例：4月）
  const year = 2024;
  const month = 3; // 0=Jan, 3=April
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // セルを初期表示（42マス）
  const firstDay = (startDate.getDay() + 1) % 7; // 土曜始まりに調整
  const totalCells = 42;
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "day";
    const dayNum = i - firstDay + 1;
    if (dayNum > 0 && dayNum <= endDate.getDate()) {
      cell.innerHTML = `<div class="day-number">${dayNum}</div>`;
      cell.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
    calendarEl.appendChild(cell);
  }

  // Googleカレンダーから予定を取得
  gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: 'startTime',
  }).then(response => {
    const events = response.result.items;
    events.forEach(event => {
      const date = event.start.date || event.start.dateTime.slice(0, 10);
      const cell = document.querySelector(`[data-date="${date}"]`);
      if (cell) {
        const eventEl = document.createElement("div");
        eventEl.className = "event pink"; // カラーランダムにしたければ工夫可能
        eventEl.textContent = event.summary;
        cell.appendChild(eventEl);
      }
    });
  });
}

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

window.onload = handleClientLoad;
