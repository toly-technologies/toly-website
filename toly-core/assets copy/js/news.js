(function () {
  const STORAGE_KEY = "toly-company-news";
  const lists = document.querySelectorAll("[data-news-list]");
  const filters = document.querySelectorAll("[data-news-filter]");

  if (!lists.length) return;

  let posts = [];
  let activeFilter = "all";

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(value) {
    if (!value) return "Undated";
    return new Date(`${value}T00:00:00`).toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  }

  function sortPosts(items) {
    return [...items].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }

  function normalize(items) {
    return sortPosts(Array.isArray(items) ? items : []).filter((post) => post && post.title && post.summary);
  }

  function renderList(target, items) {
    const limit = Number(target.dataset.limit || items.length || 0);
    const visible = limit ? items.slice(0, limit) : items;

    if (!visible.length) {
      target.innerHTML = `
        <div class="empty-state">
          <h3>No company news yet</h3>
          <p>The feed is ready. Use the private editor to prepare the first public update when there is something worth saying.</p>
        </div>
      `;
      return;
    }

    target.innerHTML = visible.map((post) => `
      <article class="news-card reveal visible" data-category="${escapeHtml(post.category || "company")}">
        <div class="news-meta">${escapeHtml(formatDate(post.date))} / ${escapeHtml(post.category || "company")}</div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.summary)}</p>
        ${post.body ? `<p class="news-body">${escapeHtml(post.body)}</p>` : ""}
      </article>
    `).join("");
  }

  function renderAll() {
    const filtered = activeFilter === "all" ? posts : posts.filter((post) => post.category === activeFilter);
    lists.forEach((list) => renderList(list, filtered));
  }

  function sync(items) {
    posts = normalize(items);
    renderAll();
  }

  function loadCached() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    try {
      sync(JSON.parse(raw));
      return true;
    } catch (error) {
      console.warn("Unable to read cached company news:", error);
      return false;
    }
  }

  const hadCachedPosts = loadCached();

  fetch("data/news.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Unable to load data/news.json");
      return response.json();
    })
    .then((data) => {
      const normalized = normalize(data);
      if (!hadCachedPosts || normalized.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        sync(normalized);
      }
    })
    .catch((error) => {
      console.warn(error);
      if (!posts.length) renderAll();
    });

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.newsFilter || "all";
      filters.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderAll();
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      sync(JSON.parse(event.newValue));
    } catch (error) {
      console.warn("Unable to sync company news:", error);
    }
  });
})();
