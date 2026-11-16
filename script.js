const FILMS_KEY = "osama_free_films";

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
    description: "Two strange characters explore a mechanical world. The first Blender open movie."
  },
  {
    id: "free-004", title: "Tears of Steel", year: "2012",
    poster: "https://mango.blender.org/wp-content/uploads/2013/05/tears_of_steel_poster.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description: "A team of warriors and scientists try to save the world from destructive robots."
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

let films = loadFilms();

const movieContainer = document.getElementById("movies");
const messageEl = document.getElementById("message");

function makeCard(film) {
  const card = document.createElement("article");
  card.className = "movie-card";

  // Poster
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

  // Info
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
  return card;
}

function displayMovies(list) {
  movieContainer.replaceChildren();
  if (!list.length) {
    messageEl.textContent = "No films available.";
    return;
  }
  list.forEach(film => movieContainer.appendChild(makeCard(film)));
}

// Search
document.getElementById("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = document.getElementById("filmName").value.trim().toLowerCase();
  const filtered = films.filter(f => f.title.toLowerCase().includes(text));
  displayMovies(filtered);
  messageEl.textContent = filtered.length
    ? `${filtered.length} movie(s) found`
    : "No movies found";
});

// Show All
document.getElementById("showAll").addEventListener("click", () => {
  displayMovies(films);
  messageEl.textContent = "Showing all movies";
});

// Footer year
document.getElementById("yearNow").textContent = new Date().getFullYear();

// Init
displayMovies(films);