(function () {
  const STORAGE_KEY = "toly-company-news";
  const form = document.querySelector("#news-form");
  const preview = document.querySelector("#admin-preview");
  const status = document.querySelector("#admin-status");
  const exportButton = document.querySelector("#export-json");
  const clearButton = document.querySelector("#clear-drafts");
  const dateInput = document.querySelector("[name='date']");

  let posts = [];

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

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

  function setStatus(message, state = "info") {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  function sortPosts(items) {
    return [...items].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }

  function render() {
    if (!preview) return;
    const items = posts.slice(0, 5);
    preview.innerHTML = items.length
      ? items.map((post) => `
          <article class="news-card">
            <div class="news-meta">${escapeHtml(formatDate(post.date))} / ${escapeHtml(post.category)}</div>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.summary)}</p>
            ${post.body ? `<p class="news-body">${escapeHtml(post.body)}</p>` : ""}
          </article>
        `).join("")
      : `
          <div class="empty-state">
            <h3>No drafts yet</h3>
            <p>Write a weekly update, press publish to preview it, then export the JSON snapshot when it is ready for the site data file.</p>
          </div>
        `;
  }

  function sync(items) {
    posts = sortPosts(Array.isArray(items) ? items : []);
    save();
    render();
  }

  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      sync(JSON.parse(cached));
      setStatus("Saved drafts loaded from this browser.");
    } catch (error) {
      console.warn("Unable to read saved drafts:", error);
      setStatus("Saved draft data could not be read.", "error");
    }
  } else {
    fetch("data/news.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load data/news.json");
        return response.json();
      })
      .then((data) => {
        sync(data);
        setStatus("Current news data loaded.");
      })
      .catch(() => {
        render();
        setStatus("Ready. No existing data loaded.");
      });
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const summary = String(data.get("summary") || "").trim();
    const body = String(data.get("body") || "").trim();
    const date = String(data.get("date") || "").trim();
    const category = String(data.get("category") || "company").trim();

    if (!title || !summary || !date) {
      setStatus("Title, summary, and date are required.", "error");
      return;
    }

    const post = {
      id: `${date}-${slugify(title)}`,
      date,
      category,
      title,
      summary,
      body
    };

    posts = sortPosts([post, ...posts.filter((item) => item.id !== post.id)]);
    save();
    render();
    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    setStatus(`Published "${title}" to the local preview feed. Export JSON to update the static site data.`, "success");
  });

  exportButton?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(posts, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "news.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Downloaded news.json. Replace data/news.json with it for the static site.", "success");
  });

  clearButton?.addEventListener("click", () => {
    if (!confirm("Clear local draft/news preview data from this browser?")) return;
    localStorage.removeItem(STORAGE_KEY);
    posts = [];
    render();
    setStatus("Local drafts cleared. The static data file was not changed.");
  });
})();
