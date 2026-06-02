// story slider
var storySlider = function () {
    // 1. Definisikan selektor utama
    var $preview = $("#story__slider-preview");
    var $nav = $(".story-chitra__slider-nav");

    // 2. Cek jumlah item di dalam slider (asumsi item adalah anak langsung dari slider)
    // Ganti 'div' dengan class item Anda jika perlu, misal: $preview.children('.item').length
    if ($preview.children().length <= 1) {
        $nav.hide();
    }

    var options = {
        speed: 500,
        autoplay: true,
        autoplaySpeed: 10000,
        pauseOnFocus: false,
        pauseOnHover: false,
        touchThreshold: 5000,
        swipeToSlide: true,
        arrows: false,
        dots: true,
        adaptiveHeight: false,
        fade: true,
    };

    var storyPreviewOptions = {
        ...options,
        ...{
            appendDots: "#story__slider-dots",
            asNavFor: "#story__slider-caption",
        },
    };

    var storyCaptionOptions = {
        ...options,
        ...{
            dots: false,
            asNavFor: "#story__slider-preview",
            arrows: false,
        },
    };

    // Init slick
    $preview.slick(storyPreviewOptions);
    $("#story__slider-caption").slick(storyCaptionOptions);

    // Logic afterChange tetap sama
    var sliderForWrap = $('.story-chitra__slider-for');
    $(sliderForWrap).on('afterChange', function (event, slick, currentSlide) {
        var manualNav = $('.story-chitra__slider-nav__item__manual');
        manualNav.each(function() {
            var slickIndex = $(this).attr('data-slick-index');
            $(this).toggleClass('is-active', slickIndex == currentSlide);
        });
    });
};

var resize_story_nav = function () {
    var $nav = $('.story__slider-preview');

    const baseViewport = 390;
    const baseWidth = 320;
    const baseHeight = 188;
    const maxWidth = 450;

    const currentViewport = $(window).width();

    let width, height;

    if (currentViewport < 560) {
        // Skala proporsional berdasarkan base viewport
        const scale = currentViewport / baseViewport;
        width = baseWidth * scale;
    } else {
        // Batas maksimal 450px
        width = Math.min(maxWidth, $nav.width());
    }

    // Hitung tinggi berdasarkan rasio dasar
    height = (baseHeight / baseWidth) * width;

    // Terapkan ke setiap .preview-wrap
    $nav.find('.preview-wrap').each((i, o) => {
        $(o).css({
            width: `${width}px`,
            height: `${height}px`
        });
    });
};

// Bank Button Toggle
$('.bank-btn-top').on('click', function () {
    const index = $('.bank-btn-top').index(this);
    const $item = $('.bank-item').eq(index);
    const $icon = $(this).find('.ph-fill');
    const $btnTop = $(this);

    $item.slideToggle(500);
    $icon.toggleClass('rotate');
    $btnTop.toggleClass('active');
    $item.toggleClass('active');
});

// Init Bank Icons
$('.bank-item').each(function (index) {
    const $icon = $('.bank-btn-top').eq(index).find('.ph-fill');
    const $btnTop = $('.bank-btn-top').eq(index);
    const isVisible = $(this).is(':visible');
    $icon.toggleClass('rotate', isVisible);
    $btnTop.toggleClass('active', isVisible);
});


var toggleGift = function () {
    $(".gift-form-sender-wrapper").slideToggle();
};

$(".wedding-gift__next").on('click', () => {
    $('.wedding-gift-details').css({
        opacity: 0,
    });
    $('.wedding-gift-picture').css({
        opacity: 1,
    });
});

$(".wedding-gift__prev").on('click', () => {
    $('.wedding-gift-details').css({
        opacity: 1,
    });
    $('.wedding-gift-picture').css({
        opacity: 0,
    });
});

// KADO
var init_gifts_slick = function () {
    var gifts_wrap = $('.hadiah-wrap');

    if (gifts_wrap.length) {
        var sliderOptions = {
            infinite: true,
            slidesToShow: 2,
            slidesToScroll: 1,
            dots: false,
            arrows: true,
            prevArrow: '.kado-chv.left',
            nextArrow: '.kado-chv.right'
        };

        // 1. Tambahkan logika pengatur z-index di sini
        var cards = gifts_wrap.find('.hadiah-card-wrap');
        var totalCards = cards.length;

        cards.each(function (index) {
            // Semakin besar index, z-index semakin kecil
            // Misal: kartu 1 (index 0) dapat z-index 10, kartu 2 dapat 9, dst.
            $(this).css('z-index', totalCards - index);
        });

        // 2. Inisialisasi Slick
        gifts_wrap.on('init', function () {
            $('.gifts__slider-nav__item__manual').eq(0).addClass('is-active');
        }).slick(sliderOptions);
    }
}

// On Ready
$(document).ready(function () {
    storySlider();

    resize_story_nav();

        
    var kadoWrapper = $('.kado-wrapper');
    if (kadoWrapper) {
        var intervalId = setInterval(function () {
            var $gifts_wrap = $('.hadiah-wrap');

            // Memeriksa apakah data sudah ada
            if ($gifts_wrap.length && $gifts_wrap.children().length > 0) {
                // Data sudah ada, inisialisasi slider
                init_gifts_slick();

                // Hentikan interval
                clearInterval(intervalId);
            }
        }, 500); // Periksa setiap 500 milidetik (0,5 detik)
    }
    
});