(() => {
  "use strict";

  const weddingDate = new Date("2026-08-16T08:00:00+07:00").getTime();
  const sliderImages = [
    "./assets/images/prewed-1.webp",
    "./assets/images/prewed-2.webp",
    "./assets/images/prewed-3.webp",
    "./assets/images/hero-couple.webp",
  ];
  const autoTargets = ["#couple", "#story", "#event", "#gallery", "#rsvp", ".gift", ".closing"];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let audio;
  let audioWanted = true;
  let autoRead = false;
  let autoTimer = 0;
  let autoIndex = 0;
  let sliderIndex = 0;
  let parallaxFrame = 0;

  const safeGuestName = (value) => {
    const fallback = "Tamu Undangan";
    if (!value) return fallback;
    const span = document.createElement("span");
    span.textContent = value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();
    return span.textContent.slice(0, 80) || fallback;
  };

  const applyGuestName = () => {
    const params = new URLSearchParams(location.search);
    let name = params.get("to");
    if (!name && location.pathname.includes("/to/")) name = decodeURIComponent(location.pathname.split("/to/").pop());
    const clean = safeGuestName(name);
    $$(".guest-name").forEach((node) => {
      node.textContent = clean;
    });
    const input = $(".rsvp-form input[name='name']");
    if (input && clean !== "Tamu Undangan") input.value = clean;
  };

  const getAudio = () => {
    if (!audio) {
      audio = new Audio("./assets/audio/sunda-kacapi-loop.wav");
      audio.loop = true;
      audio.preload = "none";
      window.audio = audio;
    }
    return audio;
  };

  const syncAudioButton = () => {
    const button = $("#audioToggle");
    if (!button) return;
    button.classList.toggle("active", audioWanted);
    button.setAttribute("aria-label", audioWanted ? "Matikan musik" : "Putar musik");
  };

  const playAudio = () => {
    audioWanted = true;
    syncAudioButton();
    const result = getAudio().play();
    if (result) result.catch(() => {
      audioWanted = false;
      syncAudioButton();
    });
  };

  const pauseAudio = () => {
    audioWanted = false;
    getAudio().pause();
    syncAudioButton();
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
      const node = $(`[data-count="${key}"]`);
      if (node) node.textContent = String(value).padStart(2, "0");
    });
  };

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  const setupReveals = () => {
    $$(".reveal").forEach((node) => revealObserver.observe(node));
  };

  const smoothTo = (selector, duration = 900) => {
    const target = typeof selector === "string" ? $(selector) : selector;
    if (!target) return;
    const start = scrollY;
    const end = target.getBoundingClientRect().top + scrollY;
    const distance = end - start;
    const started = performance.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const step = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      scrollTo(0, start + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const syncReadButton = () => {
    const button = $("#readToggle");
    if (!button) return;
    button.classList.toggle("active", autoRead);
    button.setAttribute("aria-label", autoRead ? "Jeda auto scroll" : "Mulai auto scroll");
  };

  const stopAutoRead = () => {
    autoRead = false;
    clearTimeout(autoTimer);
    autoTimer = 0;
    syncReadButton();
  };

  const runAutoRead = () => {
    if (!autoRead) return;
    const selector = autoTargets[autoIndex];
    const target = $(selector);
    if (!target) {
      stopAutoRead();
      return;
    }
    smoothTo(target, 1100);
    autoIndex += 1;
    if (autoIndex >= autoTargets.length) {
      autoTimer = setTimeout(stopAutoRead, 2600);
      return;
    }
    autoTimer = setTimeout(runAutoRead, 5200);
  };

  const startAutoRead = () => {
    clearTimeout(autoTimer);
    autoRead = true;
    autoIndex = 0;
    syncReadButton();
    autoTimer = setTimeout(runAutoRead, 900);
  };

  const setupSlider = () => {
    const slider = $(".hero__slider");
    if (!slider) return;
    setInterval(() => {
      sliderIndex = (sliderIndex + 1) % sliderImages.length;
      slider.style.backgroundImage = `linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 249, 231, 0.78)), url("${sliderImages[sliderIndex]}")`;
    }, 4700);
  };

  const updateParallax = () => {
    parallaxFrame = 0;
    const viewportCenter = innerHeight / 2;
    $$(".parallax-layer").forEach((node) => {
      const speed = Number(node.dataset.speed || 0);
      const rect = node.getBoundingClientRect();
      const centerDelta = rect.top + rect.height / 2 - viewportCenter;
      const y = Math.max(-72, Math.min(72, -centerDelta * speed));
      node.style.setProperty("--parallax-y", `${y.toFixed(1)}px`);
    });
  };

  const scheduleParallax = () => {
    if (parallaxFrame) return;
    parallaxFrame = requestAnimationFrame(updateParallax);
  };

  const setupParallax = () => {
    updateParallax();
    addEventListener("scroll", scheduleParallax, { passive: true });
    addEventListener("resize", scheduleParallax);
  };

  const setupGallery = () => {
    const lightbox = $("#lightbox");
    const image = $("#lightbox img");
    $$(".gallery-item").forEach((button) => {
      button.addEventListener("click", () => {
        if (!lightbox || !image) return;
        image.src = button.dataset.full || button.querySelector("img")?.src || "";
        lightbox.hidden = false;
        stopAutoRead();
      });
    });
    $("#lightbox button")?.addEventListener("click", () => {
      lightbox.hidden = true;
      image.removeAttribute("src");
    });
    lightbox?.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        lightbox.hidden = true;
        image.removeAttribute("src");
      }
    });
  };

  const setupControls = () => {
    $(".open-button")?.addEventListener("click", () => {
      $("#cover")?.classList.add("is-hidden");
      document.body.classList.add("invitation-open");
      scrollTo(0, 0);
      playAudio();
      setTimeout(startAutoRead, 850);
    });

    $("#toTop")?.addEventListener("click", () => {
      stopAutoRead();
      smoothTo("#top", 900);
    });

    $("#audioToggle")?.addEventListener("click", () => {
      if (audioWanted) pauseAudio();
      else playAudio();
    });

    $("#readToggle")?.addEventListener("click", () => {
      if (autoRead) stopAutoRead();
      else startAutoRead();
    });

    $$("[data-target]").forEach((button) => {
      button.addEventListener("click", () => {
        stopAutoRead();
        smoothTo(button.dataset.target, 800);
      });
    });
  };

  const setupForms = () => {
    $("#rsvpForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const name = safeGuestName(String(data.get("name") || "Tamu Undangan"));
      const message = String(data.get("message") || "Selamat berbahagia.").trim() || "Selamat berbahagia.";
      const wish = document.createElement("article");
      wish.innerHTML = `<strong>${name}</strong><p>${message.replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[char])}</p>`;
      $(".wishes")?.prepend(wish);
      form.reset();
    });

    $$("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy || "");
          button.textContent = "Tersalin";
          setTimeout(() => {
            button.textContent = "Salin Rekening";
          }, 1600);
        } catch {
          button.textContent = button.dataset.copy || "";
        }
      });
    });
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio?.pause();
    else if (audioWanted && document.body.classList.contains("invitation-open")) playAudio();
  });

  document.addEventListener("DOMContentLoaded", () => {
    applyGuestName();
    setupReveals();
    setupSlider();
    setupParallax();
    setupGallery();
    setupControls();
    setupForms();
    updateCountdown();
    syncAudioButton();
    syncReadButton();
    setInterval(updateCountdown, 1000);
    requestAnimationFrame(() => {
      $$(".hero__content, .cover__content").forEach((node) => node.classList.add("is-visible"));
    });
  });
})();
