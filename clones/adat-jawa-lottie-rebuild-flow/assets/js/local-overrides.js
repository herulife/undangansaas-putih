(() => {
  window.KAT_LOCAL_MODE = true;
  const noop = () => {};
  window.dataLayer = window.dataLayer || [];
  window.gtag = noop;
  window.fbq = noop;

  const preventRemoteSubmit = (selector, message) => {
    document.querySelectorAll(selector).forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const note = document.createElement('div');
        note.className = 'kat-local-note';
        note.textContent = message;
        form.appendChild(note);
        setTimeout(() => note.remove(), 2600);
      });
    });
  };

  const openInvitation = () => {
    document.body.classList.add('invitation-opened', 'loaded', 'unlocked');
    document.querySelectorAll('.cover, .opening-cover, .kat-cover, .loader, .loading-page').forEach((el) => {
      el.classList.add('hide');
    });
    if (window.AOS && typeof window.AOS.refreshHard === 'function') {
      window.AOS.refreshHard();
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-section-footer]').forEach((el) => el.remove());
    preventRemoteSubmit('form', 'Mode lokal: pengiriman data dimatikan.');
    document.querySelectorAll('a[href^="https://www.google.com"], a[href^="https://maps.google.com"]').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noreferrer');
    });
    document.querySelectorAll('[data-local-disabled]').forEach((el) => {
      el.addEventListener('click', (event) => event.preventDefault());
    });
    document.querySelectorAll('.open-invitation, .btn-open, [data-open-invitation], .cover-button, .open').forEach((button) => {
      button.addEventListener('click', openInvitation);
    });
    setTimeout(() => {
      if (window.AOS && typeof window.AOS.init === 'function') {
        window.AOS.init({ once: false, mirror: true });
      }
    }, 500);
  });
})();