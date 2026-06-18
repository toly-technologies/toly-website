(function () {
  const body = document.body;
  const menuToggle = document.querySelector(".menu-toggle");
  const siteMenu = document.querySelector("#site-menu");
  const themeToggle = document.querySelector(".theme-toggle");

  const progress = document.createElement("div");
  progress.className = "progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);

  function updateProgress() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const percent = total > 0 ? (window.scrollY / total) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  if (localStorage.getItem("toly-theme") === "light") {
    body.classList.add("light");
  }

  menuToggle?.addEventListener("click", () => {
    const open = body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  siteMenu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      body.classList.remove("menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    }
  });

  themeToggle?.addEventListener("click", () => {
    body.classList.toggle("light");
    localStorage.setItem("toly-theme", body.classList.contains("light") ? "light" : "dark");
  });

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.12 });
  reveals.forEach((item) => observer.observe(item));

  const rotatingText = document.querySelector("[data-rotating-text]");
  const phrases = [
    "a place for future tools",
    "a home for future games",
    "a notebook for company news",
    "a skeleton for what comes next"
  ];

  if (rotatingText) {
    let index = 0;
    setInterval(() => {
      index = (index + 1) % phrases.length;
      rotatingText.textContent = phrases[index];
    }, 3200);
  }

  const liveClock = document.querySelector("[data-live-clock]");
  if (liveClock) {
    const updateClock = () => {
      liveClock.textContent = new Date().toLocaleString("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    };
    updateClock();
    setInterval(updateClock, 60000);
  }

  const outputMap = {
    signal: {
      tools: "Tools will get their own pages when an idea is real enough to explain clearly.",
      games: "Games will stay framed as creative space until there is something playable to show.",
      news: "Company news can be updated from data, so weekly notes do not require rewriting page markup."
    },
    tools: {
      utility: "A future utility page can describe one focused workflow, its purpose, and its support status.",
      creative: "A creative tool page can show how the tool helps people make, organize, or test ideas.",
      system: "A system page can explain the logic behind a workflow before it becomes a product."
    },
    games: {
      rules: "Rules should be readable enough to invite play, but deep enough to create discovery.",
      mood: "A game page can establish feeling and direction without announcing a title too early.",
      loop: "The core loop matters more than a big promise. Future pages can grow from that loop."
    },
    studio: {
      identity: "Axerith Studios is the creative and technical workshop identity behind Toly.",
      practice: "The studio space can hold process notes, experiments, and craft thinking without announcing work too early.",
      restraint: "Specific project pages belong here only when there is a real reason to create them."
    }
  };

  document.querySelectorAll("[data-choice-group]").forEach((group) => {
    const kind = group.dataset.choiceGroup;
    const output = document.querySelector(`[data-choice-output="${kind}"]`);
    group.querySelectorAll("[data-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        group.querySelectorAll("[data-choice]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        if (output) output.textContent = outputMap[kind]?.[button.dataset.choice] || "";
      });
    });
  });

  const commandButton = document.querySelector("[data-random-prompt]");
  const commandOutput = document.querySelector("[data-prompt-output]");
  const prompts = [
    "What would be useful even if nobody applauded it?",
    "What should be easier to explain in one sentence?",
    "What weekly update would help visitors understand the work?",
    "What page would a future product need before it is shown publicly?",
    "What should stay private until it is mature?"
  ];

  commandButton?.addEventListener("click", () => {
    commandOutput.textContent = prompts[Math.floor(Math.random() * prompts.length)];
  });

  const canvas = document.querySelector("[data-canvas-scene]");
  if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const ctx = canvas.getContext("2d");
    const nodes = Array.from({ length: 58 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0009,
      vy: (Math.random() - 0.5) * 0.0009
    }));

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, canvas.offsetWidth * ratio);
      canvas.height = Math.max(1, canvas.offsetHeight * ratio);
    }

    function frame() {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(86, 216, 255, 0.16)";
      ctx.fillStyle = "rgba(86, 216, 255, 0.72)";

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > 1) node.vx *= -1;
        if (node.y < 0 || node.y > 1) node.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < 0.17) {
            ctx.globalAlpha = 1 - distance / 0.17;
            ctx.beginPath();
            ctx.moveTo(a.x * width, a.y * height);
            ctx.lineTo(b.x * width, b.y * height);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x * width, node.y * height, 2.2 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    frame();
  }
})();
