(() => {
  function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function afterIdle(callback) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout: 3500 });
      return;
    }
    setTimeout(callback, 2600);
  }

  window.addEventListener('load', () => {
    afterIdle(() => {
      if (!window.html2canvas) {
        loadScript('./assets/js/132-html2canvas-1-4-1-1749130377.js').catch(() => {});
      }
    });
  }, { once: true });
})();
