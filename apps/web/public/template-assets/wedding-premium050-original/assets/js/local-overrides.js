(() => {
  const preservedInvitationNodes = [];
  const preserveInvitationNodes = () => {
    if (preservedInvitationNodes.length) return;
    document.querySelectorAll('#coverModal, .class-crush, .backsound, #fixed-btn2top, #fixed-btnread').forEach((node) => {
      preservedInvitationNodes.push(node);
    });
  };
  const restoreInvitationNodes = () => {
    preservedInvitationNodes.forEach((node) => {
      if (!document.body.contains(node)) document.body.appendChild(node);
    });
  };
  preserveInvitationNodes();
  const patchJqueryBodyOverwrite = () => {
    if (!window.jQuery || window.jQuery.fn.__localBodyPatch) return;
    const nativeHtml = window.jQuery.fn.html;
    window.jQuery.fn.html = function(value) {
      if (
        arguments.length &&
        this.filter('body').length &&
        typeof value === 'string' &&
        /Dilarang Cloning Template Linkundangan\.com/i.test(value)
      ) {
        restoreInvitationNodes();
        return this;
      }
      return nativeHtml.apply(this, arguments);
    };
    window.jQuery.fn.__localBodyPatch = true;
  };
  const showLocalNote = (form) => {
    const note = document.createElement('div');
    note.className = 'local-mode-note';
    note.textContent = 'Mode lokal: pengiriman data dimatikan.';
    form.appendChild(note);
    setTimeout(() => note.remove(), 2600);
  };
  const removeAntiCloneBlock = () => {
    document.querySelectorAll('div').forEach((node) => {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^:\(\s*Dilarang Cloning Template Linkundangan\.com$/i.test(text)) {
        node.remove();
      }
    });
  };
  const findOpenTarget = (event) => {
    if (event.target && event.target.closest) {
      const target = event.target.closest('.open-invitation');
      if (target) return target;
    }
    if (typeof event.composedPath !== 'function') return null;
    return event.composedPath().find((node) => node && node.classList && node.classList.contains('open-invitation')) || null;
  };
  const hideCover = () => {
    document.body.classList.remove('modal-open');
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
    document.body.style.paddingRight = '';
    document.querySelectorAll('.modal-backdrop').forEach((node) => node.remove());
    const cover = document.querySelector('#coverModal');
    if (!cover) return;
    cover.classList.remove('show');
    cover.setAttribute('aria-hidden', 'true');
    cover.style.setProperty('display', 'none', 'important');
    cover.style.top = '';
  };
  const setAudioButtonState = (isPlaying) => {
    const button = document.querySelector('.backsound');
    if (!button) return;
    button.classList.toggle('play', isPlaying);
    button.setAttribute('aria-label', isPlaying ? 'Matikan musik' : 'Putar musik');
    button.setAttribute('title', isPlaying ? 'Matikan musik' : 'Putar musik');
  };
  const getAudio = () => {
    try {
      if (window.audio && typeof window.audio.play === 'function') return window.audio;
    } catch (error) {}
    try {
      if (typeof audio !== 'undefined' && audio && typeof audio.play === 'function') return audio;
    } catch (error) {}
    if (!window.__localTemplateAudio) {
      window.__localTemplateAudio = new Audio('./assets/audio/background-music.mp3');
      window.__localTemplateAudio.loop = true;
    }
    if (!window.audio) window.audio = window.__localTemplateAudio;
    return window.__localTemplateAudio;
  };
  const playAudio = () => {
    try {
      const activeAudio = getAudio();
      if (activeAudio && typeof activeAudio.play === 'function') {
        activeAudio.loop = true;
        const playResult = activeAudio.play();
        if (playResult && typeof playResult.catch === 'function') playResult.catch(() => setAudioButtonState(false));
        setAudioButtonState(true);
      }
    } catch (error) {
      setAudioButtonState(false);
    }
  };
  const pauseAudio = () => {
    try {
      const activeAudio = getAudio();
      if (activeAudio && typeof activeAudio.pause === 'function') activeAudio.pause();
    } catch (error) {}
    setAudioButtonState(false);
  };
  const bindAudioButton = () => {
    const button = document.querySelector('.backsound');
    if (!button || button.dataset.localAudioBound === 'true') return;
    button.dataset.localAudioBound = 'true';
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    setAudioButtonState(Boolean(button.classList.contains('play')));
    const handleAudioToggle = (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (button.classList.contains('play')) pauseAudio();
      else playAudio();
    };
    button.addEventListener('click', handleAudioToggle, true);
    button.onclick = handleAudioToggle;
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      button.click();
    });
  };
  const startAutoScroll = () => {
    const readButton = document.querySelector('#button-mode-read');
    if (!readButton || readButton.classList.contains('active')) return;
    readButton.click();
  };
  const openInvitationLocally = () => {
    restoreInvitationNodes();
    bindAudioButton();
    hideCover();
    window.scrollTo(0, 0);
    playAudio();
    setTimeout(hideCover, 150);
    setTimeout(hideCover, 900);
    setTimeout(startAutoScroll, 650);
    setTimeout(startAutoScroll, 1400);
  };
  const bindOpenButtons = () => {
    document.querySelectorAll('.open-invitation').forEach((button) => {
      if (button.dataset.localOpenBound === 'true') return;
      button.dataset.localOpenBound = 'true';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openInvitationLocally();
      }, true);
    });
  };
  document.addEventListener('click', (event) => {
    const target = findOpenTarget(event);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openInvitationLocally();
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    preserveInvitationNodes();
    restoreInvitationNodes();
    patchJqueryBodyOverwrite();
    bindAudioButton();
    bindOpenButtons();
    removeAntiCloneBlock();
    document.querySelectorAll('form').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        showLocalNote(form);
      });
    });
    document.querySelectorAll('[data-local-disabled]').forEach((node) => {
      node.addEventListener('click', (event) => event.preventDefault());
    });
    if (window.AOS && typeof window.AOS.init === 'function') {
      window.AOS.init({ once: false, mirror: true });
    }
    const observer = new MutationObserver(removeAntiCloneBlock);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('load', () => {
      restoreInvitationNodes();
      patchJqueryBodyOverwrite();
      bindAudioButton();
      bindOpenButtons();
      removeAntiCloneBlock();
    }, { once: true });
    setTimeout(() => {
      restoreInvitationNodes();
      patchJqueryBodyOverwrite();
      bindAudioButton();
      bindOpenButtons();
      removeAntiCloneBlock();
    }, 500);
    setTimeout(() => {
      restoreInvitationNodes();
      patchJqueryBodyOverwrite();
      bindAudioButton();
      bindOpenButtons();
      removeAntiCloneBlock();
    }, 1500);
  });
})();
