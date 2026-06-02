(() => {
  const sectionPauseMs = 1900;
  const openAutoStartDelayMs = 350;
  const minSectionGap = 120;

  const style = document.createElement('style');
  style.textContent = `
    .kat-scroll-controls {
      position: fixed;
      right: 10px;
      top: 50%;
      z-index: 2147483000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transform: translateY(-50%);
      pointer-events: auto;
    }

    .kat-scroll-button {
      width: 42px;
      min-height: 42px;
      border: 0;
      border-radius: 10px 0 10px 0;
      background: rgba(255, 255, 255, .94);
      color: #6f2837;
      box-shadow: 0 8px 20px rgba(70, 28, 35, .16), 0 2px 6px rgba(70, 28, 35, .12);
      cursor: pointer;
      display: grid;
      place-items: center;
      gap: 1px;
      padding: 5px 4px;
      font: 700 10px/1.05 Arial, sans-serif;
      transition: transform .2s ease, background .2s ease, color .2s ease;
    }

    .kat-scroll-button svg {
      width: 19px;
      height: 19px;
      display: block;
    }

    .kat-scroll-button path {
      fill: currentColor;
    }

    .kat-scroll-button:hover,
    .kat-scroll-button.active {
      background: #762434;
      color: #fff8ed;
      transform: translateX(-2px);
    }

    .kat-scroll-button.active svg {
      animation: kat-scroll-spin 4s linear infinite;
    }

    .kat-scroll-controls .music-outer {
      position: static !important;
      z-index: auto !important;
      bottom: auto !important;
      left: auto !important;
      display: grid !important;
      place-items: center;
      width: 42px;
      height: 42px;
      border-radius: 10px 0 10px 0;
      background: rgba(255, 255, 255, .94);
      box-shadow: 0 8px 20px rgba(70, 28, 35, .16), 0 2px 6px rgba(70, 28, 35, .12);
    }

    .kat-scroll-controls .music-outer .music-box {
      width: 34px !important;
      height: 34px !important;
      top: 0 !important;
      left: 0 !important;
      margin: 0 !important;
    }

    .kat-scroll-controls .music-outer .music-box.hide {
      left: 0 !important;
      opacity: .72;
    }

    .kat-scroll-controls .music-outer .music-box:hover {
      transform: scale(1.04);
    }

    .kat-scroll-controls .music-outer .music-box.playing:hover {
      transform: scale(1.04);
    }

    @keyframes kat-scroll-spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .kat-scroll-controls {
        right: 8px;
      }

      .kat-scroll-button {
        width: 38px;
        min-height: 38px;
        font-size: 9px;
      }

      .kat-scroll-controls .music-outer {
        width: 38px;
        height: 38px;
      }

      .kat-scroll-controls .music-outer .music-box {
        width: 31px !important;
        height: 31px !important;
      }
    }
  `;
  document.head.appendChild(style);

  const controls = document.createElement('div');
  controls.className = 'kat-scroll-controls';
  controls.setAttribute('aria-label', 'Kontrol scroll');
  controls.innerHTML = `
    <button class="kat-scroll-button kat-scroll-top" type="button" aria-label="Kembali ke atas">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 13.1 13.1 8.2a2 2 0 0 0-2.2 0l-7.2 4.9A1.65 1.65 0 0 0 4.6 16l6.4-4.3a1.8 1.8 0 0 1 2 0l6.4 4.3a1.65 1.65 0 0 0 .9-2.9Z"/></svg>
      <span>Top</span>
    </button>
    <button class="kat-scroll-button kat-scroll-read" type="button" aria-label="Auto scroll">
      <svg viewBox="0 0 30 30" aria-hidden="true"><path d="M15 3C9 3 4 7.5 3.1 13.4a1 1 0 0 0 2 .3A10 10 0 0 1 22.1 8L20 10l6 1-1-6-1.5 1.5A12 12 0 0 0 15 3Zm10.9 12.4a1 1 0 0 0-1 1A10 10 0 0 1 7.5 21.5L9 20l-6-1 1 6 2-2A12 12 0 0 0 26.9 16.6a1 1 0 0 0-1-1.2Z"/></svg>
      <span>Read</span>
    </button>
  `;

  let frameId = null;
  let pauseId = null;
  let openStartId = null;
  let running = false;

  function maxScrollTop() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function readButton() {
    return controls.querySelector('.kat-scroll-read');
  }

  function setRunning(value) {
    running = value;
    const button = readButton();
    if (button) button.classList.toggle('active', value);
  }

  function clearTimers() {
    if (frameId) cancelAnimationFrame(frameId);
    if (pauseId) clearTimeout(pauseId);
    if (openStartId) clearTimeout(openStartId);
    frameId = null;
    pauseId = null;
    openStartId = null;
  }

  function stopAutoScroll() {
    clearTimers();
    setRunning(false);
  }

  function isReadableSection(element) {
    if (!element || element.closest('[hidden], .d-none')) return false;
    if (element.classList.contains('hide') || element.closest('.hide')) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 80 && rect.height > 80;
  }

  function sectionStops() {
    const maxScroll = Math.max(maxScrollTop(), 0);
    const selector = [
      'section[data-section-order]',
      'section#toRsvp',
      'section.wedding-gift-outer',
      'section.wedding-gift-wrap',
      'section.kado-wrapper',
      'section#wedding-gifts'
    ].join(',');

    const stops = [...document.querySelectorAll(selector)]
      .filter(isReadableSection)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: clamp(Math.round(window.scrollY + rect.top), 0, maxScroll),
          height: Math.round(rect.height)
        };
      })
      .sort((a, b) => a.top - b.top);

    return stops.reduce((unique, stop) => {
      const previous = unique[unique.length - 1];
      if (!previous || Math.abs(stop.top - previous.top) >= minSectionGap) {
        unique.push(stop);
      } else if (stop.height > previous.height) {
        unique[unique.length - 1] = stop;
      }
      return unique;
    }, []);
  }

  function nextSectionTop() {
    const currentTop = window.scrollY;
    const stops = sectionStops();
    const next = stops.find((stop) => stop.top > currentTop + 70);
    if (next) return next.top;
    const maxScroll = maxScrollTop();
    return currentTop < maxScroll - 120 ? maxScroll : null;
  }

  function scheduleNextSection() {
    if (!running) return;
    if (window.scrollY >= maxScrollTop() - 8) {
      stopAutoScroll();
      return;
    }
    pauseId = setTimeout(scrollToNextSection, sectionPauseMs);
  }

  function animateTo(targetTop) {
    const startTop = window.scrollY;
    const distance = targetTop - startTop;
    if (Math.abs(distance) < 5) {
      scheduleNextSection();
      return;
    }

    const duration = clamp(Math.abs(distance) * 4.8, 720, 2200);
    let startTime = 0;

    function scrollFrame(timestamp) {
      if (!running) return;
      if (!startTime) startTime = timestamp;
      const progress = clamp((timestamp - startTime) / duration, 0, 1);
      const eased = progress < .5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      window.scrollTo(0, Math.round(startTop + (distance * eased)));

      if (progress < 1) {
        frameId = requestAnimationFrame(scrollFrame);
      } else {
        frameId = null;
        scheduleNextSection();
      }
    }

    frameId = requestAnimationFrame(scrollFrame);
  }

  function scrollToNextSection() {
    if (!running) return;
    clearTimers();
    const targetTop = nextSectionTop();
    if (targetTop === null) {
      stopAutoScroll();
      return;
    }
    animateTo(targetTop);
  }

  function startAutoScroll() {
    clearTimers();
    setRunning(true);
    scrollToNextSection();
  }

  function scrollTop() {
    stopAutoScroll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function moveMusicButton() {
    const musicOuter = document.querySelector('.music-outer');
    const read = controls.querySelector('.kat-scroll-read');
    if (!musicOuter || !read || musicOuter.closest('.kat-scroll-controls')) return;

    ['data-aos', 'data-aos-duration', 'data-aos-delay'].forEach((attribute) => {
      musicOuter.removeAttribute(attribute);
    });
    musicOuter.classList.remove('aos-init', 'aos-animate');
    musicOuter.setAttribute('aria-label', 'Kontrol musik');
    controls.insertBefore(musicOuter, read);
  }

  function isOpenInvitationTrigger(target) {
    if (!target || !target.closest) return false;
    return Boolean(target.closest([
      '#startToExplore',
      '[onclick*="startTheJourney"]',
      '.top-cover .link',
      '.open-invitation',
      '.btn-open',
      '[data-open-invitation]',
      '.cover-button'
    ].join(',')));
  }

  function scheduleOpenAutoStart() {
    if (openStartId) clearTimeout(openStartId);
    openStartId = setTimeout(() => {
      openStartId = null;
      if (!running) startAutoScroll();
    }, openAutoStartDelayMs);
  }

  function bind() {
    if (document.querySelector('.kat-scroll-controls')) return;
    document.body.appendChild(controls);
    moveMusicButton();
    setTimeout(moveMusicButton, 400);
    setTimeout(moveMusicButton, 1200);

    controls.querySelector('.kat-scroll-top').addEventListener('click', scrollTop);
    controls.querySelector('.kat-scroll-read').addEventListener('click', () => {
      if (running) stopAutoScroll();
      else startAutoScroll();
    });

    document.addEventListener('click', (event) => {
      if (!isOpenInvitationTrigger(event.target)) return;
      scheduleOpenAutoStart();
    }, true);

    ['wheel', 'touchstart'].forEach((eventName) => {
      window.addEventListener(eventName, (event) => {
        if (event.target && event.target.closest && event.target.closest('.kat-scroll-controls')) return;
        if (running) stopAutoScroll();
      }, { passive: true });
    });

    document.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key) && running) {
        stopAutoScroll();
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
