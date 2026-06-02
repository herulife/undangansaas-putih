import "./styles.css";

const weddingDate = new Date("2026-06-02T08:00:00+07:00").getTime();
const sectionPauseMs = 3600;

const bySelector = <T extends Element>(selector: string): T | null => document.querySelector<T>(selector);
const allBySelector = <T extends Element>(selector: string): T[] => Array.from(document.querySelectorAll<T>(selector));

const cleanGuestName = (value: string | null): string => {
  const fallback = "Tamu Undangan";
  if (!value) return fallback;
  const parser = document.createElement("span");
  parser.textContent = value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();
  return parser.textContent?.slice(0, 80) || fallback;
};

const guestName = cleanGuestName(new URLSearchParams(window.location.search).get("to"));
allBySelector<HTMLElement>("[data-guest]").forEach((node) => {
  node.textContent = guestName;
});
const nameInput = bySelector<HTMLInputElement>("[data-name-input]");
if (nameInput) nameInput.value = guestName === "Tamu Undangan" ? "" : guestName;

let audio: HTMLAudioElement | null = null;
let audioIsPlaying = true;
let autoReadActive = false;
let autoReadTimer: number | null = null;
let autoReadIndex = 0;

const cover = bySelector<HTMLElement>("#cover");
const audioButton = bySelector<HTMLButtonElement>("[data-audio]");
const readButton = bySelector<HTMLButtonElement>("[data-read]");
const sections = allBySelector<HTMLElement>("[data-section]");

const getAudio = (): HTMLAudioElement => {
  if (!audio) {
    audio = new Audio("./assets/audio/background-music.mp3");
    audio.loop = true;
    audio.preload = "none";
  }
  return audio;
};

const setAudioState = (isPlaying: boolean): void => {
  audioIsPlaying = isPlaying;
  audioButton?.classList.toggle("is-playing", isPlaying);
  audioButton?.setAttribute("aria-label", isPlaying ? "Matikan musik" : "Putar musik");
};

const playAudio = (): void => {
  const activeAudio = getAudio();
  const result = activeAudio.play();
  setAudioState(true);
  if (result) {
    result.catch(() => setAudioState(false));
  }
};

const pauseAudio = (): void => {
  audio?.pause();
  setAudioState(false);
};

const updateCountdown = (): void => {
  const distance = Math.max(0, weddingDate - Date.now());
  const days = Math.floor(distance / 86_400_000);
  const hours = Math.floor((distance % 86_400_000) / 3_600_000);
  const minutes = Math.floor((distance % 3_600_000) / 60_000);
  const seconds = Math.floor((distance % 60_000) / 1000);
  const values: Record<string, number> = { days, hours, minutes, seconds };

  Object.entries(values).forEach(([key, value]) => {
    const node = bySelector<HTMLElement>(`[data-count="${key}"]`);
    if (node) node.textContent = String(value).padStart(2, "0");
  });
};

const updateReadState = (): void => {
  readButton?.classList.toggle("is-active", autoReadActive);
  readButton?.setAttribute("aria-label", autoReadActive ? "Hentikan auto-scroll" : "Jalankan auto-scroll");
};

const stopAutoRead = (): void => {
  autoReadActive = false;
  if (autoReadTimer !== null) window.clearTimeout(autoReadTimer);
  autoReadTimer = null;
  updateReadState();
};

const nextVisibleSectionIndex = (): number => {
  const nextIndex = sections.findIndex((section) => section.offsetTop > window.scrollY + 96);
  return nextIndex === -1 ? 0 : nextIndex;
};

const runAutoRead = (): void => {
  if (!autoReadActive) return;
  const target = sections[autoReadIndex];
  if (!target) {
    stopAutoRead();
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  autoReadIndex += 1;
  autoReadTimer = window.setTimeout(runAutoRead, sectionPauseMs);
};

const startAutoRead = (reset = false): void => {
  if (autoReadTimer !== null) window.clearTimeout(autoReadTimer);
  autoReadActive = true;
  if (reset) autoReadIndex = Math.max(1, nextVisibleSectionIndex());
  updateReadState();
  runAutoRead();
};

const openInvitation = (): void => {
  cover?.classList.add("is-hidden");
  document.body.classList.add("is-open");
  window.scrollTo({ top: 0, behavior: "instant" });
  playAudio();
  window.setTimeout(() => startAutoRead(true), 700);
};

const setupReveal = (): void => {
  const revealNodes = allBySelector<HTMLElement>(".reveal");
  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  revealNodes.forEach((node) => observer.observe(node));
};

const setupGallery = (): void => {
  const lightbox = bySelector<HTMLDialogElement>("[data-lightbox]");
  const image = bySelector<HTMLImageElement>("[data-lightbox-image]");
  const close = bySelector<HTMLButtonElement>("[data-lightbox-close]");
  if (!lightbox || !image) return;

  allBySelector<HTMLButtonElement>("[data-gallery]").forEach((button) => {
    button.addEventListener("click", () => {
      const src = button.dataset.gallery;
      if (!src) return;
      image.src = src;
      if (!lightbox.open) lightbox.showModal();
    });
  });

  close?.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
};

const setupRsvp = (): void => {
  const form = bySelector<HTMLFormElement>("[data-rsvp]");
  const note = bySelector<HTMLElement>("[data-form-note]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!note) return;
    note.textContent = "Ucapan tersimpan untuk mode preview lokal.";
    window.setTimeout(() => {
      note.textContent = "";
    }, 2600);
  });
};

bySelector<HTMLButtonElement>("[data-open]")?.addEventListener("click", openInvitation);
audioButton?.addEventListener("click", () => {
  if (audioIsPlaying) pauseAudio();
  else playAudio();
});
readButton?.addEventListener("click", () => {
  if (autoReadActive) stopAutoRead();
  else startAutoRead(true);
});
bySelector<HTMLButtonElement>("[data-top]")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) audio?.pause();
  else if (audioIsPlaying && document.body.classList.contains("is-open")) playAudio();
});

updateCountdown();
window.setInterval(updateCountdown, 1000);
setupReveal();
setupGallery();
setupRsvp();
