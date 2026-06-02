const invitationConfig = {
  couple: "Raka & Dinda",
  eventDate: "2026-11-22T08:00:00+07:00",
  venue: "Gedung Pakuan, Bandung",
  mapQuery: "Gedung Pakuan Bandung",
  shareUrl: "https://linkundangan.com/inv/raka-dinda",
  shareText:
    "Dengan penuh kebahagiaan, kami mengundang Bapak/Ibu/Saudara/i ke pernikahan Raka & Dinda.",
};

const state = {
  isOpen: false,
  isMusicOn: false,
  isReading: false,
  readFrame: null,
  readLastTime: 0,
  audioContext: null,
  masterGain: null,
  oscillators: [],
  toastTimer: null,
  mapLoaded: false,
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const cover = $("#cover");
const openButton = $("#openInvitation");
const musicToggle = $("#musicToggle");
const readToggle = $("#readToggle");
const calendarBtn = $("#calendarBtn");
const toast = $("#toast");
const mapFrame = $("#mapFrame");
const loadMapBtn = $("#loadMapBtn");
const rsvpForm = $("#rsvpForm");
const guestbook = $("#guestbook");
const lightbox = $("#lightbox");
const lightboxImage = $("#lightboxImage");
const lightboxClose = $("#lightboxClose");

function showToast(message) {
  clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

function openInvitation() {
  if (state.isOpen) return;
  state.isOpen = true;
  cover.classList.add("is-opened");
  document.body.classList.remove("is-locked");
  document.body.classList.add("invitation-open");
  window.scrollTo(0, 0);
  toggleMusic(true);
  showToast("Undangan dibuka. Selamat menikmati.");
  window.setTimeout(() => startAutoRead(), 2200);
}

function setupMusic() {
  if (state.audioContext) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const tones = [261.63, 329.63, 392, 493.88];
  const oscillators = tones.map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index % 2 === 0 ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.value = index === 0 ? 0.16 : 0.055;
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    return { oscillator, gain };
  });

  state.audioContext = context;
  state.masterGain = master;
  state.oscillators = oscillators;
}

function toggleMusic(forceOn) {
  setupMusic();
  if (!state.audioContext || !state.masterGain) {
    showToast("Browser ini belum mendukung audio sintetis.");
    return;
  }

  const next = typeof forceOn === "boolean" ? forceOn : !state.isMusicOn;
  state.isMusicOn = next;

  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }

  const targetGain = next ? 0.035 : 0;
  state.masterGain.gain.cancelScheduledValues(state.audioContext.currentTime);
  state.masterGain.gain.linearRampToValueAtTime(
    targetGain,
    state.audioContext.currentTime + 0.35
  );

  musicToggle.classList.toggle("is-active", next);
  musicToggle.setAttribute("aria-label", next ? "Matikan musik" : "Putar musik");
}

function startAutoRead() {
  if (state.isReading || !state.isOpen) return;
  state.isReading = true;
  state.readLastTime = performance.now();
  readToggle.classList.add("is-active", "is-reading");
  readToggle.setAttribute("aria-label", "Jeda auto scroll");
  state.readFrame = requestAnimationFrame(autoReadStep);
}

function stopAutoRead() {
  state.isReading = false;
  readToggle.classList.remove("is-active", "is-reading");
  readToggle.setAttribute("aria-label", "Auto scroll");
  if (state.readFrame) cancelAnimationFrame(state.readFrame);
  state.readFrame = null;
}

function autoReadStep(time) {
  if (!state.isReading) return;
  const delta = Math.min(time - state.readLastTime, 48);
  state.readLastTime = time;
  const bottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 20;

  if (bottom) {
    stopAutoRead();
    return;
  }

  window.scrollBy(0, delta * 0.028);
  state.readFrame = requestAnimationFrame(autoReadStep);
}

function updateCountdown() {
  const target = new Date(invitationConfig.eventDate).getTime();
  const now = Date.now();
  const diff = Math.max(target - now, 0);
  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;

  $("#days").textContent = String(Math.floor(diff / day)).padStart(2, "0");
  $("#hours").textContent = String(Math.floor((diff % day) / hour)).padStart(2, "0");
  $("#minutes").textContent = String(Math.floor((diff % hour) / minute)).padStart(2, "0");
  $("#seconds").textContent = String(Math.floor((diff % minute) / 1000)).padStart(2, "0");
}

function setupRevealAnimation() {
  const reveals = $$(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          element.classList.remove("is-exiting");
        } else if (element.classList.contains("is-visible")) {
          element.classList.remove("is-visible");
          element.classList.add("is-exiting");
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.18 }
  );

  reveals.forEach((element) => observer.observe(element));
}

function setupParallax() {
  const parallaxItems = $$("[data-parallax]");
  let ticking = false;

  const update = () => {
    const scrollY = window.scrollY || 0;
    document.documentElement.style.setProperty("--page-scroll", String(scrollY));

    parallaxItems.forEach((item) => {
      if (item.classList.contains("cover-photo")) return;
      const speed = Number(item.dataset.parallax || 0);
      const rect = item.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      item.style.transform = `translate3d(0, ${centerOffset * speed}px, 0)`;
    });

    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });

  update();
}

function setupGallery() {
  $$(".gallery-item").forEach((button) => {
    button.addEventListener("click", () => {
      lightboxImage.src = button.dataset.gallery;
      lightbox.hidden = false;
      stopAutoRead();
    });
  });

  const close = () => {
    lightbox.hidden = true;
    lightboxImage.src = "";
  };

  lightboxClose.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) close();
  });
}

function loadMap() {
  if (state.mapLoaded) return;
  state.mapLoaded = true;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(
    invitationConfig.mapQuery
  )}&output=embed`;
  mapFrame.innerHTML = `<iframe title="Peta lokasi acara" src="${src}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}

function setupMapLazyLoad() {
  loadMapBtn.addEventListener("click", loadMap);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && state.isOpen) {
          loadMap();
          observer.disconnect();
        }
      });
    },
    { rootMargin: "160px" }
  );
  observer.observe($("#maps"));
}

function getStoredWishes() {
  const fallback = [
    {
      name: "Maya",
      attendance: "Hadir",
      message: "Selamat berbahagia Raka dan Dinda. Semoga menjadi keluarga sakinah, mawaddah, warahmah.",
    },
    {
      name: "Arief",
      attendance: "Belum pasti",
      message: "Doa terbaik untuk kalian berdua. Semoga acaranya lancar.",
    },
  ];

  try {
    const stored = JSON.parse(localStorage.getItem("linkUndanganWishes") || "null");
    return Array.isArray(stored) && stored.length ? stored : fallback;
  } catch {
    return fallback;
  }
}

function saveWishes(wishes) {
  try {
    localStorage.setItem("linkUndanganWishes", JSON.stringify(wishes.slice(0, 12)));
  } catch {
    // Local storage can be blocked in some previews; the guestbook still works in memory.
  }
}

function renderGuestbook() {
  const wishes = getStoredWishes();
  guestbook.innerHTML = wishes
    .slice(0, 4)
    .map(
      (wish) => `
        <article class="wish">
          <strong>${escapeHtml(wish.name)} <span>- ${escapeHtml(wish.attendance)}</span></strong>
          <p>${escapeHtml(wish.message || "Terima kasih atas undangannya.")}</p>
        </article>
      `
    )
    .join("");
}

function setupRsvp() {
  renderGuestbook();
  rsvpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(rsvpForm);
    const wish = {
      name: String(formData.get("name") || "").trim(),
      attendance: String(formData.get("attendance") || "Hadir"),
      message: String(formData.get("message") || "").trim(),
    };

    if (!wish.name) {
      showToast("Nama tamu perlu diisi.");
      return;
    }

    const wishes = [wish, ...getStoredWishes()];
    saveWishes(wishes);
    renderGuestbook();
    rsvpForm.reset();
    showToast("Ucapan tersimpan di preview lokal.");
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function copyText(text, successMessage) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast(successMessage);
  } catch {
    showToast("Tidak bisa menyalin otomatis. Silakan salin manual.");
  }
}

function setupCopyAndShare() {
  $$(".copy-btn").forEach((button) => {
    button.addEventListener("click", () => {
      copyText(button.dataset.copy || "", "Nomor berhasil disalin.");
    });
  });

  $("#copyLinkBtn").addEventListener("click", () => {
    copyText(invitationConfig.shareUrl, "Link undangan berhasil disalin.");
  });

  $("#shareBtn").addEventListener("click", async () => {
    const payload = {
      title: `${invitationConfig.couple} - Link Undangan`,
      text: invitationConfig.shareText,
      url: invitationConfig.shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // If the user cancels native share, fall back to copy.
      }
    }

    copyText(`${payload.text}\n${payload.url}`, "Teks undangan berhasil disalin.");
  });
}

function setupCalendar() {
  calendarBtn.addEventListener("click", () => {
    const start = new Date(invitationConfig.eventDate);
    const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
    const format = (date) =>
      date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Link Undangan//Premium Template//ID",
      "BEGIN:VEVENT",
      `UID:raka-dinda-${Date.now()}@linkundangan.local`,
      `DTSTAMP:${format(new Date())}`,
      `DTSTART:${format(start)}`,
      `DTEND:${format(end)}`,
      `SUMMARY:Pernikahan ${invitationConfig.couple}`,
      `LOCATION:${invitationConfig.venue}`,
      `DESCRIPTION:${invitationConfig.shareText}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "raka-dinda-save-the-date.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("File kalender dibuat.");
  });
}

function setupNavigation() {
  const navLinks = $$(".bottom-nav a");
  const sections = navLinks
    .map((link) => ({ link, section: $(link.getAttribute("href")) }))
    .filter((item) => item.section);

  navLinks.forEach((link) => {
    link.addEventListener("click", () => stopAutoRead());
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const active = sections.find((item) => item.section === entry.target);
        if (!active) return;
        navLinks.forEach((link) => link.classList.remove("is-active"));
        active.link.classList.add("is-active");
      });
    },
    { rootMargin: "-35% 0px -45% 0px", threshold: 0.01 }
  );

  sections.forEach((item) => observer.observe(item.section));
}

function setupManualScrollPause() {
  ["wheel", "touchstart", "keydown"].forEach((eventName) => {
    window.addEventListener(
      eventName,
      (event) => {
        if (!state.isReading) return;
        if (eventName === "keydown") {
          const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
          if (!keys.includes(event.key)) return;
        }
        stopAutoRead();
      },
      { passive: true }
    );
  });
}

openButton.addEventListener("click", openInvitation);
musicToggle.addEventListener("click", () => toggleMusic());
readToggle.addEventListener("click", () => {
  if (state.isReading) stopAutoRead();
  else startAutoRead();
});

setupRevealAnimation();
setupParallax();
setupGallery();
setupMapLazyLoad();
setupRsvp();
setupCopyAndShare();
setupCalendar();
setupNavigation();
setupManualScrollPause();
updateCountdown();
window.setInterval(updateCountdown, 1000);
