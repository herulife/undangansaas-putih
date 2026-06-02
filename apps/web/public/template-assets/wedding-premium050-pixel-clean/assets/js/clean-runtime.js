(() => {
  "use strict";

  const weddingDate = new Date("2026-06-02T08:00:00+07:00").getTime();
  const autoStep = 333;
  const autoDelay = 2000;
  const autoDuration = 999;
  const galleryImages = [];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let audio = null;
  let audioWanted = false;
  let autoReadTimer = 0;
  let autoReadActive = false;
  let animationFrame = 0;
  let sliderTimer = 0;

  const cleanGuestName = (value) => {
    const fallback = "Tamu Undangan";
    if (!value) return fallback;
    const holder = document.createElement("span");
    holder.textContent = value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();
    return holder.textContent.slice(0, 90) || fallback;
  };

  const smoothScrollTo = (targetY, duration = autoDuration) => {
    const startY = window.scrollY;
    const distance = Math.max(0, targetY) - startY;
    if (Math.abs(distance) < 2) return;
    const started = performance.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      window.scrollTo(0, startY + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const getAudio = () => {
    if (!audio) {
      audio = new Audio("./assets/audio/background-music.mp3");
      audio.loop = true;
      audio.preload = "none";
      window.audio = audio;
    }
    return audio;
  };

  const setAudioState = (playing) => {
    audioWanted = playing;
    const button = $(".backsound");
    if (!button) return;
    button.classList.toggle("play", playing);
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
    button.setAttribute("aria-label", playing ? "Matikan musik" : "Putar musik");
    button.setAttribute("title", playing ? "Matikan musik" : "Putar musik");
  };

  const playAudio = () => {
    const activeAudio = getAudio();
    const playResult = activeAudio.play();
    setAudioState(true);
    if (playResult) playResult.catch(() => setAudioState(false));
  };

  const pauseAudio = () => {
    getAudio().pause();
    setAudioState(false);
  };

  const updateCountdown = () => {
    const distance = Math.max(0, weddingDate - Date.now());
    const values = {
      countday: Math.floor(distance / 86_400_000),
      counthour: Math.floor((distance % 86_400_000) / 3_600_000),
      countminute: Math.floor((distance % 3_600_000) / 60_000),
      countsecond: Math.floor((distance % 60_000) / 1000),
    };

    Object.entries(values).forEach(([className, value]) => {
      $$(`.${className}`).forEach((node) => {
        node.textContent = String(value).padStart(2, "0");
      });
    });
  };

  const syncScrollAnimations = () => {
    const triggerY = window.scrollY + window.innerHeight / 1.75;
    $$(".do-animate:not(.not-scrollanimate), .animate-init:not(.not-scrollanimate)").forEach((node) => {
      const top = node.getBoundingClientRect().top + window.scrollY;
      node.classList.toggle("animate", triggerY > top);
    });
  };

  const scheduleScrollAnimations = () => {
    if (animationFrame) return;
    animationFrame = requestAnimationFrame(() => {
      animationFrame = 0;
      syncScrollAnimations();
    });
  };

  const activateStartAnimations = () => {
    $$(".not-scrollanimate.do-animate, .not-scrollanimate.animate-init, .animate-start").forEach((node) => {
      node.classList.add("animate");
    });
    syncScrollAnimations();
  };

  const setAutoReadState = (active) => {
    autoReadActive = active;
    const button = $("#button-mode-read");
    const icon = button?.querySelector("svg, i");
    button?.classList.toggle("active", active);
    icon?.classList.toggle("animationSpin", active);
  };

  const stopAutoRead = () => {
    clearTimeout(autoReadTimer);
    autoReadTimer = 0;
    setAutoReadState(false);
    document.body.style.overflow = "";
  };

  const runAutoRead = () => {
    if (!autoReadActive) return;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY >= maxY - 4) {
      stopAutoRead();
      return;
    }
    smoothScrollTo(Math.min(maxY, window.scrollY + autoStep));
    autoReadTimer = window.setTimeout(runAutoRead, autoDelay);
  };

  const startAutoRead = () => {
    clearTimeout(autoReadTimer);
    setAutoReadState(true);
    document.body.style.overflow = "hidden";
    autoReadTimer = window.setTimeout(runAutoRead, 150);
  };

  const toggleAutoRead = () => {
    if (autoReadActive) stopAutoRead();
    else startAutoRead();
  };

  const openInvitation = () => {
    const cover = $("#coverModal");
    document.body.classList.add("clean-open");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.documentElement.style.overflowY = "auto";
    $$(".modal-backdrop").forEach((node) => node.remove());
    if (cover) {
      cover.classList.remove("show");
      cover.setAttribute("aria-hidden", "true");
      cover.style.display = "none";
    }
    window.scrollTo(0, 0);
    activateStartAnimations();
    playAudio();
    window.setTimeout(startAutoRead, 750);
  };

  const applyGuestName = () => {
    const params = new URLSearchParams(window.location.search);
    let guestName = params.get("to");
    if (!guestName) {
      const parts = window.location.pathname.split("/to/");
      if (parts.length > 1) guestName = decodeURIComponent(parts.at(-1));
    }
    const cleanName = cleanGuestName(guestName);
    $$(".penerima").forEach((node) => {
      node.textContent = cleanName;
    });
    $$("input.input-name").forEach((node) => {
      node.value = cleanName === "Tamu Undangan" ? "" : cleanName;
    });
    $$("input.verfiedname").forEach((node) => {
      node.value = cleanName === "Tamu Undangan" ? "" : cleanName;
    });
  };

  const parseSliderSources = (value) => {
    if (!value) return [];
    try {
      return JSON.parse(value.replaceAll("\\/", "/"));
    } catch (error) {
      return [];
    }
  };

  const setupBackgroundSlider = () => {
    const header = $(".bg-header");
    const sources = parseSliderSources(header?.dataset.zsSrc);
    if (!header || sources.length < 2) return;
    let index = 0;
    header.style.backgroundImage = `linear-gradient(360deg, #ffffff6e, #ffffff38), url("${sources[index]}")`;
    clearInterval(sliderTimer);
    sliderTimer = window.setInterval(() => {
      index = (index + 1) % sources.length;
      header.style.backgroundImage = `linear-gradient(360deg, #ffffff6e, #ffffff38), url("${sources[index]}")`;
    }, Number(header.dataset.zsInterval || 4500));
  };

  const setupNavigation = () => {
    $$(".navmenu li[data-targetid]").forEach((item) => {
      item.addEventListener("click", () => {
        const target = item.dataset.targetid ? $(item.dataset.targetid) : null;
        if (target) smoothScrollTo(target.getBoundingClientRect().top + window.scrollY, 800);
      });
    });

    $(".navmenu .humberger-btn")?.addEventListener("click", () => {
      $(".navmenu .navigation")?.classList.toggle("open");
    });

    $("#button-to-top")?.addEventListener("click", (event) => {
      event.preventDefault();
      smoothScrollTo(0, 800);
    });

    $("#button-mode-read")?.addEventListener("click", (event) => {
      event.preventDefault();
      toggleAutoRead();
    });
  };

  const setupAudioButton = () => {
    const button = $(".backsound");
    if (!button) return;
    setAudioState(button.classList.contains("play"));
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (audioWanted) pauseAudio();
      else playAudio();
    });
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      button.click();
    });
  };

  const setupForms = () => {
    $$("form").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const note = document.createElement("div");
        note.className = "local-mode-note";
        note.textContent = "Mode lokal: pengiriman data dimatikan.";
        form.appendChild(note);
        window.setTimeout(() => note.remove(), 2600);
      });
    });
  };

  const closeLightbox = () => {
    $(".clean-lightbox")?.remove();
  };

  const openLightbox = (src) => {
    closeLightbox();
    const overlay = document.createElement("div");
    overlay.className = "clean-lightbox";
    overlay.innerHTML = `<button type="button" aria-label="Tutup">&times;</button><img alt="Galeri" src="${src}">`;
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.tagName === "BUTTON") closeLightbox();
    });
    document.body.appendChild(overlay);
  };

  const setupGallery = () => {
    $$("#nav-galeri img, #nav-cerita ul img, #nav-cerita .story img").forEach((image) => {
      const src = image.getAttribute("src");
      if (!src) return;
      galleryImages.push(src);
      image.style.cursor = "pointer";
      image.addEventListener("click", () => openLightbox(src));
    });
  };

  const setupInitialState = () => {
    document.body.classList.add("clean-ready", "modal-open");
    document.body.style.overflow = "hidden";
    const cover = $("#coverModal");
    if (cover) {
      cover.classList.add("show");
      cover.setAttribute("aria-hidden", "false");
      cover.style.display = "block";
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupInitialState();
    applyGuestName();
    setupAudioButton();
    setupNavigation();
    setupForms();
    setupGallery();
    setupBackgroundSlider();
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
    window.addEventListener("scroll", scheduleScrollAnimations, { passive: true });
    window.addEventListener("resize", scheduleScrollAnimations);

    $$(".open-invitation").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        openInvitation();
      });
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio?.pause();
    else if (audioWanted && document.body.classList.contains("clean-open")) playAudio();
  });
})();
