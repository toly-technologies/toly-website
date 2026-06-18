(function () {
  const form = document.querySelector("#cli-form");
  const endpoint = document.querySelector("#cli-endpoint");
  const status = document.querySelector("#cli-status");
  const output = document.querySelector("#cli-output");
  const loadButton = document.querySelector("#cli-load");
  const dateInput = document.querySelector("#cli-form [name='date']");

  function setStatus(message, state = "info") {
    status.textContent = message;
    status.dataset.state = state;
  }

  function print(value) {
    output.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      title: String(data.get("title") || "").trim(),
      date: String(data.get("date") || "").trim(),
      category: String(data.get("category") || "company"),
      summary: String(data.get("summary") || "").trim(),
      body: String(data.get("body") || "").trim()
    };

    try {
      setStatus("Sending update to backend...");
      const response = await fetch(endpoint.value, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      print(json);
      setStatus(response.ok ? "Backend accepted the update." : "Backend rejected the update.", response.ok ? "success" : "error");
    } catch (error) {
      print(String(error));
      setStatus("Could not reach the backend. Start Python or Rust first.", "error");
    }
  });

  loadButton?.addEventListener("click", async () => {
    try {
      setStatus("Loading posts from backend...");
      const response = await fetch(endpoint.value);
      const json = await response.json();
      print(json);
      setStatus("Loaded backend posts.", "success");
    } catch (error) {
      print(String(error));
      setStatus("Could not reach the backend.", "error");
    }
  });
})();
