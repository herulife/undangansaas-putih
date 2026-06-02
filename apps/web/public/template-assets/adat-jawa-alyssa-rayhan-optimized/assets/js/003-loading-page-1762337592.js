var LOADING_PAGE_EXISTS = true;

(() => {
    // --- PENTING ---
    // Agar berfungsi dengan benar dan tanpa kedipan,
    // letakkan skrip ini di dalam tag <head> pada HTML Anda.
    
    // --- Konfigurasi ---
    const cfg = {
        spinnerSrc: window.CUSTOM_LOGO || null, // URL ke GIF spinner Anda
        captionText: window.CUSTOM_LOADING_TEXT, // Teks yang akan ditampilkan
        captionColor: window.COLOR_CUSTOM_LOADING_TEXT,
        contentColor: window.COLOR_CUSTOM_TEXT,
        minLoadingDuration: 3000, // (ms) Durasi MINIMUM loader ditampilkan
        fadeAfterLoad: 600, // (ms) Durasi animasi fade-out
        bgColor: window.BACKGROUND_COLOR, // Warna latar belakang overlay
        typeSpeed: 250, // (ms) Kecepatan efek ketik
        debug: false // Aktifkan log di console untuk debugging
    };

    // --- Variabel Internal ---
    let loading_logo_type = window.LOADING_LOGO_TYPE;
    let overlay = null;
    let fallbackTimer = null;
    let typeInterval = null;
    let startTime = 0;
    let pageReady = false;
    let typewriterRunning = false;

    const log = (...args) => cfg.debug && console.log("[SmartLoader]", ...args);

    /**
     * Menyisipkan style CSS ke dalam <head>.
     * Dijalankan secara sinkron untuk mencegah kedipan.
     */
    function injectStyles() {
        if (document.getElementById("smart-loader-style")) return;
        const style = `
        <style id="smart-loader-style">
            .loading-page-container {
                position: fixed; inset:0; z-index:9999999; display:flex; flex-direction:column; justify-content:center; align-items:center;
                background-color:${cfg.bgColor}; transition:opacity ${cfg.fadeAfterLoad}ms ease-out; pointer-events: auto; opacity: 1;
                padding: 24px;
            }
            .loading-page-container.hidden { opacity:0; visibility:hidden; pointer-events: none; }
            .loading-content-container { display:flex; flex-direction:column; align-items:center; gap: 12px; }
            .loading-gif { max-width:80px; width: 100%; height: auto; }
            .loading-caption { font-family:'Montserrat',sans-serif; font-size:12px; font-weight:500; line-height: normal; color:${cfg.captionColor}; min-height: 16px; margin-top:0px; }
            .loading-text { font-family:'Montserrat',sans-serif; font-size:24px; font-weight:500; line-height: normal; color: ${cfg.contentColor}; text-align: center; }
            @keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
            .loading-gif-fallback {width:120px;height:120px;background:linear-gradient(45deg,#ED0B53,#ff4d7a);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold;animation:spin 1s linear infinite;}
        </style>`;
        document.head.insertAdjacentHTML('beforeend', style);
    }

    /**
     * Membuat dan menampilkan overlay.
     * Dijalankan secara sinkron.
     */
    function buildAndShowOverlay() {
        const loading_logo = `<img src="${cfg.spinnerSrc}" class="loading-gif" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`;
        const loading_text = `<p class="loading-text">${window.CUSTOM_TEXT}</p>`;
        const chosedType = loading_logo_type == 'CUSTOM_LOGO' || loading_logo_type == 'DEFAULT' ? loading_logo : loading_text;
        const overlayHTML = `
        <div id="smartLoaderOverlay" class="loading-page-container">
            <div class="loading-content-container">
                ${chosedType}
                <div class="loading-gif-fallback" style="display:none">⟳</div>
                <p class="loading-caption" data-text="${cfg.captionText}"></p>
            </div>
        </div>`;
        // Sisipkan langsung ke body, browser akan menanganinya bahkan jika body belum sepenuhnya ada
        document.documentElement.insertAdjacentHTML('beforeend', overlayHTML);
        overlay = document.getElementById('smartLoaderOverlay');
    }

    /**
     * Menyembunyikan overlay loader dengan animasi fade-out
     */
    function hide() {
        if (!overlay) return;
        
        typewriterStop();
        overlay.classList.add("hidden");
        log("Loader hidden");

        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
        }, cfg.fadeAfterLoad + 50);

        // jalankan animasi aos
        $(function() {
            AOS.init(AOSOptions);
            playMusicOnce();
        });

        $(window).on("scroll", function () {
            AOS.init(AOSOptions);
        });
    }

    /**
     * Memulai animasi ketik pada caption
     */
    function typewriterStart() {
        if (typewriterRunning) return;
        const caption = overlay.querySelector(".loading-caption");
        if (!caption) return;
        const txt = cfg.captionText.trim();
        let i = 0;
        caption.textContent = "";
        typewriterRunning = true;
        
        clearInterval(typeInterval);
        typeInterval = setInterval(() => {
            if (i < txt.length) {
                caption.textContent += txt.charAt(i);
                i++;
            } else {
                i = 0;
                caption.textContent = "";
            }
        }, cfg.typeSpeed);
    }

    /**
     * Menghentikan animasi ketik
     */
    function typewriterStop() {
        typewriterRunning = false;
        clearInterval(typeInterval);
        const caption = overlay.querySelector(".loading-caption");
        if (caption) caption.textContent = cfg.captionText;
    }

    /**
     * Fungsi yang dijalankan ketika halaman siap (DOMContentLoaded)
     */
    function onPageReady() {
        if (pageReady) return; // Pastikan hanya berjalan sekali
        pageReady = true;
        log("DOM Content Loaded.");
        if (fallbackTimer) clearTimeout(fallbackTimer);
        
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, cfg.minLoadingDuration - elapsed);
        
        log(`Page loaded in ${elapsed.toFixed(0)}ms. Hiding loader in ${remaining.toFixed(0)}ms.`);
        setTimeout(hide, remaining);
    }

    /**
     * Inisialisasi loader
     */
    function init() {
        startTime = performance.now();
        
        // Buat dan tampilkan loader secara sinkron
        injectStyles();
        buildAndShowOverlay();
        typewriterStart();
        log("Loader shown immediately.");

        // Atur timer pengaman
        // fallbackTimer = setTimeout(() => {
        //     if (!pageReady) {
        //         log("Fallback timer triggered. Force hiding loader.");
        //         hide();
        //     }
        // }, 20000);

        // Atur listener untuk saat halaman siap
        document.addEventListener("DOMContentLoaded", onPageReady);
    }

    init();

})();