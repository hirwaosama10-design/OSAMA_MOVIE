/* ============================================================
   ADMIN DASHBOARD — full control panel
   ============================================================ */

const FILMS_KEY      = "osama_free_films";
const AUTH_KEY       = "osama_admin_auth";
const REMEMBER_KEY   = "osama_admin_remember";
const SETTINGS_KEY   = "osama_site_settings";
const ADMIN_PASSWORD = "osama123"; // ⚠️ CHANGE THIS!

/* ---------- DEMO FILMS ---------- */
const DEMO_FILMS = [
  { id:"free-001", title:"Big Buck Bunny", year:"2008",
    poster:"https://peach.blender.org/wp-content/uploads/title_anouncement.jpg",
    videoUrl:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description:"A giant rabbit deals with three bullying rodents." },
  { id:"free-002", title:"Sintel", year:"2010",
    poster:"https://durian.blender.org/wp-content/uploads/2010/06/sintel_poster.jpg",
    videoUrl:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    description:"A lonely young woman travels in search of her lost dragon." },
  { id:"free-003", title:"Elephants Dream", year:"2006",
    poster:"https://orange.blender.org/wp-content/themes/orange/images/header.jpg",
    videoUrl:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description:"Two strange characters explore a mechanical world." },
  { id:"free-004", title:"Tears of Steel", year:"2012",
    poster:"https://mango.blender.org/wp-content/uploads/2013/05/tears_of_steel_poster.jpg",
    videoUrl:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description:"Warriors and scientists try to save the world." }
];

/* ---------- ELEMENTS ---------- */
const $ = id => document.getElementById(id);

const loginGate    = $("loginGate");
const adminShell   = $("adminShell");
const loginForm    = $("loginForm");
const loginMessage = $("loginMessage");
const logoutBtn    = $("logoutBtn");
const rememberMe   = $("rememberMe");

const addFilmForm  = $("addFilmForm");
const formHeading  = $("formHeading");
const submitBtn    = $("submitBtn");
const cancelEditBtn= $("cancelEditBtn");
const addMessage   = $("addMessage");

const editId         = $("editId");
const newTitle       = $("newTitle");
const newYear        = $("newYear");
const newPoster      = $("newPoster");
const newVideo       = $("newVideo");
const newVideoFile   = $("newVideoFile");
const uploadInfo     = $("uploadInfo");
const newDescription = $("newDescription");
const posterPreview  = $("posterPreview");

const urlGroup     = $("urlGroup");
const uploadGroup  = $("uploadGroup");
const radioUrls    = document.querySelectorAll('input[name="videoSource"]');

const adminFilmList  = $("adminFilmList");
const manageMessage  = $("manageMessage");
const filmSearchInput= $("filmSearchInput");
const resetDemoBtn   = $("resetDemoBtn");
const clearAllBtn    = $("clearAllBtn");

const siteName       = $("siteName");
const siteTagline    = $("siteTagline");
const saveSettingsBtn= $("saveSettingsBtn");
const settingsMessage= $("settingsMessage");

const viewTitle      = $("viewTitle");
const viewEyebrow    = $("viewEyebrow");

/* ---------- STATE ---------- */
let films = loadFilms();
let selectedFile = null;
let currentView = "dashboard";

/* ---------- STORAGE ---------- */
function loadFilms() {
  try {
    const raw = localStorage.getItem(FILMS_KEY);
    if (!raw) {
      localStorage.setItem(FILMS_KEY, JSON.stringify(DEMO_FILMS));
      return [...DEMO_FILMS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return [...DEMO_FILMS]; }
}

function saveFilms(list) {
  try {
    localStorage.setItem(FILMS_KEY, JSON.stringify(list));
    return true;
  } catch (err) {
    addMessage.textContent = "❌ Storage full! Delete some films first.";
    return false;
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { name:"Osama Movies", tagline:"Watch free. Download free." };
  } catch { return { name:"Osama Movies", tagline:"Watch free. Download free." }; }
}

function makeId() {
  return `film-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch { return null; }
}

/* ---------- AUTH ---------- */
function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === "1" || localStorage.getItem(REMEMBER_KEY) === "1";
}

function showShell() {
  loginGate.hidden = true;
  adminShell.hidden = false;
  refreshStats();
  renderAdminList();
  renderRecent();
  switchView("dashboard");
  loadSettingsIntoForm();
}

function showLogin() {
  loginGate.hidden = false;
  adminShell.hidden = true;
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = $("adminPassword").value;
  if (value === ADMIN_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, "1");
    if (rememberMe.checked) localStorage.setItem(REMEMBER_KEY, "1");
    loginMessage.textContent = "";
    loginForm.reset();
    showShell();
  } else {
    loginMessage.textContent = "❌ Incorrect password. Try again.";
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  showLogin();
  loginMessage.textContent = "You have been logged out.";
});

/* ---------- VIEW SWITCHER ---------- */
function switchView(view) {
  currentView = view;
  document.querySelectorAll(".admin-view").forEach(v => v.hidden = true);
  const target = $(`view-${view}`);
  if (target) target.hidden = false;

  document.querySelectorAll(".menu-item").forEach(m => {
    m.classList.toggle("active", m.dataset.view === view);
  });

  const titles = {
    dashboard: ["OVERVIEW", "Dashboard"],
    films:     ["MANAGE", "All Films"],
    add:       ["CREATE", "Add Film"],
    settings:  ["CONFIG", "Settings"]
  };
  const [eyebrow, title] = titles[view] || ["ADMIN", "Dashboard"];
  viewEyebrow.textContent = eyebrow;
  viewTitle.textContent = title;

  if (view === "dashboard") { refreshStats(); renderRecent(); }
  if (view === "films") renderAdminList();
}

document.querySelectorAll("[data-view]").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    switchView(el.dataset.view);
  });
});

/* ---------- STATS ---------- */
function refreshStats() {
  const total = films.length;
  const links = films.filter(f => f.videoUrl && !f.isLocal).length;
  const uploads = films.filter(f => f.isLocal).length;
  const posters = films.filter(f => f.poster).length;

  $("statTotal").textContent = total;
  $("statLinks").textContent = links;
  $("statUploads").textContent = uploads;
  $("statPosters").textContent = posters;
}

function renderRecent() {
  const recent = films.slice(-5).reverse();
  const el = $("recentFilms");
  el.replaceChildren();
  if (!recent.length) {
    el.innerHTML = `<p class="status-message">No films yet.</p>`;
    return;
  }
  recent.forEach(film => {
    const row = document.createElement("div");
    row.className = "recent-item";
    row.innerHTML = `
      <div class="recent-poster">${film.poster ? `<img src="${film.poster}" alt="">` : "🎬"}</div>
      <div class="recent-info">
        <strong>${escapeHtml(film.title)}</strong>
        <p>${escapeHtml(film.year || "—")} · ${film.videoUrl ? (film.isLocal ? "📤 uploaded" : "🔗 link") : "⚠ no video"}</p>
      </div>
      <a class="recent-view" href="watch.html?id=${encodeURIComponent(film.id)}" target="_blank">View ↗</a>
    `;
    el.appendChild(row);
  });
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

/* ---------- VIDEO SOURCE TOGGLE ---------- */
radioUrls.forEach(radio => {
  radio.addEventListener("change", () => {
    const mode = document.querySelector('input[name="videoSource"]:checked').value;
    urlGroup.hidden = mode !== "url";
    uploadGroup.hidden = mode !== "upload";
  });
});

newVideoFile.addEventListener("change", () => {
  const file = newVideoFile.files[0];
  if (!file) {
    selectedFile = null;
    uploadInfo.textContent = "No file selected.";
    return;
  }
  if (!/video\/(mp4|webm)/.test(file.type)) {
    addMessage.textContent = "❌ Only MP4 or WebM videos are allowed.";
    newVideoFile.value = "";
    selectedFile = null;
    return;
  }
  selectedFile = file;
  const mb = (file.size / (1024*1024)).toFixed(1);
  uploadInfo.textContent = `✅ Selected: ${file.name} (${mb} MB)`;
});

/* ---------- POSTER PREVIEW ---------- */
newPoster.addEventListener("input", () => {
  const url = newPoster.value.trim();
  if (url && safeHttpsUrl(url)) {
    posterPreview.innerHTML = `<img src="${url}" alt="preview"
      onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'Invalid image'}))">`;
  } else {
    posterPreview.innerHTML = `<span>Poster preview</span>`;
  }
});

/* ---------- SUBMIT ---------- */
addFilmForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id          = editId.value;
  const title       = newTitle.value.trim();
  const year        = newYear.value.trim();
  const posterInput = newPoster.value.trim();
  const videoInput  = newVideo.value.trim();
  const description = newDescription.value.trim();
  const mode        = document.querySelector('input[name="videoSource"]:checked').value;

  const poster   = posterInput ? safeHttpsUrl(posterInput) : "";
  const videoUrl = videoInput  ? safeHttpsUrl(videoInput)  : "";

  if (!title) { addMessage.textContent = "Title is required."; return; }
  if (posterInput && !poster) { addMessage.textContent = "Poster must be valid HTTPS URL."; return; }

  let finalVideoUrl = "";
  let storedLocal   = false;
  let filmId        = id || makeId();

  if (mode === "url") {
    if (videoInput && !videoUrl) {
      addMessage.textContent = "Video URL must be valid HTTPS.";
      return;
    }
    finalVideoUrl = videoUrl;
  } else {
    if (!selectedFile && !id) {
      addMessage.textContent = "Please choose a video file.";
      return;
    }
    if (selectedFile) {
      try {
        addMessage.textContent = "⏳ Saving video...";
        await saveVideoBlob(filmId, selectedFile);
        storedLocal = true;
        finalVideoUrl = `local:${filmId}`;
        addMessage.textContent = "✅ Video stored.";
      } catch (err) {
        addMessage.textContent = "❌ Failed to save video.";
        return;
      }
    } else if (id) {
      const existing = films.find(f => f.id === id);
      if (existing?.videoUrl?.startsWith("local:")) {
        finalVideoUrl = existing.videoUrl;
        storedLocal = true;
      }
    }
  }

  if (id) {
    const idx = films.findIndex(f => f.id === id);
    if (idx === -1) { addMessage.textContent = "Film not found."; return; }
    films[idx] = { ...films[idx], title, year, poster, description, videoUrl: finalVideoUrl, isLocal: storedLocal };
    if (!saveFilms(films)) return;
    addMessage.textContent = `✏️ "${title}" updated.`;
    resetForm();
  } else {
    const dup = films.some(f => f.title.toLowerCase() === title.toLowerCase());
    if (dup) { addMessage.textContent = "This film already exists."; return; }
    films.push({ id: filmId, title, year, poster, description, videoUrl: finalVideoUrl, isLocal: storedLocal });
    if (!saveFilms(films)) { films.pop(); return; }
    addMessage.textContent = `✅ "${title}" added!`;
    addFilmForm.reset();
    selectedFile = null;
    uploadInfo.textContent = "No file selected.";
    posterPreview.innerHTML = `<span>Poster preview</span>`;
  }

  refreshStats();
  renderAdminList();
  renderRecent();
});

/* ---------- RESET FORM ---------- */
function resetForm() {
  addFilmForm.reset();
  editId.value = "";
  selectedFile = null;
  uploadInfo.textContent = "No file selected.";
  posterPreview.innerHTML = `<span>Poster preview</span>`;
  formHeading.textContent = "➕ Add a New Film";
  submitBtn.textContent = "✅ Publish Film";
  cancelEditBtn.hidden = true;
  urlGroup.hidden = false;
  uploadGroup.hidden = true;
}

cancelEditBtn.addEventListener("click", () => {
  resetForm();
  addMessage.textContent = "";
  switchView("films");
});

/* ---------- FILM TABLE ---------- */
function renderAdminList() {
  adminFilmList.replaceChildren();
  if (!films.length) {
    manageMessage.textContent = "No films. Add your first film!";
    return;
  }
  manageMessage.textContent = `${films.length} film(s) in library.`;

  const filterText = (filmSearchInput.value || "").toLowerCase();
  const list = filterText
    ? films.filter(f => f.title.toLowerCase().includes(filterText))
    : films;

  list.forEach(film => {
    const row = document.createElement("div");
    row.className = "film-row";

    const thumb = document.createElement("div");
    thumb.className = "film-thumb";
    if (film.poster) {
      const img = document.createElement("img");
      img.src = film.poster; img.alt = film.title; img.loading = "lazy";
      img.onerror = () => { thumb.textContent = "🎬"; };
      thumb.appendChild(img);
    } else thumb.textContent = "🎬";

    const info = document.createElement("div");
    info.className = "film-info";
    const videoLabel = film.videoUrl
      ? (film.isLocal ? "📤 uploaded" : "🔗 link") : "⚠ none";
    info.innerHTML = `
      <strong>${escapeHtml(film.title)}</strong>
      <p>${escapeHtml(film.year || "—")} · ${videoLabel}</p>
      ${film.description ? `<p class="film-desc">${escapeHtml(film.description)}</p>` : ""}
    `;

    const actions = document.createElement("div");
    actions.className = "film-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn edit";
    editBtn.textContent = "✏️";
    editBtn.title = "Edit";
    editBtn.onclick = () => startEdit(film.id);

    const viewBtn = document.createElement("a");
    viewBtn.className = "icon-btn view";
    viewBtn.href = `watch.html?id=${encodeURIComponent(film.id)}`;
    viewBtn.target = "_blank";
    viewBtn.rel = "noopener";
    viewBtn.textContent = "▶";
    viewBtn.title = "View";

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn delete";
    delBtn.textContent = "🗑";
    delBtn.title = "Delete";
    delBtn.onclick = () => deleteFilm(film.id, film.title);

    actions.append(editBtn, viewBtn, delBtn);
    row.append(thumb, info, actions);
    adminFilmList.appendChild(row);
  });
}

filmSearchInput.addEventListener("input", renderAdminList);

/* ---------- EDIT / DELETE ---------- */
function startEdit(id) {
  const film = films.find(f => f.id === id);
  if (!film) return;

  editId.value = film.id;
  newTitle.value = film.title || "";
  newYear.value = film.year || "";
  newPoster.value = film.poster || "";
  newDescription.value = film.description || "";

  if (film.isLocal) {
    document.querySelector('input[value="upload"]').checked = true;
    urlGroup.hidden = true;
    uploadGroup.hidden = false;
    newVideo.value = "";
    uploadInfo.textContent = "Current video is local. Choose new file to replace.";
  } else {
    document.querySelector('input[value="url"]').checked = true;
    urlGroup.hidden = false;
    uploadGroup.hidden = true;
    newVideo.value = film.videoUrl || "";
  }

  newPoster.dispatchEvent(new Event("input"));
  formHeading.textContent = `✏️ Edit: ${film.title}`;
  submitBtn.textContent = "💾 Save Changes";
  cancelEditBtn.hidden = false;
  switchView("add");
  addMessage.textContent = "";
  newTitle.focus();
}

async function deleteFilm(id, title) {
  if (!confirm(`Delete "${title}"?`)) return;
  try { await deleteVideoBlob(id); } catch {}
  films = films.filter(f => f.id !== id);
  saveFilms(films);
  refreshStats();
  renderAdminList();
  renderRecent();
  addMessage.textContent = `🗑 "${title}" deleted.`;
  if (editId.value === id) resetForm();
}

/* ---------- BULK ---------- */
resetDemoBtn.addEventListener("click", async () => {
  if (!confirm("Reset to demo films? Changes will be lost.")) return;
  try {
    const ids = await listVideoIds();
    for (const v of ids) await deleteVideoBlob(v);
  } catch {}
  films = [...DEMO_FILMS];
  saveFilms(films);
  refreshStats(); renderAdminList(); renderRecent(); resetForm();
  addMessage.textContent = "↻ Library reset.";
});

clearAllBtn.addEventListener("click", async () => {
  if (!confirm("Delete ALL films? This cannot be undone.")) return;
  try {
    const ids = await listVideoIds();
    for (const v of ids) await deleteVideoBlob(v);
  } catch {}
  films = [];
  saveFilms(films);
  refreshStats(); renderAdminList(); renderRecent(); resetForm();
  addMessage.textContent = "🗑 All films deleted.";
});

/* ---------- SETTINGS ---------- */
function loadSettingsIntoForm() {
  const s = loadSettings();
  siteName.value = s.name || "";
  siteTagline.value = s.tagline || "";
}

saveSettingsBtn.addEventListener("click", () => {
  const s = { name: siteName.value.trim(), tagline: siteTagline.value.trim() };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  settingsMessage.textContent = "✅ Settings saved.";
});

/* ---------- INIT ---------- */
if (isLoggedIn()) showShell(); else showLogin();