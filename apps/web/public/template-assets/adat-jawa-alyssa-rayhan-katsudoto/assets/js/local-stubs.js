(() => {
  window.KAT_LOCAL_MODE = true;
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = (input, options) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (/katsudoto\.id|googletagmanager|google-analytics|speed\.cloudflare|generate_204|youtubei|google\.com\/calendar|maps\.google/i.test(url)) {
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return nativeFetch ? nativeFetch(input, options) : Promise.reject(new Error('fetch unavailable'));
  };
  const noop = () => {};
  window.dataLayer = window.dataLayer || [];
  window.gtag = noop;
  window.fbq = noop;
  window.tsParticles = window.tsParticles || {
    load: () => Promise.resolve(),
    loadSlim: () => Promise.resolve(),
    addPreset: () => Promise.resolve(),
  };
})();