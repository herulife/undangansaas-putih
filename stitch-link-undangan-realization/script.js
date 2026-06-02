const screens = Array.from(document.querySelectorAll("[data-screen]"));
const routeControls = Array.from(document.querySelectorAll("[data-route]"));
const navLinks = Array.from(document.querySelectorAll(".main-nav a"));
const toast = document.querySelector("#toast");
const confettiCanvas = document.querySelector("#confetti");

let toastTimer = 0;
let confettiFrame = 0;
let confettiParticles = [];

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function showScreen(route) {
  const fallback = "home";
  const next = screens.some((screen) => screen.dataset.screen === route) ? route : fallback;

  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === next);
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.route === next);
  });

  window.location.hash = next;
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (next === "publish") {
    startConfetti();
  } else {
    stopConfetti();
  }
}

routeControls.forEach((control) => {
  control.addEventListener("click", (event) => {
    event.preventDefault();
    showScreen(control.dataset.route);
  });
});

window.addEventListener("hashchange", () => {
  showScreen(window.location.hash.replace("#", "") || "home");
});

document.querySelector("#sendOtp")?.addEventListener("click", () => {
  const phone = document.querySelector("#phoneInput").value.trim();
  if (!phone) {
    showToast("Masukkan nomor WhatsApp dulu.");
    return;
  }
  showToast("OTP simulasi 123456 terkirim.");
  showScreen("otp");
});

document.querySelector("#verifyOtp")?.addEventListener("click", () => {
  const code = Array.from(document.querySelectorAll(".otp-box"))
    .map((input) => input.value)
    .join("");

  if (code !== "123456") {
    showToast("OTP salah. Gunakan 123456 untuk prototype.");
    return;
  }

  showToast("Login berhasil.");
  showScreen("method");
});

document.querySelector("#copyLink")?.addEventListener("click", async () => {
  const input = document.querySelector("#inviteLink");
  try {
    await navigator.clipboard.writeText(input.value);
    showToast("Link berhasil disalin.");
  } catch {
    input.select();
    document.execCommand("copy");
    showToast("Link berhasil disalin.");
  }
});

document.querySelector("#openGuest")?.addEventListener("click", () => {
  document.querySelector(".guest-cover")?.classList.add("is-open");
  showToast("Undangan tamu dibuka.");
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
  });
});

document.querySelectorAll(".pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".pill").forEach((item) => item.classList.remove("active"));
    pill.classList.add("active");
  });
});

document.querySelectorAll(".custom-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".custom-tabs button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    showToast(`Panel ${button.textContent} aktif.`);
  });
});

document.querySelector(".guest-form button")?.addEventListener("click", () => {
  showToast("Ucapan tamu tersimpan di prototype.");
});

function resizeConfetti() {
  if (!confettiCanvas) return;
  const rect = confettiCanvas.getBoundingClientRect();
  confettiCanvas.width = Math.max(1, Math.floor(rect.width));
  confettiCanvas.height = Math.max(1, Math.floor(rect.height));
}

function createParticle() {
  return {
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height - confettiCanvas.height,
    size: Math.random() * 8 + 4,
    speed: Math.random() * 1.8 + 1,
    angle: Math.random() * Math.PI * 2,
    spin: Math.random() * 0.2 - 0.1,
    color: ["#004225", "#d4af37", "#735c00", "#fff8f5"][Math.floor(Math.random() * 4)],
  };
}

function startConfetti() {
  if (!confettiCanvas || confettiFrame) return;
  resizeConfetti();
  confettiParticles = Array.from({ length: 90 }, createParticle);
  const context = confettiCanvas.getContext("2d");

  const tick = () => {
    context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParticles.forEach((particle) => {
      particle.y += particle.speed;
      particle.x += Math.sin(particle.angle) * 1.2;
      particle.angle += particle.spin;
      if (particle.y > confettiCanvas.height + 20) {
        Object.assign(particle, createParticle(), { y: -20 });
      }
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.angle);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      context.restore();
    });
    confettiFrame = requestAnimationFrame(tick);
  };

  tick();
}

function stopConfetti() {
  if (confettiFrame) {
    cancelAnimationFrame(confettiFrame);
    confettiFrame = 0;
  }
}

window.addEventListener("resize", resizeConfetti);

showScreen(window.location.hash.replace("#", "") || "home");
