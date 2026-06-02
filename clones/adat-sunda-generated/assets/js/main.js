(() => {
  "use strict";

  const weddingDate = new Date("2026-08-16T09:00:00+07:00").getTime();
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let autoTimer = 0;
  let autoActive = false;
  let currentSection = 0;

  const cleanGuestName = (value) => {
    const fallback = "Tamu Undangan";
    if (!value) return fallback;
    const holder = document.createElement("span");
    holder.textContent = value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();
    return holder.textContent.slice(0, 90) || fallback;
  };

  const applyGuest = () => {
    const params = new URLSearchParams(window.location.search);
    const name = cleanGuestName(params.get("to"));
    $$(".guest-name").forEach((node) => {
      node.textContent = name;
    });
    $$(".input-name").forEach((node) => {
      node.value = name === "Tamu Undangan" ? "" : name;
      node.placeholder = name;
    });
  };

  const updateCountdown = () => {
    const distance = Math.max(0, weddingDate - Date.now());
    const values = {
      days: Math.floor(distance / 86_400_000),
      hours: Math.floor((distance % 86_400_000) / 3_600_000),
      minutes: Math.floor((distance % 3_600_000) / 60_000),
      seconds: Math.floor((distance % 60_000) / 1000),
    };
    Object.entries(values).forEach(([key, value]) => {
      const node = document.querySelector(`[data-count="${key}"]`);
      if (node) node.textContent = String(value).padStart(2, "0");
    });
  };

  const sections = () => $$(".section");

  const scrollToSection = (index) => {
    const list = sections();
    const target = list[Math.max(0, Math.min(index, list.length - 1))];
    if (!target) return;
    currentSection = list.indexOf(target);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setAutoState = (active) => {
    autoActive = active;
    $("#readToggle")?.classList.toggle("active", active);
    clearInterval(autoTimer);
    if (!active) return;
    autoTimer = window.setInterval(() => {
      const list = sections();
      if (!list.length) return;
      const next = currentSection + 1 >= list.length ? 0 : currentSection + 1;
      scrollToSection(next);
    }, 5200);
  };

  const setAudioState = async (active) => {
    const audio = $("#weddingAudio");
    const button = $("#audioToggle");
    if (!audio || !button) return;
    button.classList.toggle("active", active);
    if (!active) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      button.classList.remove("active");
    }
  };

  const openInvitation = () => {
    document.body.classList.add("opened");
    window.scrollTo(0, 0);
    setAudioState(true);
    window.setTimeout(() => setAutoState(true), 900);
  };

  const setupReveal = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.18 },
    );
    $$(".reveal").forEach((node) => observer.observe(node));
  };

  const setupActiveNav = () => {
    const navButtons = $$(".bottom-nav [data-target]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const list = sections();
          currentSection = list.indexOf(entry.target);
          navButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.target === `#${entry.target.id}`);
          });
        });
      },
      { threshold: 0.56 },
    );
    sections().forEach((node) => observer.observe(node));
  };

  const setupControls = () => {
    $("#openInvitation")?.addEventListener("click", openInvitation);
    $("#audioToggle")?.addEventListener("click", () => {
      const isActive = $("#audioToggle")?.classList.contains("active");
      setAudioState(!isActive);
    });
    $("#readToggle")?.addEventListener("click", () => setAutoState(!autoActive));
    $("#topButton")?.addEventListener("click", () => scrollToSection(0));
    $$(".bottom-nav [data-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = $(button.dataset.target);
        const list = sections();
        if (target) {
          currentSection = list.indexOf(target);
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  };

  const setupGallery = () => {
    $$(".gallery-item").forEach((button) => {
      button.addEventListener("click", () => {
        const src = button.dataset.lightbox;
        if (!src) return;
        const overlay = document.createElement("div");
        overlay.className = "lightbox";
        overlay.innerHTML = `<img src="${src}" alt="">`;
        overlay.addEventListener("click", () => overlay.remove());
        document.body.appendChild(overlay);
      });
    });
  };

  const setupForm = () => {
    $("#rsvpForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const note = $("#formNote");
      if (note) note.textContent = "Ucapan tersimpan untuk mode preview lokal.";
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyGuest();
    updateCountdown();
    setupReveal();
    setupActiveNav();
    setupControls();
    setupGallery();
    setupForm();
    window.setInterval(updateCountdown, 1000);
  });

  document.addEventListener("visibilitychange", () => {
    const audio = $("#weddingAudio");
    if (document.hidden) audio?.pause();
    else if ($("#audioToggle")?.classList.contains("active")) setAudioState(true);
  });
})();
