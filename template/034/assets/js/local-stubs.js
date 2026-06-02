(() => {
  window.LINKUNDANGAN_LOCAL_MODE = true;
  const localJson = {
  "status": "success",
  "message": "Mode lokal",
  "data": {
    "invitation_setting": {
      "sound": "./assets/audio/background-music.mp3",
      "countdown_date": "June 08, 2026 03:32:03"
    },
    "invitation": {
      "custom_css": "",
      "custom_js": "",
      "custom_js2": ""
    }
  },
  "attendance": [],
  "contents": [],
  "summary": [],
  "numb_of_reservations": 0
};
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = (input, options) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (/googletagmanager|google-analytics|speed\.cloudflare|generate_204|share\.linkundangan\.com|www\.linkundangan\.com/i.test(url) && !/\.(css|js|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp3|m4a|wav|mp4)(\?|$)/i.test(url)) {
      return Promise.resolve(new Response(JSON.stringify(localJson), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return nativeFetch ? nativeFetch(input, options) : Promise.reject(new Error('fetch unavailable'));
  };
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    const textUrl = String(url || '');
    if (/share\.linkundangan\.com|www\.linkundangan\.com/i.test(textUrl) && !/\.(css|js|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp3|m4a|wav|mp4)(\?|$)/i.test(textUrl)) {
      return nativeOpen.call(this, 'GET', './assets/js/local-empty.json', ...rest);
    }
    return nativeOpen.call(this, method, url, ...rest);
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() {};
  window.fbq = window.fbq || function() {};
})();