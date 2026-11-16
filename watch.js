/* ============================================================
   WATCH PAGE — supports URL videos AND uploaded (local) videos
   ============================================================ */

const FILMS_KEY = "osama_free_films";

const filmPoster     = document.getElementById("filmPoster");
const posterFallback = document.getElementById("posterFallback");
const filmTitleEl    = document.getElementById("filmTitle");
const filmMetaEl     = document.getElementById("filmMeta");
const filmDescEl     = document.getElementById("filmDescription");
const downloadBtn    = document.getElementById("downloadBtn");
const videoContainer = document.getElementById("videoContainer");
const playerMessage  = document.getElementById("playerMessage");
const relatedEl      = document.getElementById("relatedFilms");

document.getElementById("yearNow").textContent = new Date().getFullYear();

/* ---------- DEMO FILMS (must match admin.js) ---------- */
const DEMO_FILMS = [
  {
    id: "free-001", title: "Big Buck Bunny", year: "2008",
    poster: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "A giant rabbit deals with three bullying rodents. A Blender Foundation open movie."
  },
  {
    id: "free-002", title: "Sintel", year: "2010",
    poster: "https://durian.blender.org/wp-content/uploads/2010/06/sintel_poster.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    description: "A lonely young woman travels in search of her lost dragon companion."
  },
  {
    id: "free-003", title: "Elephants Dream", year: "2006",
    poster: "https://orange.blender.org/wp-content/themes/orange/images/header.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "Two strange characters explore a mechanical world."
  },
  {
    id: "free-004", title: "Tears of Steel", year: "2012",
    poster: "https://mango.blender.org/wp-content/uploads/2013/05/tears_of_steel_poster.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description: "Warriors and scientists try to save the world from destructive robots."
  }
];

function loadFilms() {
  try {
    const raw = localStorage.getItem(FILMS_KEY);
    if (!raw) {
      localStorage.setItem(FILMS_KEY, JSON.stringify(DEMO_FILMS));
      return [...DEMO_FILMS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [...DEMO_FILMS];
  }
}

const FREE_FILMS = loadFilms();

/* ---------- HELPERS ---------- */
function getFilmIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}
function slug(text) {
  return String(text || "film").replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
}

function setPoster(film) {
  if (film.poster) {
    filmPoster.src = film.poster;
    filmPoster.alt = `${film.title} poster`;
    filmPoster.referrerPolicy = "no-referrer";
    filmPoster.hidden = false;
    posterFallback.hidden = true;
    filmPoster.addEventListener("error", () => {
      filmPoster.hidden = true;
      posterFallback.hidden = false;
    }, { once: true });
  } else {
    filmPoster.hidden = true;
    posterFallback.hidden = false;
  }
}

/* ---------- LOAD FILM ---------- */
async function loadFilm() {
  const id = getFilmIdFromURL();
  const film = FREE_FILMS.find(f => f.id === id);

  if (!film) {
    filmTitleEl.textContent = "Film not found";
    filmMetaEl.textContent = "";
    filmDescEl.textContent = "This film may have been removed, or the link is incorrect.";
    playerMessage.textContent = "Nothing to play.";
    videoContainer.innerHTML = `
      <div class="player-placeholder">
        <span class="play-symbol">▶</span>
        <p>Film not found.</p>
      </div>`;
    downloadBtn.hidden = true;
    renderRelated(null);
    document.title = "Film not found | Osama Movies";
    return;
  }

  document.title = `${film.title} | Osama Movies`;
  filmTitleEl.textContent = film.title;
  filmMetaEl.textContent = `Year: ${film.year || "Unknown"}`;
  filmDescEl.textContent = film.description || "";
  setPoster(film);

  if (film.videoUrl) {
    if (film.videoUrl.startsWith("local:") || film.isLocal) {
      // -------- uploaded video --------
      try {
        playerMessage.textContent = "Loading uploaded video...";
        const blob = await getVideoBlob(film.id);
        if (!blob) {
          playerMessage.textContent = "Uploaded video not found in this browser.";
          videoContainer.innerHTML = `
            <div class="player-placeholder">
              <span class="play-symbol">▶</span>
              <p>Uploaded video missing.</p>
            </div>`;
          downloadBtn.hidden = true;
          renderRelated(film.id);
          return;
        }
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.setAttribute("download", `${slug(film.title)}.mp4`);
        downloadBtn.hidden = false;
        mountPlayer(url);
      } catch (err) {
        console.error(err);
        playerMessage.textContent = "Could not load the uploaded video.";
      }
    } else {
      // -------- URL video --------
      downloadBtn.href = film.videoUrl;
      downloadBtn.setAttribute("download", `${slug(film.title)}.mp4`);
      downloadBtn.hidden = false;
      mountPlayer(film.videoUrl);
    }
  } else {
    downloadBtn.hidden = true;
    playerMessage.textContent = "No video source available for this film.";
    videoContainer.innerHTML = `
      <div class="player-placeholder">
        <span class="play-symbol">▶</span>
        <p>No video source available.</p>
      </div>`;
  }

  renderRelated(film.id);
}

/* ---------- PLAYER ---------- */
function mountPlayer(videoUrl) {
  const video = document.createElement("video");
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.src = videoUrl;
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.background = "#000";

  video.addEventListener("loadstart", () => { playerMessage.textContent = "Loading video..."; });
  video.addEventListener("canplay",   () => { playerMessage.textContent = "Ready. Press Play to start watching."; });
  video.addEventListener("error",     () => { playerMessage.textContent = "This video cannot play in the browser. Try downloading it instead."; });

  videoContainer.replaceChildren(video);
  playerMessage.textContent = "Loading video...";
  video.muted = true;
  video.play().catch(() => {});
}

/* ---------- RELATED ---------- */
function renderRelated(currentId) {
  relatedEl.replaceChildren();
  const others = FREE_FILMS.filter(f => f.id !== currentId);
  if (!others.length) {
    const empty = document.createElement("p");
    empty.className = "status-message";
    empty.textContent = "No other films available yet.";
    relatedEl.appendChild(empty);
    return;
  }

  others.forEach(film => {
    const card = document.createElement("article");
    card.className = "movie-card";

    if (film.poster) {
      const img = document.createElement("img");
      img.className = "movie-poster";
      img.src = film.poster;
      img.alt = `${film.title} poster`;
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => {
        const ph = document.createElement("div");
        ph.className = "poster-placeholder";
        ph.textContent = "Poster unavailable";
        img.replaceWith(ph);
      }, { once: true });
      card.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "poster-placeholder";
      ph.textContent = "No poster";
      card.appendChild(ph);
    }

    const info = document.createElement("div");
    info.className = "movie-info";
    const h3 = document.createElement("h3");
    h3.textContent = film.title;
    const p = document.createElement("p");
    p.textContent = `Year: ${film.year || "Unknown"}`;
    const actions = document.createElement("div");
    actions.className = "card-actions";
    const watchLink = document.createElement("a");
    watchLink.href = `watch.html?id=${encodeURIComponent(film.id)}`;
    watchLink.className = "watch-button";
    watchLink.textContent = "▶ Watch Free";
    actions.appendChild(watchLink);
    info.append(h3, p, actions);
    card.appendChild(info);
    relatedEl.appendChild(card);
  });
}

/* ---------- INIT ---------- */
loadFilm();