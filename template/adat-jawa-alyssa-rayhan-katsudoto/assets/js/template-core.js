/* 
    ++++++++++ ATTENTION!!! ++++++++++
    Before including this file
    make sure if your had included JQUERY too
*/

/*  ================================================
    GENERAL CONFIGURATION
============================================= */

let userInteractionGranted = false; // user has not interacted
let particles = null                // keep particles

// This is considered a valid user gesture in most browsers
$(document).on('click touchstart pointerdown keydown scroll', function (e) {
    userInteractionGranted = true; // user interacted
});


// ---------- Start Your Journey (Function) --------------------------------------------------
function startTheJourney() {
    $('.top-cover').eq(0).addClass('hide');
    $('body').eq(0).css('overflow', 'visible');

    if (particles) {
        particles.destroy();
        particles = null
    }

    // Enhanced music start with delay for better UX
    setTimeout(() => {
        if (typeof playMusicOnce === 'function') {
            playMusicOnce();
        }
    }, 500); // Small delay for smoother transition

    setTimeout(function () {
        // Looping the aos animate
        $('.aos-init').each(function (i, el) {
            // If the parent is not 'Top Cover'
            if ($(el).closest('.top-cover').length == 0) {

                var duration = parseInt($(el).attr('data-aos-duration') || 0);
                var delay = parseInt($(el).attr('data-aos-delay') || 0);

                if ($(el).hasClass('aos-animate')) {
                    // Remove 'aos-animate' class
                    $(el).css({
                        opacity: 0,
                        "transition-duration": 0 + "ms"
                    }).removeClass('aos-animate');

                    // wait for delay
                    setTimeout(function () {
                        // Add 'aos-amimate' class
                        $(el).css({
                            opacity: 1,
                            "transition-duration": duration + "ms"
                        }).addClass('aos-animate');
                    }, delay);
                }
            }
        });
    }, 50);

    setTimeout(function () {
        $('.top-cover').eq(0).remove();
    }, 3000);
}

// ---------- ALERT --------------------------------------------------
var $alert = $('#alert');                           // alert
var $alertClose = $('#alert .alert-close');         // alert close
var $alertText = $('#alert .alert-text');           // Alert Text

// ---------- Hide Alert (Function) --------------------------------------------------
function hideAlert() {
    $alert.removeClass();           // Remove All Class
    $alert.addClass('alert hide');                                        // hiding alert            
}

// ---------- Show Alert (Function) --------------------------------------------------
function showAlert(message, status) {
    if (status != '') {
        $alert.removeClass();     // Remove All Class
        $alert.addClass('alert show ' + status);
        $alertText.text(message);
        setTimeout(hideAlert, 3000);
    }
}

// ---------- Copy to  (Function) --------------------------------------------------
function copyToClipboard(text) {
    if (!navigator.clipboard) {
        // ExecCommand
        var dummy = document.createElement("textarea");

        // to avoid breaking orgain page when copying more words
        // cant copy when adding below this code
        // dummy.style.display = 'none'
        document.body.appendChild(dummy);

        //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
        dummy.value = text;
        dummy.select();

        document.execCommand("copy");
        document.body.removeChild(dummy);

        // Show Alert
        return showAlert(window.LANG_ID ? 'Berhasil di salin ke papan klip' : 'Successfully copied to clipboard', 'success');
    } else {
        // Clipboard API
        return navigator.clipboard.writeText(text).then(() => {
            showAlert(window.LANG_ID ? 'Berhasil di salin ke papan klip' : 'Successfully copied to clipboard', 'success');
        });
    }
}

// ---------- URLify  (Function) --------------------------------------------------
function urlify(text) {
    var lineBreak = '';
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        var finalURL = url;
        if (url.indexOf('<br>') > -1) {
            finalURL = url.replace(/<br>/g, '');
            lineBreak = '<br>';
        }
        return '<a href="' + finalURL + '" target="_blank">' + finalURL + '</a>' + lineBreak;
    });
    // or alternatively
    // return text.replace(urlRegex, '<a href="$1">$1</a>')
}

// ---------- Copy Account [ON CLICK] ---------------------------------------------------------------
$(document).on('click', '.copy-account', function (e) {
    e.preventDefault();
    var book = $(this).closest('.book');
    var number = $(book).find('.account-number');
    copyToClipboard(number.html());
});

// ---------- Number Format (Variables) ---------------------------------------------------------------
var numberFormat = new Intl.NumberFormat('ID', {
    // style: 'currency',
    // currency: 'IDR',
});

// ---------- Disabled Dragging an image [ON DRAGSTART] -----------------------------------------------
$('img').on('dragstart', function (e) {
    e.preventDefault();
});

// // ---------- Textarea [ON KEY, FOCUS] -----------------------------------------------------------------
// $(document).on('keyup focus', 'textarea', function(e){
//     e.preventDefault();
//     this.style.height = '1px';
//     this.style.height = (this.scrollHeight) + 'px';
// }).on('focusout', 'textarea', function(e){
//     e.preventDefault();
//     this.style.height = 24 + 'px';
// });




/*  ==============================
        CALLING
============================== */

// ---------- Sending Data (Only) By AJAX --------------------------------------------------
function ajaxCall(data, callback) {
    if (data) {
        $.ajax({
            type: 'post',
            dataType: 'json',
            data: data,
            success: function (result) {
                if (result.error === false) {
                    callback(result);
                } else {
                    showAlert(result.message, 'error');
                }
            },
        });
    }
}

// ---------- Sending Data And Media BY AJAX --------------------------------------------------
function ajaxMultiPart(data, beforeSend, callback) {
    if (data) {
        $.ajax({
            type: 'post',
            dataType: 'json',
            contentType: false,
            processData: false,
            data: data,
            beforeSend: beforeSend,
            success: function (result) {
                if (result.error === false) {
                    callback(result);
                } else {
                    showAlert(result.message, 'error');
                    $('.gift-next').prop('disabled', false);
                    $('.gift-submit').prop('disabled', false);
                    $('.gift-submit').html('Konfirmasi');
                }
            },
        });
    }
}



/*  ==============================
        COVERS
============================== */
// ---------- Slider Options (Function) --------------------------------------------------
function sliderOptions(options) {
    let configs = {
        centerMode: true,
        slidesToShow: 1,
        variableWidth: true,
        autoplay: true,
        autoplaySpeed: 3000,
        infinite: true,
        speed: 500,
        fade: true,
        cssEase: 'linear',
        dots: false,
        arrows: false,
        pauseOnFocus: false,
        pauseOnHover: false,
        draggable: false,
        touchMove: false
    }

    // combine options to configs
    if (typeof options === 'object') {
        configs = { ...configs, ...options }
    }

    return configs;
};

// Is Cover Played
var isCoverPlayed = false;

// COVER CONFIGURATION
(function coverConfiguration() {

    var windowWidth = $(window).width(),                                // Window Width    
        smallScreen = window.matchMedia("(max-width: 1024px)");       // Small screen

    // If width matched
    if (windowWidth > '1020' && windowWidth < '1030') {
        isCoverPlayed = false;      // cover is not played
    }

    // COVERS
    if (typeof window.COVERS != 'undefined') {
        // COVERS LOOP
        $(window.COVERS).each(function (i, cover) {

            var position = cover.position,      // position
                details = cover.details,        // details
                element = cover.element,        // element
                coverInner = $(element).closest('.cover-inner'),        // Cover Inner
                options = cover.options || '';                          // options

            // If element does exist
            if ($(element).length > 0) {
                // if the position is MAIN
                if (position == 'MAIN') {
                    // COVERS                    
                    // If Cover Inner does exist
                    if (coverInner.length) {
                        $(coverInner).removeClass('covers');        // Remove class 'covers'
                        if (details.desktop != '' || details.mobile != '') {
                            $(coverInner).addClass('covers');       // Add Class to cover-inner
                        }
                    }
                }

                // if cover has been slicked
                if ($(element).hasClass('slick-initialized')) {
                    $(element).slick('unslick');      // stop the slider
                }
                $(element).html('');      // empty element

                // if the small screen does not match (DESKTOP SIZE) 
                if (!smallScreen.matches) {
                    // if cover desktop is not empty
                    if (details.desktop != '') {
                        // if the position is MAIN and the cover is not played
                        if (position == 'MAIN' && !isCoverPlayed) {
                            isCoverPlayed = true;       // Played the cover                     
                        }

                        $(element).append(details.desktop);     // Append new cover elements into cover                        
                        $(element).slick(sliderOptions(options));            // Start the slider
                        if (coverInner.length) $(coverInner).removeClass('mobile').addClass('desktop');     // Add class desktop
                    }
                } else {
                    // the screen is small (MOBILE SIZE)
                    // if cover desktop is not empty
                    if (details.mobile != '') {
                        // if the position is MAIN and the cover is not played
                        if (position == 'MAIN' && !isCoverPlayed) {
                            isCoverPlayed = true;       // Played the cover                        
                        }

                        $(element).append(details.mobile);     // Append new cover elements into cover                        
                        $(element).slick(sliderOptions(options));            // Start the slider
                        if (coverInner.length) $(coverInner).removeClass('desktop').addClass('mobile');     // Add class desktop
                    }
                }
            }
        });
    }
}());



/*  ================================================
    SAVE THE DATE
============================================= */
// ----------- COUNTDOWN (Function) ------------------------------------------------------
(function countdown() {
    if (typeof window.EVENT != 'undefined') {
        var schedule = window.EVENT,
            event = new Date(schedule * 1000).getTime(),
            start = setInterval(rundown, 1000);

        // Rundown
        function rundown() {
            var now = new Date().getTime(),
                distance = event - now;

            // Time calculations for days, hours, minutes and seconds
            var days = Math.floor(distance / (1000 * 60 * 60 * 24)),                            // days
                hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),      // hours
                minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),              // minutes
                seconds = Math.floor((distance % (1000 * 60)) / 1000);                          // seconds

            if (distance < 0) {
                clearInterval(start);
                $('.count-day').text('0');
                $('.count-hour').text('0');
                $('.count-minute').text('0');
                $('.count-second').text('0');
            } else {
                $('.count-day').text(days);
                $('.count-hour').text(hours);
                $('.count-minute').text(minutes);
                $('.count-second').text(seconds);
            }
        }
    }
}());


/*  ==============================
        RSVP
============================== */

// ---------- Attendance Toggle (Function) --------------------------------------------------
function attendanceToggle(input) {
    var attendanceCome = $('.attendance-value.come');
    var attendanceNotCome = $('.attendance-value.not-come');

    var isFace = typeof $(input).attr('data-face') != 'undefined' && $(input).attr('data-face') == 'true' ? true : false;

    var come = 'Datang',                // Come
        notCome = 'Tidak Datang';       // Not Come

    if (typeof window.RSVP != 'undefined') {
        come = window.RSVP['button_text']['attend'];            // Attend
        notCome = window.RSVP['button_text']['not_attend'];     // Not Attend
    }

    $(attendanceCome).html(come);
    $(attendanceNotCome).html(notCome);

    if ($(input).is(':checked')) {
        if ($(input).next('.attendance-value.come').length > 0) {
            $(attendanceCome).html((isFace ? '<i class="fas fa-smile"></i> ' : '') + come);
            $('#rsvp-guest-amount').slideDown();
        }
        if ($(input).next('.attendance-value.not-come').length > 0) {
            $(attendanceNotCome).html((isFace ? '<i class="fas fa-sad-tear"></i> ' : '') + notCome);
            $('#rsvp-guest-amount').slideUp();
        }
    }
}

// ---------- Attendance [ON CLICK] --------------------------------------------------
$(document).on('change', '[name="attendance"]', function (e) {
    e.preventDefault();
    attendanceToggle(this);
})

// ---------- Change Confirmation [ON CLICK] --------------------------------------------------
$(document).on('click', '.change-confirmation', function (e) {
    e.preventDefault();
    $('.rsvp-inner').find('.rsvp-form').fadeIn();
    $('.rsvp-inner').find('.rsvp-confirm').hide();
});

// ---------- Plus Button [ON CLICK] --------------------------------------------------
$(document).on('click', '[data-quantity="plus"]', function (e) {
    e.preventDefault();

    var fieldName = $(this).attr('data-field');
    var $input = $(`input[name="${fieldName}"]`);
    var max = $input.attr('max');
    var value = parseInt($input.val()) + 1;

    // is editable
    if (!$input.prop('readonly')) {
        // max. value
        if (max !== 'undefined') {
            max = parseInt(max);
            if (value >= max) value = max;
        }

        // min. value
        if (value <= 0) value = 1;

        // change value
        $input.val(value);
    }
    window.updateQuestionWrappers()
});

// ---------- Minus Button [ON CLICK] --------------------------------------------------
$(document).on('click', '[data-quantity="minus"]', function (e) {
    e.preventDefault();

    var fieldName = $(this).attr('data-field');
    var $input = $(`input[name="${fieldName}"]`);
    var min = $input.attr('min');
    var value = parseInt($input.val()) - 1;

    // is editable
    if (!$input.prop('readonly')) {
        // min. value
        if (min !== 'undefined') {
            min = parseInt(min);
            if (value <= min) value = min;
        }

        // 0 (zero) is not allowed
        if (value <= 0) value = 1;

        // change value
        $input.val(value);
    }
    window.updateQuestionWrappers()

});

// ----- Amount into Decimal  ----- //
$(document).ready(function () {
    $('input[name="amount"]').attr('type', 'text');
    $('input[name="amount"]').on('input', function () {
        var value = $(this).val();

        value = value.replace(/,/g, '').replace(/\./g, '');
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        $(this).val(value);
    });
});

// ---------- Quantity Control [ON CHANGE] --------------------------------------------------
$(document).on('change', '[data-quantity="control"]', function (e) {
    e.preventDefault();
    var max = $(this).prop('max');
    var value = $(this).val();
    if (value > max) {
        $(this).val(max);
    }
});

// ---------- Nominal [ON CHANGE] --------------------------------------------------
$(document).on('change', '[name="nominal"]', function (e) {
    e.preventDefault();
    var val = $(this).val();
    var input = $('.insert-nominal');

    $(input).slideUp();
    if (parseInt(val) <= 0) {
        if ($(this).is(':checked') == true) {
            $(input).slideDown();
            $(input).find('[name="inserted_nominal"]').val('').focus();
        }
    }

    // var x = numberFormat.format(parseInt(val));
    $(input).find('[name="inserted_nominal"]').val(val);

});

// ---------- Inserted Nominal [ON KEYUP, KEYDOWN, CHANGE] --------------------------------------------------
$(document).on('keyup keydown change', '[name="inserted_nominal"]', function (e) {
    if ($(this).val().length > 16) {
        var val = $(this).val().substr(0, $(this).val().length - 1);
        $(this).val(val);
    };
});

// ---------- RSVP Form [ON SUBMIT] --------------------------------------------------
$(document).on('submit', '#rsvp-form', function (e) {
    e.preventDefault();

    // Data
    var data = $(this).serialize();

    // Ajax Call
    ajaxCall(data, function (result) {
        $('.rsvp-inner').find('.rsvp-form').fadeOut();
        $('.rsvp-inner').find('.rsvp-confirm').fadeIn();

        showAlert(result.message, 'success');
        window.location.reload();
    });

    return false;
});



/*  ==============================    
        WEDDING GIFT
============================== */

// ---------- Choose Bank (Function) --------------------------------------------------
function chooseBank(value) {
    // Data Book
    $('[data-book]').each(function (i, book) {
        // Hide
        $(book).hide();
        // if book is exist
        if ($(book).attr('data-book') == value) {
            $(book).fadeIn();
        }
    });
}

// ---------- Choose Bank [ON CHANGE] --------------------------------------------------
$(document).on('change', 'select[name="choose_bank"]', function (e) {
    e.preventDefault();
    chooseBank($(this).val());
});

// ---------- Gift Picture [ON CLICK] --------------------------------------------------
$(document).on('click', 'div[data-upload="gift-picture"]', function (e) {
    e.preventDefault();
    $('#gift-form input[name="picture"]').click();
});

// ---------- Picture insinde Gift [ON CHANGE] --------------------------------------------------
$(document).on('change', '#gift-form input[name="picture"]', function (e) {
    e.preventDefault();
    if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = function (er) {
            $('[data-image="uploaded-gift"]').fadeIn();
            $('[data-image="uploaded-gift"]').attr('src', er.target.result);
        }
        reader.readAsDataURL(this.files[0]);
    }
});

// ---------- Gift Next [ON CLICK] --------------------------------------------------
$(document).on('click', '.gift-next', function (e) {
    e.preventDefault();
    var form = $('#gift-form');

    if ($(form).find('[name="name"]').val() == '') {
        $(form).find('[name="name"]').focus();
        return;
    }
    if ($(form).find('[name="account_name"]').val() == '') {
        $(form).find('[name="account_name"]').focus();
        return;
    }
    if ($(form).find('[name="message"]').val() == '') {
        $(form).find('[name="message"]').focus();
        return;
    }
    if ($(form).find('[name="inserted_nominal"]').val() <= 0) {
        $('.insert-nominal').slideDown();
        $(form).find('[name="inserted_nominal"]').focus();
        return;
    }

    $('.gift-details').hide();
    $('.gift-picture').fadeIn();
});

// ---------- Gift Back [ON CLICK] --------------------------------------------------
$(document).on('click', '.gift-back', function (e) {
    e.preventDefault();
    $('.gift-picture').hide();
    $('.gift-details').fadeIn();
});

// ---------- Gift Form [ON SUBMIT] --------------------------------------------------
$(document).on('submit', '#gift-form', function (e) {
    var data = new FormData(this);
    ajaxMultiPart(data, function () {
        $('.gift-next').prop('disabled', true);
        $('.gift-submit').prop('disabled', true);
        $('.gift-submit').html('<i class="fas fa-spinner fa-spin"></i>');
    }, function (result) {
        $(this).trigger('reset');
        showAlert(result.message, 'success');
        setTimeout(function () {
            window.location.reload(true);
        }, 1000);
    });
    return false;
});





// Select Bank
var select_bank = function (e) {
    e.preventDefault();
    var bankId = $(this).val();
    $('.bank-item').removeClass('show');
    $('#savingBook' + bankId).addClass('show');
}

$(document).on('change', 'select#selectBank', select_bank);

// Wedding Gift Upload File
var wgu_file = function (e) {
    e.preventDefault();
    var input = $(this).attr('data-wgu-file');
    $(input).trigger('click');
}

$(document).on('click', '[data-wgu-file]', wgu_file);

// Wedding Gift Picture
var wgu_handle_picture = function (e) {
    var preview = $(this).attr('data-wgu-preview');
    if (e.target.files.length > 0) {
        var src = URL.createObjectURL(e.target.files[0]);
        $(preview).attr('src', src);

        $('.wgu-description').removeClass('show');
        $('.wgu-img-wrap').addClass('show');
    }
}

$(document).on('change', 'input#weddingGiftPicture', wgu_handle_picture);

// Wedding Gift Next
var wedding_gift_next = function (e) {
    e.preventDefault();
    var width = $('#weddingGiftForm').width();
    var marginLeft = parseFloat($('.wedding-gift__first-slide').css('margin-left'));

    var newMarginLeft = marginLeft - width;

    $('.wedding-gift__first-slide').css('margin-left', newMarginLeft + "px");
    $('.wedding-gift-picture').addClass('show');
}

$(document).on('click', '.wedding-gift__next', wedding_gift_next);

// Wedding Gift Prev
var weeding_gift_prev = function (e) {
    e.preventDefault();
    var width = $('#weddingGiftForm').width();
    var marginLeft = parseFloat($('.wedding-gift__first-slide').css('margin-left'));

    var newMarginLeft = marginLeft + width;
    if (newMarginLeft < 0) newMarginLeft = 0;

    $('.wedding-gift__first-slide').css('margin-left', newMarginLeft + "px");
    $('.wedding-gift-picture').removeClass('show');
}

$(document).on('click', '.wedding-gift__prev', weeding_gift_prev);


// Wedding Gift Form
var wedding_gift_form = function (e) {
    e.preventDefault();

    var form = this;
    var data = new FormData(form);

    var submitButton = $(form).find('button.submit');
    var submitText = $(submitButton).html();

    var onSuccess = function (res) {

        if (res.wedding_gift_message) {
            $('.wedding-gift-form').html(res.wedding_gift_message);
        }

        if (!res.wedding_gift_message) {
            setTimeout(() => { window.location.reload(); }, 1000);
        }

        afterSend();
    }

    var onError = function (res = null) { afterSend(); }

    var afterSend = function () {
        $(form).find('input, select, textarea, button').prop('disabled', false);
        $(submitButton).html(submitText);
    }

    var beforeSend = function () {
        $(form).find('input, select, textarea, button').prop('disabled', true);
        $(submitButton).html('Sending <i class="fas fa-spinner fa-spin"></i>');
    }

    postData(data, onSuccess, onError, beforeSend);
}

$(document).on('submit', 'form#weddingGiftForm', wedding_gift_form);



// Init Wedding Gift
var init_wedding_gift = function () {

    // Bank Options
    if (typeof window.BANK_OPTIONS !== 'undefined' && window.BANK_OPTIONS) {

        var el = $('select#selectBank').get(0);

        if ($(el).length) {

            // Options
            var options = selectize_options({
                maxItems: 1,
                valueField: 'id',
                labelField: 'title',
                searchField: ['title', 'credential'],
                options: (window.BANK_OPTIONS ? window.BANK_OPTIONS : []),
                render: {
                    item: function (item, escape) {
                        var title = item.title;
                        return '<div>' + (title ? '<p class="select-bank__title">' + escape(title) + '</p>' : '') + '</div>';
                    },
                    option: function (item, escape) {
                        var title = item.title;
                        var credential = item.credential;
                        return '<div class="item">' +
                            '<p class="select-bank__title">' + escape(title) + '</p>' +
                            '<p class="select-bank__credential">' + escape(credential) + '</p>' +
                            '</div>';
                    }
                },
                onInitialize: function () {
                    var instance = this;

                    // disabled input
                    instance.$control_input.attr('readonly', 'readonly');

                    // Document onClick
                    $(instance.$control).off('click').on('click', function (e) {
                        e.stopPropagation();

                        // is focused
                        if (instance.isFocused) return false;
                    });
                }
            });

            // Generate Bank
            var selectize = init_selectize(el, options);


            // Select Bank
            var selected = selected_selectize(selectize, window.BANK_OPTIONS[0]['id']);

            // Trigger Select
            $(el).val(selectize.getValue()).trigger('change');

            // Hadiah on Select
            $('.selectize-control .selectize-input').on('click', function (e) {
                e.stopPropagation(); // Hindari trigger klik di luar

                const parent = $('.selectize-control');
                const existingElement = parent.find('.selectize-control-cover');

                // Hapus elemen jika sudah ada sebelumnya (biar tidak duplikasi)
                if (existingElement.length) {
                    existingElement.remove();
                }

                // Tambahkan elemen di dalam .selectize-control paling depan
                parent.prepend('<div class="selectize-control-cover"></div>');

                // // Styling untuk memastikan elemen terlihat jelas
                $('.selectize-control-cover').css({
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    inset: '0',
                    background: 'transparent',
                    cursor: 'pointer',
                    zIndex: '10',
                });
            });

            // Event saat elemen diklik, elemen akan hilang
            $(document).on('click', '.selectize-control-cover', function () {
                $(this).remove();
            });

            // 🔥 Hook untuk mendeteksi perubahan display: none pada .selectize-dropdown
            const dropdownEl = $('.selectize-dropdown')[0];

            if (dropdownEl) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'style') {
                            const display = $(dropdownEl).css('display');

                            if (display === 'none') {
                                $('.selectize-control-cover').remove(); // Hapus cover saat dropdown tertutup
                            }
                        }
                    });
                });

                // Observe perubahan atribut style pada dropdown
                observer.observe(dropdownEl, { attributes: true, attributeFilter: ['style'] });
            }
        }

    }

}

setTimeout(() => { init_wedding_gift(); }, 500);









/*  ==============================
        WEDDING WISH
============================== */

// ---------- Calling Modal [ON CLICK] --------------------------------------------------
$(document).on('click', '[data-modal]', function (e) {
    e.preventDefault();
    var element = this;
    var modal = $(element).data('modal');
    var data = {
        'status': 'modal',
        'modal': modal
    }

    // Delete Comment
    if (modal == 'delete_comment') {
        var comment = $(element).data('comment');
        data['comment'] = comment;
    }

    ajaxCall(data, function (result) {
        if (result.modal != '') {
            openModal(result['modal']);
        }

    });

});

// ---------- Deleting [ON CLICK] --------------------------------------------------
$(document).on('click', '[data-delete]', function (e) {
    e.preventDefault();
    var element = this;
    var status = $(element).data('delete');
    var data = {
        'status': status
    };

    if (status == 'delete_comment') {
        var comment = $(element).data('comment');
        data['comment'] = comment;
    }

    ajaxCall(data, function (result) {
        if (result.callback == 'comment') {
            showAlert(result.message, 'success');

            closeModal();

            if (typeof allComments === 'function') allComments();
            if (typeof load_comment === 'function') load_comment();
            if (typeof lysha_get_all_comments === 'function') lysha_get_all_comments();
        }
    });

});

// ---------- All Comments (Function) --------------------------------------------------
var allComments = (function comment() {
    var data = {
        'status': 'all_comments',
    }
    ajaxCall(data, function (result) {
        $('.comments').html('');
        $('.comments').append(result.comments);
        if (result.more != '') {
            $('.comment-inner .foot').html('');
            $('.comment-inner .foot').append(result.more);
        }
    });
    return comment;
}());

// ---------- Comment Form [ON SUBMIT] --------------------------------------------------
$(document).on('submit', '#comment-form', function (e) {
    e.preventDefault();
    var form = $(this);
    var data = $(this).serialize();
    var comment = $(this).find('[name="comment"]');
    if (comment.val() == '') {
        comment.focus();
    } else {
        ajaxCall(data, function (result) {
            $(form).trigger('reset');
            showAlert(result.message, 'success');
            allComments();
        });
    }
    return false;
});

// ---------- More Comment --------------------------------------------------
$(document).on('click', '.more-comment', function (e) {
    e.preventDefault();
    var lastComment = $(this).data('last-comment');
    var data = {
        'status': 'more_comments',
        'last_comment': lastComment,
    }
    $(this).html('Loading... <i class="fas fa-spinner fa-spin"></i>');
    ajaxCall(data, function (result) {
        $('.comment-inner .foot').html('');
        $('.more-comment').html('Show more comments');
        if (result.comments != '') {
            $('.comments').append(result.comments);
        }
        if (result.more != '') {
            $('.comment-inner .foot').append(result.more);
        }
    });
});



// Post Comment
var post_comment = function (e) {
    e.preventDefault();

    var form = this;
    var data = new FormData(form);

    var submitButton = $(form).find('button.submit');
    var submitText = $(submitButton).html();

    if ($(form).find('input[name="name"]').val() == '') {
        return $(form).find('input[name="name"]').focus();
    }

    if ($(form).find('textarea[name="comment"]').val() == '') {
        return $(form).find('textarea[name="comment"]').focus();
    }

    var onSuccess = function () {
        load_comment();
        afterSend();
        if (typeof lysha_get_all_comments === 'function') lysha_get_all_comments();
    }

    var onError = function (res = null) { afterSend() }

    var afterSend = function () {
        $(form).find('textarea[name="comment"]').val('');
        $(form).find('input, select, textarea, button').prop('disabled', false);
        $(submitButton).html(submitText);
    }

    var beforeSend = function () {
        $(form).find('input, select, textarea, button').prop('disabled', true);
        $(submitButton).html('Mengirim <i class="fas fa-spinner fa-spin"></i>');
    }

    postData(data, onSuccess, onError, beforeSend);
}

$(document).on('submit', 'form#weddingWishForm', post_comment);


// Load Comment
var load_comment = function () {
    var data = new FormData();
    data.append('post', 'loadComment');

    var template = $('.wedding-wish-wrap').attr('data-template');
    if (template != '') data.append('template', template);

    var onSuccess = function (res) {
        if (res.commentItems) $('.comment-wrap').addClass('show').html(res.commentItems);

        if (!res.commentItems) $('.comment-wrap').removeClass('show');

        if (res.nextComment && res.nextComment != 0) {
            $('.more-comment-wrap').addClass('show');
            $('#moreComment').attr('data-start', res.nextComment);
        }

        if (!res.nextComment) {
            $('.more-comment-wrap').removeClass('show');
            $('#moreComment').attr('data-start', 0);
        }
    }

    postData(data, onSuccess);
}

setTimeout(() => { load_comment(); }, 500);


// More Comment
var more_comment = function (e) {
    e.preventDefault();
    var me = this;
    var meText = $(me).html();
    var start = $(this).attr('data-start');
    var loadText = $(this).attr('data-load-text');
    var template = $(this).attr('data-template');

    if (loadText == '') loadText = "Loading";

    if (start != '') {

        var data = new FormData();
        data.append('post', 'moreComment');
        data.append('start', start);
        data.append('template', template);

        var onSuccess = function (res) {
            if (res.commentItems) $('.comment-wrap').addClass('show').append(res.commentItems);

            if (res.nextComment && res.nextComment != 0) {
                $('.more-comment-wrap').addClass('show');
                $(me).attr('data-start', res.nextComment);
            }

            if (!res.nextComment) {
                $('.more-comment-wrap').removeClass('show');
                $(me).attr('data-start', 0);
            }

            afterSend();
        }

        var onError = function (res = null) { afterSend(); }

        var afterSend = function () {
            $(me).prop('disabled', false).html(meText);
        }

        var beforeSend = function () {
            $(me).prop('disabled', true).html(loadText + " <i class='fas fa-spinner fa-spin'></i>");
        }

        postData(data, onSuccess, onError, beforeSend);
    }
}

$(document).on('click', '#moreComment', more_comment);



/*  ==============================
        MUSIC
============================== */
// Enhanced Universal Audio System for Wedding Invitations
var AudioManager = {
    // State management
    state: {
        isMusicAttemptingToPlay: false,
        isMusicPlayed: false,
        isAudioUnlocked: false,
        audioContext: null,
        backgroundMusic: null,
        retryAttempts: 0,
        maxRetries: 3,
        loopStartTime: window?.CROPPED_SONG?.start || null,  // Mulai dari detik ke-5
        loopEndTime: window?.CROPPED_SONG?.end || null    // Loop kembali saat mencapai detik ke-15
    },

    // Enhanced device detection
    device: {
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
        isMac: /Mac/.test(navigator.platform),
        isAndroid: /Android/.test(navigator.userAgent),
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        isChrome: /Chrome/.test(navigator.userAgent),
        isFirefox: /Firefox/.test(navigator.userAgent),

        // Enhanced autoplay detection
        isAutoplayBlocked: function () {
            return this.isIOS || this.isSafari ||
                (this.isAndroid && !this.isChrome) ||
                (this.isChrome && this.isMobile);
        },

        // Check if in-app browser (WhatsApp, Instagram, etc)
        isInAppBrowser: function () {
            return /FBAN|FBAV|Instagram|Line|WhatsApp|Telegram/i.test(navigator.userAgent);
        }
    },

    // Initialize audio system
    init: function (config) {
        if (typeof window.MUSIC === 'undefined' || !window.MUSIC.url) {
            // console.log('No music configuration found');
            return;
        }

        this.config = {
            url: window.MUSIC.url,
            box: window.MUSIC.box,
            volume: config?.volume || 0.5,
            // fadeInDuration: config?.fadeInDuration || 2000,
            retryDelay: config?.retryDelay || 1000
        };

        this.setupAudio();
        this.bindEvents();
        this.setupVisibilityHandling();

        // console.log('AudioManager initialized for:', this.device);
    },

    // Setup audio element with enhanced compatibility
    setupAudio: function () {
        const audio = document.createElement("audio");

        // Basic setup
        audio.loop = true;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.playsInline = true; // Important for iOS

        // Platform-specific setup
        if (this.device.isAutoplayBlocked()) {
            audio.muted = false;
            audio.autoplay = false;
        } else {
            audio.muted = true; // Start muted for autoplay
            audio.autoplay = true;
        }

        // Multiple source support for better compatibility
        if (Array.isArray(this.config.url)) {
            this.config.url.forEach(src => {
                const source = document.createElement('source');
                source.src = src;
                source.type = this.getAudioType(src);
                audio.appendChild(source);
            });
        } else {
            audio.src = this.config.url;
        }

        audio.load();
        this.state.backgroundMusic = audio;

        // Setup custom loop dengan timeupdate
        if (this.state.loopStartTime != null && this.state.loopEndTime != null) {
            this.setupCustomLoop();
        }

        // Setup Web Audio Context
        this.initAudioContext();
    },

    // Get MIME type for audio source
    getAudioType: function (src) {
        const ext = src.split('.').pop().toLowerCase();
        const types = {
            mp3: 'audio/mpeg',
            ogg: 'audio/ogg',
            wav: 'audio/wav',
            m4a: 'audio/mp4',
            aac: 'audio/aac'
        };
        return types[ext] || 'audio/mpeg';
    },

    // Initialize Web Audio Context
    initAudioContext: function () {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext && !this.state.audioContext) {
                this.state.audioContext = new AudioContext();
            }
        } catch (e) {
            console.log('Web Audio API not supported:', e);
        }
    },

    // Setup custom loop dari detik ke-5 sampai detik ke-15
    setupCustomLoop: function () {
        const self = this;
        const audio = this.state.backgroundMusic;

        audio.addEventListener('timeupdate', function () {
            // Jika sudah mencapai detik ke-15, kembali ke detik ke-5
            if (audio.currentTime >= self.state.loopEndTime) {
                audio.currentTime = self.state.loopStartTime;
            }
        });

        // Set waktu awal ke detik ke-5 saat audio siap
        audio.addEventListener('loadedmetadata', function () {
            audio.currentTime = self.state.loopStartTime;
        });
    },

    // Enhanced audio unlock with retry mechanism
    unlockAudio: function () {
        if (this.state.isAudioUnlocked) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // console.log(`Attempting to unlock audio (attempt ${this.state.retryAttempts + 1}/${this.state.maxRetries})`);

            const audio = this.state.backgroundMusic;
            if (!audio) {
                reject('Audio element not found');
                return;
            }

            // For iOS, create a silent audio buffer first
            if (this.device.isIOS) {
                this.unlockIOSAudio().then(resolve).catch(() => {
                    this.fallbackUnlock().then(resolve).catch(reject);
                });
            } else {
                this.fallbackUnlock().then(resolve).catch(reject);
            }
        });
    },

    // iOS-specific unlock method
    unlockIOSAudio: function () {
        return new Promise((resolve, reject) => {
            const audio = this.state.backgroundMusic;

            // Create silent buffer
            const silentAudio = new Audio();
            silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAAA==';
            silentAudio.preload = 'auto';

            const playPromise = silentAudio.play();

            if (playPromise) {
                playPromise.then(() => {
                    silentAudio.pause();
                    silentAudio.currentTime = 0;

                    // Now unlock the main audio
                    const mainPromise = audio.play();
                    if (mainPromise) {
                        mainPromise.then(() => {
                            audio.pause();
                            audio.currentTime = 0;
                            this.state.isAudioUnlocked = true;
                            // console.log('iOS audio unlocked successfully');
                            resolve();
                        }).catch(reject);
                    } else {
                        this.state.isAudioUnlocked = true;
                        resolve();
                    }
                }).catch(reject);
            } else {
                reject('iOS silent audio failed');
            }
        });
    },

    // Fallback unlock method
    fallbackUnlock: function () {
        return new Promise((resolve, reject) => {
            const audio = this.state.backgroundMusic;
            audio.muted = false;

            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    this.state.isAudioUnlocked = true;

                    // Also unlock Web Audio Context
                    if (this.state.audioContext && this.state.audioContext.state === 'suspended') {
                        this.state.audioContext.resume().then(() => {
                            // console.log('Web Audio Context resumed');
                        });
                    }

                    // console.log('Audio unlocked via fallback method');
                    resolve();
                }).catch(error => {
                    console.log('Fallback unlock failed:', error);

                    // Last resort - just mark as unlocked for old browsers
                    if (this.state.retryAttempts < this.state.maxRetries) {
                        this.state.retryAttempts++;
                        setTimeout(() => {
                            this.unlockAudio().then(resolve).catch(reject);
                        }, this.config.retryDelay);
                    } else {
                        this.state.isAudioUnlocked = true; // Give up gracefully
                        resolve();
                    }
                });
            } else {
                this.state.isAudioUnlocked = true;
                resolve();
            }
        });
    },

    // Enhanced play music with fade-in
    playMusic: function () {
        if (!this.state.isAudioUnlocked) {
            // console.log('Audio not unlocked, attempting unlock...');
            this.unlockAudio().then(() => {
                setTimeout(() => this.playMusic(), 100);
            }).catch(error => {
                console.log('Failed to unlock audio:', error);
                this.pauseBoxAnimation();
            });
            return;
        }

        if (this.state.isMusicAttemptingToPlay) {
            return; // Already attempting
        }

        const audio = this.state.backgroundMusic;
        if (!audio) return;

        this.state.isMusicAttemptingToPlay = true;
        audio.muted = false;
        audio.volume = this.config.volume; // Set volume directly

        // Set ke detik ke-5 jika belum diset
        if (this.state.loopStartTime != null && this.state.loopEndTime != null) {
            if (audio.currentTime < this.state.loopStartTime || audio.currentTime >= this.state.loopEndTime) {
                audio.currentTime = this.state.loopStartTime;
            }
        }

        const promise = audio.play();

        if (promise !== undefined) {
            promise.then(() => {
                this.state.isMusicPlayed = true;
                this.state.isMusicAttemptingToPlay = false;
                this.playBoxAnimation();

                // Fade in
                // this.fadeIn(audio, this.config.volume, this.config.fadeInDuration);

                // console.log('Audio playing successfully');
            }).catch(error => {
                this.state.isMusicPlayed = false;
                this.state.isMusicAttemptingToPlay = false;
                this.pauseBoxAnimation();
                console.log('Audio play failed:', error);
            });
        } else {
            // Fallback for very old browsers
            this.state.isMusicPlayed = true;
            this.state.isMusicAttemptingToPlay = false;
            this.playBoxAnimation();
            audio.volume = this.config.volume;
        }
    },

    // Fade in effect
    // fadeIn: function(audio, targetVolume, duration) {
    //     const steps = 20;
    //     const stepVolume = targetVolume / steps;
    //     const stepDuration = duration / steps;
    //     let currentStep = 0;

    //     const fadeInterval = setInterval(() => {
    //         currentStep++;
    //         audio.volume = Math.min(stepVolume * currentStep, targetVolume);

    //         if (currentStep >= steps) {
    //             clearInterval(fadeInterval);
    //             audio.volume = targetVolume;
    //         }
    //     }, stepDuration);
    // },

    // Pause music with fade-out
    pauseMusic: function () {
        const audio = this.state.backgroundMusic;
        if (!audio) return;

        audio.pause();
        this.pauseBoxAnimation();
        this.state.isMusicAttemptingToPlay = false;
        this.state.isMusicPlayed = false;

        // Quick fade out
        // this.fadeOut(audio, 500, () => {
        // });
    },

    // Fade out effect
    // fadeOut: function(audio, duration, callback) {
    //     const startVolume = audio.volume;
    //     const steps = 10;
    //     const stepVolume = startVolume / steps;
    //     const stepDuration = duration / steps;
    //     let currentStep = 0;

    //     const fadeInterval = setInterval(() => {
    //         currentStep++;
    //         audio.volume = Math.max(startVolume - (stepVolume * currentStep), 0);

    //         if (currentStep >= steps || audio.volume <= 0) {
    //             clearInterval(fadeInterval);
    //             audio.volume = 0;
    //             if (callback) callback();
    //         }
    //     }, stepDuration);
    // },

    // Animation controls
    playBoxAnimation: function () {
        const box = $(this.config.box);
        if (!box.hasClass('playing')) {
            box.addClass('playing');
        }
        if (box.css('animationPlayState') !== 'running') {
            box.css('animationPlayState', 'running');
        }
    },

    pauseBoxAnimation: function () {
        const box = $(this.config?.box);
        if (box.hasClass('playing')) {
            if (box.css('animationPlayState') === 'running') {
                box.css('animationPlayState', 'paused');
            }
        }
    },

    // Enhanced event binding
    bindEvents: function () {
        const self = this;

        // Music box click
        $(document).on('click', this.config.box, function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            if (self.state.isMusicPlayed) {
                self.pauseMusic();
            } else {
                self.playMusic();
            }
        });

        // Pause when video plays
        $(document).on('click', '.play-btn, .play-youtube-video', function (e) {
            e.preventDefault();
            if (self.state.isMusicPlayed) {
                self.pauseMusic();
            }
        });

        // Is Box Hidden?
        var prevScrollpos = window.pageYOffset;
        var isBoxHidden = false;
        var boxTimeout;
        var box = this.config.box

        // Show Music Box
        var showMusicBox = function () {
            // Show Music Box
            $(box).removeClass('hide');                     // Showing the box
            isBoxHidden = false;                            // Box is not hidden

            clearTimeout(boxTimeout);                       // Clear Timeout
        }

        // Hide Music Box
        var hideMusicBox = function () {
            // Hide Music Box
            $(box).addClass('hide');                        // Hiding the box
            isBoxHidden = true;                             // Box is hidden

            clearTimeout(boxTimeout);                       // Clear Timeout
            boxTimeout = setTimeout(showMusicBox, 5000);    // Set Timeout
        }

        // Window On Scroll
        $(window).on('scroll', function () {
            var currentScrollPos = window.pageYOffset;

            if (prevScrollpos > currentScrollPos) {
                if (isBoxHidden) showMusicBox();
            } else {
                if (!isBoxHidden) hideMusicBox();
            }

            prevScrollpos = currentScrollPos;
        });

        // Universal unlock events with improved detection
        const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown'];
        let unlockHandlerExecuted = false;

        const unlockHandler = function (e) {
            if (!self.state.isAudioUnlocked && !unlockHandlerExecuted) {
                unlockHandlerExecuted = true;

                self.unlockAudio().then(() => {
                    // Remove listeners after successful unlock
                    unlockEvents.forEach(event => {
                        document.removeEventListener(event, unlockHandler, true);
                    });
                }).catch(() => {
                    // Reset flag on failure to allow retry
                    unlockHandlerExecuted = false;
                });
            }
        };

        // Add unlock listeners
        unlockEvents.forEach(event => {
            document.addEventListener(event, unlockHandler, { capture: true, passive: true });
        });
    },

    // Enhanced visibility change handling with auto-resume
    setupVisibilityHandling: function () {
        const self = this;

        // Main visibility change handler
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') {
                // Store current playing state before pausing                
                if (self.state.isMusicPlayed) {
                    self.pauseMusic();
                }
            } else if (document.visibilityState === 'visible') {
                // Resume music 
                if (self.state.isAudioUnlocked) {
                    // Small delay to ensure tab is fully active (especially on iOS)
                    setTimeout(() => {
                        self.playMusic();
                    }, 100);
                }
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', function () {
            if (self.state.isMusicPlayed && self.state.backgroundMusic) {
                self.state.backgroundMusic.pause();
            }
        });
    },

    // Public API
    play: function () { this.playMusic(); },
    pause: function () { this.pauseMusic(); },
    isPlaying: function () { return this.state.isMusicPlayed; },
    isUnlocked: function () { return this.state.isAudioUnlocked; },
    getState: function () { return { ...this.state }; }
};

// Initialize when DOM is ready
$(document).ready(function () {
    // Initialize AudioManager with config
    AudioManager.init({
        volume: 0.6,
        // fadeInDuration: 3000,
        retryDelay: 1500
    });

    // Expose to global scope for backward compatibility
    // window.playMusic = () => AudioManager.play();
    window.pauseMusic = () => AudioManager.pause();
    window.audioControls = AudioManager;
});

// Enhanced playMusicOnce function
function playMusicOnce() {
    if (AudioManager && !AudioManager.state.isMusicAttemptingToPlay && !AudioManager.state.isMusicPlayed) {
        AudioManager.play();
    }
}

// Function untuk cek viewport width
function getViewportWidth() {
    return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
}

if (getViewportWidth() > 960) {
    $(document).on('touchstart click', function (e) {
        // Play Music Once
        playMusicOnce()
    });
}

/*  ==============================
        BOOK CONFIGURATION
============================== */
// ---------- SELECTIZE --------------------------------------------------
(function bookConfiguration() {
    if (typeof window.BOOKS != 'undefined') {
        var books = window.BOOKS,
            template = '',
            allBank = [];

        // if books are not empty
        if (books != '') {
            // Looping
            for (var i = 0; i < books.length; i++) {
                template = {
                    'id': books[i]['id'],
                    'title': books[i]['title'],
                    'credential': books[i]['credential']
                }
                allBank.push(template);
            }

            // Options
            var options = {
                maxItems: 1,
                valueField: 'id',
                labelField: 'title',
                searchField: 'title',
                options: allBank,
                create: false,
                render: {
                    item: function (item, escape) {
                        return '<div>' +
                            (item.title ? '<p>' + escape(item.title) + '</p>' : '') +
                            '</div>';
                    },
                    option: function (item, escape) {
                        var label = item.title;
                        var desc = item.credential;
                        return '<div class="item">' +
                            '<p style="font-size: 14px;"><strong>' + escape(label) + '</strong></p>' +
                            '<p style="font-size: 12px;"><strong>' + escape(desc) + '</strong></p>' +
                            '</div>';
                    }
                },
                onInitialize: function () {
                    var instance = this;

                    // disabled input
                    instance.$control_input.attr('readonly', 'readonly');

                    // Document onClick
                    $(instance.$control).off('click').on('click', function (e) {
                        e.stopPropagation();

                        // is focused
                        if (instance.isFocused) return false;
                    });
                }
            };

            // Choose Bank Default
            if ($('select[name="choose_bank"]').length > 0) {
                var select = $('select[name="choose_bank"]').selectize(options);
                var selectize = $(select)[0].selectize;
                if (allBank.length > 0) {
                    selectize.setValue(allBank[0]['id'], 1);
                }
                $(".selectize-input input").attr('readonly', 'readonly');
            }
        }
    }
}());


/*  ==============================
        PROTOCOL
============================== */
(function protocolConfiguration() {
    // if protocol is not undefined
    if (typeof window.PROTOCOL != 'undefined') {
        var protocolSlider = window.PROTOCOL.slider,
            protocolDots = window.PROTOCOL.dots;

        var protocolOptions = {
            centerMode: true,
            centerPadding: '60px',
            slidesToShow: 3,
            variableWidth: true,
            slidesToScroll: 1,
            swipeToSlide: true,
            autoplay: true,
            autoplaySpeed: 3000,
            infinite: true,
            speed: 700,
            cssEase: 'ease-in-out',
            dots: false,
            arrows: false,
            asNavFor: protocolDots,
            pauseOnFocus: false,
            pauseOnHover: false,
            draggable: true,
            // touchMove: false,
            responsive: [
                {
                    breakpoint: 600,
                    settings: {
                        slidesToShow: 1,
                    }
                }
            ]
        }

        var protocolDotsOptions = {
            centerMode: true,
            variableWidth: true,
            slidesToScroll: 1,
            swipeToSlide: true,
            autoplay: true,
            autoplaySpeed: 3000,
            infinite: true,
            speed: 700,
            cssEase: 'ease-in-out',
            dots: false,
            arrows: false,
            asNavFor: protocolSlider,
            pauseOnFocus: false,
            pauseOnHover: false,
            draggable: true,
        }

        if ($(protocolSlider).hasClass('slick-initialized')) $(protocolSlider).slick('unslick');     // unslick the slider
        if ($(protocolDots).hasClass('slick-initialized')) $(protocolDots).slick('unslick');    // Unslick the dots

        $(protocolSlider).slick(protocolOptions);       // slick the slider
        $(protocolDots).slick(protocolDotsOptions);     // slick the dots

        // Before Change
        $(protocolSlider).on('beforeChange', function (event, slick, currentSlide, nextSlide) {
            if (nextSlide == 0) {
                var cls = 'slick-current slick-active' + (protocolOptions.centerMode ? ' slick-center' : '');

                setTimeout(function () {
                    $('[data-slick-index="' + slick.$slides.length + '"]').addClass(cls).siblings().removeClass(cls);
                    for (var i = slick.options.slidesToShow - slick.options.slidesToShow; i >= 0; i--) {
                        $('[data-slick-index="' + i + '"]').addClass(cls);
                    }
                }, 10);
            }
        });
    }
}());


/*  ==============================
        PERSON
============================== */
var hideInfoTimeout;                // Hide Timeout Out

// Toggle Person Info
function togglePersonInfo() {
    var person = $('#person'),
        greeting = $(person).find('.person-greeting'),
        info = $(person).find('.person-info');

    if ($(person).length) {

        var showGreeting = function () {
            $(greeting).addClass('show');
        }
        var hideGreeting = function () {
            $(greeting).removeClass('show');
        }
        var showInfo = function () {
            $(info).addClass('show');
            hideInfoTimeout = setTimeout(function () {
                hideInfo();         // Hide Info
                showGreeting();     // Show Greeting
            }, 10000);
        }
        var hideInfo = function () {
            $(info).removeClass('show');
            if (typeof hideInfoTimeout != 'undefined') {
                clearTimeout(hideInfoTimeout);           // Clear Timeout                    
            };
        }

        $(greeting).hasClass('show') ? hideGreeting() : showGreeting();            // Toggle Greeting
        $(info).hasClass('show') ? hideInfo() : showInfo();                        // Toggle Info

        if ($(greeting).hasClass('show') === false && $(info).hasClass('show') === false) showGreeting();       // Default Set        
        if ($(greeting).hasClass('show') && $(info).hasClass('show')) hideInfo();                               // If both is showed
    }
}

$(function () {
    setTimeout(togglePersonInfo, 1000);
});



/*  ==============================
        GALLERY SLIDER SYNCING
============================== */
// SLIDER SYNCING
function startSliderSyncing() {
    if ($('.slider-syncing__preview').length && $('.slider-syncing__nav').length) {

        var sliderSyncingPreviewOptions = {
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            fade: true,
            asNavFor: '.slider-syncing__nav'
        }
        var sliderSyncingNavOptions = {
            slidesToShow: 1,
            slidesToScroll: 1,
            asNavFor: '.slider-syncing__preview',
            arrows: false,
            dots: false,
            centerMode: true,
            focusOnSelect: true,
            speed: 750,
            variableWidth: true,
            infinite: true,
        }

        var sliderSyncingPreview = $('.slider-syncing__preview');
        var sliderSyncingNav = $('.slider-syncing__nav');

        if ($(sliderSyncingPreview).hasClass('slick-initialized')) $(sliderSyncingPreview).slick('unslick');
        if ($(sliderSyncingNav).hasClass('slick-initialized')) $(sliderSyncingNav).slick('unslick');

        $(sliderSyncingPreview).slick(sliderSyncingPreviewOptions);
        $(sliderSyncingNav).slick(sliderSyncingNavOptions);

    }
}

// SINGLE SLIDER
function gallerySingleSlider(configs) {
    if (typeof window.GALLERY_SINGLE_SLIDER != 'undefined' && window.GALLERY_SINGLE_SLIDER === true) {

        var singleSliderContainer = $('#singleSliderContainer');        // Single Slider Container

        // custom container
        if (typeof configs !== 'undefined' && configs.hasOwnProperty("container")) {
            singleSliderContainer = $(configs.container);
        }

        if (singleSliderContainer.length) {
            var singleSliderOptions = {
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                dots: false,
                centerMode: true,
                speed: 300,
                variableWidth: true,
                infinite: false,
                touchThreshold: 5000,
                swipeToSlide: false
            }

            // configs is an object
            if (typeof configs === 'object') singleSliderOptions = { ...singleSliderOptions, ...configs };


            if ($(singleSliderContainer).hasClass('slick-initialized')) $(singleSliderContainer).slick('unslick');      //  Unslick if it has initialized
            var singleSlider = $(singleSliderContainer).slick(singleSliderOptions);            // Start new slider

            // Single Slider On Wheel
            singleSlider.on('wheel', (function (e) {
                e.preventDefault();

                if (e.originalEvent.deltaY > 0) {
                    $(this).slick('slickNext');
                } else {
                    $(this).slick('slickPrev');
                }
            }));

            // is Sliding
            var isSliding = false;

            // Before Change
            $(singleSliderContainer).on('beforeChange', function (event, slick, currentSlide, nextSlide) {
                isSliding = true;

                if (nextSlide == 0) {
                    var cls = 'slick-current slick-active' + (singleSliderOptions.centerMode ? ' slick-center' : '');

                    if (singleSliderOptions.infinite === true) {
                        setTimeout(function () {
                            $('[data-slick-index="' + slick.$slides.length + '"]').addClass(cls).siblings().removeClass(cls);
                            for (var i = slick.options.slidesToShow - slick.options.slidesToShow; i >= 0; i--) {
                                $('[data-slick-index="' + i + '"]').addClass(cls);
                            }
                        }, 10);
                    }
                }

            });

            // After Change
            $(singleSliderContainer).on('afterChange', function (event, slick, currentSlide) {
                isSliding = false;
            });

            // Prevent Trigger Clicking While Swiping
            singleSlider.find('.singleSliderPicture > .anchor').click(function (e) {
                if (isSliding) {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }
            });

            // Single Slider Picture
            $(singleSliderContainer).find('.singleSliderPicture').each(function (i, picture) {
                var width = $(this).width();
                var height = width + (width / 3);

                $(picture).css('--width', width + 'px');
                $(picture).css('--height', height + 'px');
            });

        }
    }
}


// KAT GALLERY MODERN
function galleryKatModern() {
    if (typeof window.GALLERY_MODERN != 'undefined' && window.GALLERY_MODERN === true) {
        var galleryModern = $('#katGalleryModern');
        if (galleryModern.length) {

            var imgWrap = $(galleryModern).find('.modern__img-wrap').get(0);
            var modernList = $(galleryModern).find('.modern__list').children();
            var modulus = modernList.length % 3;

            // Modern List
            if (modernList.length) {

                // Moder List
                $(modernList).each(function (i, list) {
                    var margin = 2.5;
                    var width = $(list).width();
                    width = width - (margin * 2);
                    var height = width + (width / 3);

                    $(list).css('width', width + 'px');
                    $(list).css('height', height + 'px');
                    $(list).css('margin', margin + 'px');

                    if (modulus > 0 && (modernList.length - 1) == i) {
                        $(list).css('flex-grow', '1');
                    }
                });

                // Modern List On Click
                $(modernList).on('click', function (e) {
                    e.preventDefault();
                    var me = this;
                    var src = $(me).attr('href');

                    if ($(me).hasClass('selected') === false) {
                        // Modern List
                        $(modernList).each(function (i, list) {
                            $(list).removeClass('selected');
                        });
                        $(me).addClass('selected');             // Selected

                        if (typeof imgWrap != 'undefined') {
                            var img = $(imgWrap).children('img');
                            $(img).removeClass('show');

                            setTimeout(function () {
                                $(img).attr('src', src);

                                setTimeout(function () {
                                    $(img).addClass('show');
                                }, 375);

                            }, 350);
                        }
                    }
                });

                // Trigger first element
                $(modernList).eq(0).trigger('click');

            }

            // Img Wrap        
            if (typeof imgWrap != 'undefined') {
                var margin = 2.5;
                var width = $(imgWrap).width();
                width = width - (margin * 2);
                var height = width + (width / 3);

                $(imgWrap).css('width', width + 'px');
                $(imgWrap).css('height', height + 'px');
                $(imgWrap).css('margin', margin + 'px auto');
            }
        }
    }
}



/*  ==============================
        OTHERS
============================== */

// ---------- Modal Video ---------------------------------------------------------------
var modal_video_options = {
    youtube: {
        autoplay: 1,
        cc_load_policy: 1,
        color: null,
        controls: 1,
        disableks: 0,
        enablejsapi: 0,
        end: null,
        fs: 1,
        h1: null,
        iv_load_policy: 1,
        // list: null,
        listType: null,
        loop: 0,
        modestbranding: null,
        mute: 0,
        origin: null,
        // playlist: null,
        playsinline: null,
        rel: 0,
        showinfo: 1,
        start: 0,
        wmode: 'transparent',
        theme: 'dark',
        nocookie: false,
    }
};

$('.play-btn').modalVideo(modal_video_options);
$('.play-youtube-video').modalVideo(modal_video_options);

// start auto-play video
function tryAutoplay(player) {
    if (!player) return;

    if (userInteractionGranted) {
        player.play().catch(err => {
            console.warn('Autoplay failed:', err);
        });
    } else {
        console.log('Autoplay blocked until user interaction.');
    }
}

// start auto-play video
function startAutoplayVideo() {
    const sectionCls = '.autoplay-video-section';
    const videoBoxCls = '.autoplay-video-box';
    const videoCls = '.autoplay-video';

    let videoPlayers = [];
    const videoJsProps = {
        controls: true,
        autoplay: false,
        muted: true,
        loop: false,
        disablePictureInPicture: true,
        playsinline: true,
        fluid: true,
        techOrder: ['youtube'],
        youtube: {
            rel: 0,
            iv_load_policy: 3,
            cc_load_policy: 0,
            playsinline: 1,
        },
    };

    // intersection observer
    const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const sectionPos = $(entry.target).attr('data-pos') || null;
            const videoPlayer = videoPlayers.find(p => p.pos == sectionPos);

            if (videoPlayer && videoPlayer.players.length) {
                if (entry.isIntersecting) {
                    $(entry.target).attr('data-onview', true);

                    if (videoPlayer.currentPlayer) {
                        if (videoPlayer.currentPlayer.paused()) {
                            tryAutoplay(videoPlayer.currentPlayer);
                        }
                    } else {
                        tryAutoplay(videoPlayer.players[0].player);
                    }

                    // if (typeof pauseMusic === 'function') pauseMusic();
                } else {
                    $(entry.target).attr('data-onview', false);

                    if (videoPlayer.currentPlayer && !videoPlayer.currentPlayer.paused()) {
                        videoPlayer.currentPlayer.pause();
                    }

                    if (typeof playMusic === 'function') playMusic();
                }
            }
        });
    });

    const initVideo = (parentPos, section, pos, video) => {
        const url = $(video).attr('data-url');
        $(video).attr('data-pos', pos);

        const videoPlayer = videoPlayers.find(vp => vp.pos == parentPos);

        if (url && videoPlayer) {
            const videoEl = document.createElement('video');
            const source = document.createElement('source');
            source.src = url;
            source.type = 'video/youtube';
            videoEl.className = 'video-js';
            videoEl.appendChild(source);
            video.appendChild(videoEl);

            const player = videojs(videoEl, videoJsProps);
            videoPlayer.players.push({ pos, player });

            player.on('play', function () {
                if (videoPlayer.currentPlayer && videoPlayer.currentPlayer.id_ !== player.id_ && !videoPlayer.currentPlayer.paused()) {
                    videoPlayer.currentPlayer.pause();
                }

                $(video).closest(videoBoxCls).addClass('is-playing');
                $(video).addClass('show');
                videoPlayer.currentPlayer = player;
            });

            player.on('pause', function () {
                $(video).closest(videoBoxCls).removeClass('is-playing');
                $(video).removeClass('show');
            });

            player.on('ended', function () {
                $(video).closest(videoBoxCls).removeClass('is-playing');
                $(video).removeClass('show');
                videoPlayer.currentPlayer = null;

                if (videoPlayer.players.length > 1) {
                    const nextPos = pos + 1;
                    const nextPlayer = videoPlayer.players.find(p => p.pos == nextPos);

                    if (nextPlayer) {
                        tryAutoplay(nextPlayer.player);
                    }
                }
            });

            player.on('volumechange', function () {
                if (!player.muted()) {
                    if (typeof pauseMusic === 'function') pauseMusic();
                } else {
                    if (typeof playMusic === 'function') playMusic();
                }
            });

            // player.on('timeupdate', function () {
            //     // unmute kalau user udah interact
            //     if (player.muted() && player.currentTime() > 0 && userInteractionGranted) {
            //         player.muted(false);
            //     }
            // });

            player.on('error', function () {
                player.dispose();
                const errorIdx = videoPlayer.players.findIndex(p => p.pos == pos);
                if (errorIdx !== -1) {
                    videoPlayer.players.splice(errorIdx, 1);
                }
            });

            $(video).closest(videoBoxCls).on('click', function (e) {
                if (e.target.closest('.play-btn, .play-youtube-video, .autoplay-video')) return;

                if (player.paused()) {
                    tryAutoplay(player);
                }
            });
        }
    };

    const initSection = (pos, section) => {
        $(section).attr('data-onview', false);
        $(section).attr('data-pos', pos);
        videoPlayers.push({ pos, currentPlayer: null, players: [] });
        videoObserver.observe(section);

        $(section).find(videoCls).each(function (childPos, video) {
            initVideo(pos, section, childPos, video);
        });
    };

    $(sectionCls).each(function (i, section) {
        initSection(i, section);
    });
}


// ---------- AOS (Animation) ------------------------------------------------------
var AOSOptions = {
    // Global settings:
    disable: false, // accepts following values: 'phone', 'tablet', 'mobile', boolean, expression or function
    startEvent: 'DOMContentLoaded', // name of the event dispatched on the document, that AOS should initialize on
    initClassName: 'aos-init', // class applied after initialization
    animatedClassName: 'aos-animate', // class applied on animation
    useClassNames: false, // if true, will add content of `data-aos` as classes on scroll
    disableMutationObserver: false, // disables automatic mutations' detections (advanced)
    debounceDelay: 0, // the delay on debounce used while resizing window (advanced)
    throttleDelay: 0, // the delay on throttle used while scrolling the page (advanced)

    // Settings that can be overridden on per-element basis, by `data-aos-*` attributes:
    offset: 10, // offset (in px) from the original trigger point
    delay: 0, // values from 0 to 3000, with step 50ms
    duration: 400, // values from 0 to 3000, with step 50ms
    easing: 'ease', // default easing for AOS animations
    once: true, // whether animation should happen only once - while scrolling down
    mirror: false, // whether elements should animate out while scrolling past them
    anchorPlacement: 'top-bottom', // defines which position of the element regarding to window should trigger the animation
}

// EXTEND DEFAULT AOS
document.addEventListener("DOMContentLoaded", () => {
    const MAX_AOS_TIME = 3000; // batas default dari AOS

    document.querySelectorAll("[data-aos-duration], [data-aos-delay]").forEach(el => {
        // Durasi
        if (el.dataset.aosDuration) {
            const durasi = parseFloat(el.dataset.aosDuration);
            if (durasi > MAX_AOS_TIME) {
                el.style.transitionDuration = durasi + "ms";
            }
        }

        // Delay
        if (el.dataset.aosDelay) {
            const delay = parseFloat(el.dataset.aosDelay);
            if (delay > MAX_AOS_TIME) {
                el.style.transitionDelay = delay + "ms";
            }
        }
    });
});

// Run AOS on Load
$(window).on('load', function () {
    AOS.refresh();
});

// initialization of the AOS
function initAOS() {
    AOS.init(AOSOptions);

    $(window).on("scroll", function () {
        AOS.init(AOSOptions);
    });
}


// ---------- LIGHT GALLERY --------------------------------------------------
$(function () {
    lightGallery(document.getElementById('lightGallery'), {
        download: false,
    });

    showGalleries();
});

// SHOW GALLERY
function showGalleries() {
    $('.lightgallery').each(function (i, gallery) {
        lightGallery(gallery, {
            download: false,
        });
    });
};



var einvitationCardReload = true;

// Capturing E Invitation Card
var capturing_einvitation_card = function () {
    // not allowed
    if (einvitationCardReload) return false;

    const $qrcardWrapper = $('.rsvp-qrcard-wrap');
    const $qrcardImage = $qrcardWrapper.find('.rsvp-qrcard-img');
    const $qrcardButton = $qrcardWrapper.find('.rsvp-confirm-btn');

    let formData = new FormData();
    formData.append('post', 'postCapturedPage');

    // blur it
    $qrcardImage.css({
        filter: 'blur(2px)'
    });

    const onSuccess = (res) => {
        // returned cards
        if (typeof res.card !== 'undefined' && res.card) {
            // replace image
            $qrcardImage.attr('src', res.card);
            $qrcardButton.attr('href', res.card);

            einvitationCardReload = true;
        }

        // unblur it
        $qrcardImage.css({
            filter: ''
        });
    }

    postData(formData, onSuccess);
}



/*  ================================================
        RSVP Functions
============================================= */

// Function RSVP Init
var fn_rsvp_init = function () {

    var post, request, content, template, changeButton;

    if (typeof window.RSVP_DATA != 'undefined') {
        post = window.RSVP_DATA.post;
        request = window.RSVP_DATA.request;
        content = window.RSVP_DATA.content;
        template = window.RSVP_DATA.template;
        changeButton = window.RSVP_DATA.changeButton;
    }

    var changeRSVPText = $(changeButton).html();

    // Data
    var data = new FormData();
    data.append('post', post);
    data.append('request', request);
    data.append('content', content);
    data.append('template', template);

    var onSuccess = function (res) {
        // content
        if (res.rsvp_content && res.rsvp_content != '') {
            // append content to body
            $('.rsvp-body').html(res.rsvp_content);

            // URLify
            $('.rsvp-body').find('p').each(function (i, el) {
                el.innerHTML = urlify(el.innerHTML);
            });

            // RSVP Status
            if ($('input[type="radio"][name="rsvp_status"]:checked').length == 0) {
                $('input[type="radio"][name="rsvp_status"]').eq(0).trigger('click');
            }
        }

        $(changeButton).html(changeRSVPText).prop('disabled', false);

        // capturing
        capturing_einvitation_card();
    }

    var onError = function (res = null) {
        $(changeButton).html(changeRSVPText).prop('disabled', false);
    }

    var beforeSend = function () {
        $(changeButton).html(changeRSVPText + " <i class='fas fa-spinner fa-spin'></i>").prop('disabled', true);
    }

    postData(data, onSuccess, onError, beforeSend);
}


// Function RSVP Change
var fn_rsvp_change = function (e) {
    e.preventDefault();

    if (typeof window.RSVP_DATA != 'undefined') {
        window.RSVP_DATA.content = 'rsvp_form';

        if (typeof fn_rsvp_init === 'function') fn_rsvp_init();

        window.RSVP_DATA.content = '';
    }
}

$(document).on('click', '#changeRSVP', fn_rsvp_change);


// Function RSVP Form
var fn_rsvp_form = function (e) {
    e.preventDefault();
    var data = new FormData(this);
    var form = this;

    var submitButton = $(form).find('button.submit');
    var submitText = $(submitButton).html();

    var onSuccess = async function (res) {
        try {

            if (res.pages && res.pages.length > 0) {
                await e_invitation_handler(res.pages);
            }

            if (res.redirect_to && res.redirect_to !== '') {
                window.location.href = res.redirect_to + '#toRsvp';
                return;
            }

            // Update konten RSVP
            if (res.rsvp_content && res.rsvp_content !== '') {
                $('.rsvp-body').html(res.rsvp_content);

                // URLify
                $('.rsvp-body').find('p').each(function (i, el) {
                    el.innerHTML = urlify(el.innerHTML);
                });
            }
        } catch (err) {
            console.error('Error during e_invitation_handler:', err);
        } finally {
            afterSend();
        }
    };

    var onError = function (res = null) {
        afterSend(true);
    };

    var afterSend = function (isError = false) {
        $(form).find('input, button').prop('disabled', false);

        if (!isError) {
            window.cleanupWeddingTemplate();
            window.MemberInputs.clearAll();
            window.RSVPFormManager.updateRsvpTitle(0);
        }

        $(submitButton).html(submitText);
    };

    var beforeSend = function () {
        $(form).find('input, button').prop('disabled', true);
        $(submitButton).html(submitText + " <i class='fas fa-spinner fa-spin'></i>");
    };

    postData(data, onSuccess, onError, beforeSend);
};


$(document).on('submit', 'form#RSVPForm', fn_rsvp_form);


// Function RSVP Amount Toggle
var fn_rsvp_amount_toggle = function (e) {
    e.preventDefault();
    if (typeof window.RSVP_DATA != 'undefined') {
        if ($(this).val() == 'going') {
            $(window.RSVP_DATA.amountElement).slideDown('slow');
        } else {
            $(window.RSVP_DATA.amountElement).slideUp('slow');
        }
    }
}

$(document).on('change', 'input[type="radio"][name="rsvp_status"]', fn_rsvp_amount_toggle);

// whether this invitation is inside the iframe or main window
let isLivePreview = window.frameElement ? true : false;

// Customization Template
function customizationTemplate(data) {

    var customFontsClass = '';

    // Selected Fonts
    if (data.selectedFonts) {
        Object.entries(data.selectedFonts).forEach(([key, field]) => {
            // css variable
            var cssvar = key.split(/(?=[A-Z])/).join('-').toLowerCase();

            // Reset values
            $('body').css({
                [`--${cssvar}-family`]: '',
                [`--${cssvar}-style`]: '',
                [`--${cssvar}-weight`]: '',
                [`--${cssvar}-size`]: '',
                [`--${cssvar}-lettercase`]: ''
            });

            // Priority font family
            if (field.family && field.category) {
                $('body')[0].style.setProperty(`--${cssvar}-family`, `"${field.family}", ${field.category}`, 'important');
                customFontsClass = 'custom-fonts';
            }

            // Priority font style
            if (field.style) {
                $('body')[0].style.setProperty(`--${cssvar}-style`, `${field.style}`, 'important');
            }

            // Priority font weight
            if (field.weight) {
                $('body')[0].style.setProperty(`--${cssvar}-weight`, `${field.weight}`, 'important');
            }

            // Priority font size
            if (field.size) {
                $('body')[0].style.setProperty(`--${cssvar}-size`, `${field.size}px`, 'important');
            }

            // Priority font lettercase
            if (field.lettercase) {
                $('body')[0].style.setProperty(`--${cssvar}-lettercase`, `${field.lettercase}`, 'important');
            }

            // URL
            if (field.url) {
                // check if url exist
                $('link.font-css').each(function (i, link) {
                    if ($(link).attr('href') == field.url) $(link).addClass('stay');
                });

                // append link
                if ($(`link.font-css[href="${field.url}"]`).length == 0) {
                    $('head').append(`<link class="font-css stay" rel="stylesheet" href="${field.url}">`);
                }
            }
        });
    }

    // remove font-css
    $('link.font-css:not(.stay)').remove();
    $('link.font-css').removeClass('stay');


    // Selected Colors
    if (data.selectedColors) {
        Object.entries(data.selectedColors).forEach(([key, field]) => {
            // css variable
            var cssvar = key.split(/(?=[A-Z])/).slice(1).join('-').toLowerCase();

            // Reset values
            $('body').css({
                [`--${cssvar}`]: ''
            });

            // Priority Color
            if (field) {
                $('body')[0].style.setProperty(`--${cssvar}`, `${field}`, 'important');
            }
        });
    }

    // body has class
    if (typeof $('body').attr('class') !== 'undefined') {
        // Get preset classes
        var presetClasses = $('body').attr('class').split(' ').filter(x => x.indexOf('preset-') !== -1);

        // Remove preset classes
        presetClasses.map(x => $('body').removeClass(`${x.replace('preset-', '')} ${x}`));
    }

    // Add body class
    $('body').removeClass('custom-fonts').addClass(`${customFontsClass}`);

    // Preset class
    if (data.presetCode) $('body').addClass(`${data.presetCode} preset-${data.presetCode}`);

    // Layout Structure
    if (typeof data.layouts !== 'undefined' && typeof data.layouts?.structure !== 'undefined') {
        // re-order section using stored layouts
        sortSectionsByLayout(data.layouts?.structure, data.layouts?.enabled, data.layouts?.default);
    }
}

/**
 * Sort elemen berdasarkan layout structure
 */
function sortSectionsByLayout(incomingStructure, enabled, defaultStructure) {
    // elements
    var sections = Array.from(document.querySelectorAll('[data-section-order]'));
    var primaryPane = document.querySelector('.primary-pane');

    // get data from window 
    var manageSectionEnabled = window.MANAGE_SECTION_ENABLED ?? enabled ?? false;
    var defaultLayouts = window.DEFAULT_LAYOUTS ?? defaultStructure ?? null;
    var sectionClasses = window.SECTION_HIDDEN_CLASS ?? [];

    // list known font variables
    var fontVariables = [
        '--body-text-size',
        '--heading-size',
    ];
    
    // skip it when there is no section
    if (sections.length === 0) return;
    
    // get first parent of the sections
    var parent = sections.length > 0 ? sections[0].parentNode : null;

    // ordering function
    const _ordering = function(_s) {
        // get section footer to append in to the last section
        const sectionFooter = parent.querySelector('[data-section-footer]');

        // Re-append sections yang di-sort
        _s.forEach(function(section) {
            // append the section into the parent
            parent.appendChild(section);
        });

        // when footer exists
        if (sectionFooter) {
            // append last section
            parent.appendChild(sectionFooter);
        }
    }

    // when it is inside an iframe and layout must be reset
    // deprecated sooner
    if (isLivePreview && incomingStructure == null) {
        // sorting the items
        sections.sort((a, b) => {
            const getOrder = (item) => {
                const key = item.dataset.sectionOrder;

                if (key === 'opening_cover') return -1;
                if (key === 'footnote') return 1000;

                const index = defaultLayouts.indexOf(key);
                return index === -1 ? 999 : index;
            };

            return getOrder(a) - getOrder(b);
        });

        // iterates the fonts
        fontVariables.forEach(function(cssVar) {
            // remove property from primary pane
            if (primaryPane) {
                primaryPane.style.removeProperty(cssVar);
            }
        });

        // iterates the sections
        sections.forEach(section => {
            // iterates the fonts
            fontVariables.forEach(function(cssVar) {
                section.style.removeProperty(cssVar); // remove property
            });
        });

        // ordering sections to new positions
        return _ordering(sections);
    }

    // Loop semua sections untuk set visibility
    for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]; // section item

        var sectionName = section.dataset.sectionOrder; // get section name from attribute
        if (!sectionName) continue; // section name is invalid, then skip

        let classToApply = '';

        // APPLY CLASS from sectionClasses 
        if (typeof sectionClasses[sectionName] !== 'undefined') {
            // get special class for section
            classToApply = String(sectionClasses[sectionName] ?? '').trim();
            if (classToApply) {
                // adding class to section, with:
                // handle multiple spaces and remove empty string
                section.classList.add(
                    ...classToApply.split(/\s+/).filter(Boolean)
                );
            }
        }

        // get config for current section
        var config = incomingStructure ? incomingStructure[sectionName] : null;

        // config does not exist, it is not inside an iframe and the section should be hidden
        if (!config && !isLivePreview && classToApply.includes('section-hidden')) {
            sections[i].remove(); // removing the section
            sections.splice(i, 1); // remove item from array
        }

        // when config exists
        if (config) {
            // Set visibility
            if (typeof config?.enabled !== 'undefined') {
                if (isLivePreview) {
                    // it is in inside an iframe
                    if (typeof config?.always_shown === 'undefined' || config?.always_shown == false) {
                        // make sure always_shown isn't available

                        // show or hide section
                        section.style.setProperty(
                            'display', 
                            (config?.enabled ? 'block' : 'none'), 
                            'important'
                        );
                    }
                } else {
                    // it is independent window
                    // section is disabled
                    if (!config.enabled) {
                        sections[i].remove(); // removing the section
                        sections.splice(i, 1); // remove item from array
                    }
                }
            }

            // Applying font level to text inside this section
            if (typeof config?.font_level !== 'undefined') {
                // get computed style from body
                var bodyStyles = window.getComputedStyle(document.body);
                var fontLevel = parseFloat(config.font_level) || 0;
                
                // iterates the fonts
                fontVariables.forEach(function(cssVar) {
                    var currentValue = bodyStyles.getPropertyValue(cssVar).trim();
                    if (currentValue) {
                        // Parse nilai (hapus 'px', 'rem', dll)
                        var baseSize = parseFloat(currentValue);

                        let levelValue;

                        switch (fontLevel) {
                            case -2:
                                levelValue = -(baseSize * 50 / 100)
                                break;
                            case -1:
                                levelValue = -(baseSize * 25 / 100)
                                break
                            case 2:
                                levelValue = baseSize * 50 / 100
                                break;
                            case 1:
                                levelValue = baseSize * 25 / 100
                                break
                            default:
                                levelValue = 0
                        }
                        
                        if (!isNaN(baseSize)) {
                            var totalSize = baseSize + levelValue; // calculating the total font size
                            
                            // set font level to each section
                            var unit = currentValue.replace(/[\d.-]/g, '').trim() || 'px';
                            section.style.setProperty(cssVar, `${totalSize}${unit}`, 'important');
                            
                            // set font level to primary pane as it is the cover
                            if (sectionName === 'opening_cover' && primaryPane) {
                                primaryPane.style.setProperty(cssVar, `${totalSize}${unit}`, 'important');
                            }
                        }
                    }
                });
            }
        }
    };

    // Custom Layout - sort when feature is enabled
    if (manageSectionEnabled) {
        // re-order the sections
        sections.sort((a, b) => {
            const aOrder = parseFloat(incomingStructure ? incomingStructure[a.dataset.sectionOrder]?.order : 999);
            const bOrder = parseFloat(incomingStructure ? incomingStructure[b.dataset.sectionOrder]?.order : 999);

            const safeA = isNaN(aOrder) ? Infinity : aOrder;
            const safeB = isNaN(bOrder) ? Infinity : bOrder;

            return safeA - safeB;
        });

        // ordering sections to new positions
        return _ordering(sections);
    }

    return; // void
}

// Window visualViewport
$(window.visualViewport).on('resize', function () {

    // body height
    $('body').css({ '--body-height': `${window.visualViewport.height}px` });

});

// Before unload
$(window).on('beforeunload', function () {
    // Pause Music
    if (typeof isMusicPlayed !== 'undefined' && isMusicPlayed && typeof pauseMusic === 'function') return pauseMusic();
});


// Get Message
window.addEventListener('message', function (event) {
    // verify origin
    if (typeof window.extractMainDomain === 'function') {
        if (extractMainDomain(event.origin) === extractMainDomain(this.window.location.origin)) {

            var action = event.data.action;

            // Customize Template
            if (action === "customizeTemplate" && event.data.customizeTemplate) {
                isLivePreview = true; // it is exactly acting as an iframe
                customizationTemplate(event.data.customizeTemplate);
            }

            // Load Content
            if (action === "loadContent" && typeof event.data.content !== 'undefined') {
                var iframeDoc = event.target.document;
                var content = event.data.content;

                // Replace the iframe's content
                iframeDoc.open();
                iframeDoc.write(content);
                iframeDoc.close();
            }

            // Get Defult Layouts
            if (action === "getDefaultLayouts") {
                // Send Message
                window.parent.postMessage({
                    action: "responseDefaultLayouts",
                    data: window.DEFAULT_LAYOUTS
                }, event.origin);
            }

        }
    }
});

// Section's order initialization
(function() { 
    // get susunan items sections
    const susunanItems = Array.from(document.querySelectorAll('[data-section-order]'));
    
    // they exist
    if (susunanItems.length > 0) {
        const defaultLayouts = [];

        // re-order default values
        susunanItems.forEach((item) => {
            const sectionName = item.dataset.sectionOrder; // get section name
            if (sectionName) {
                defaultLayouts.push(sectionName); // push to default layout
            }
        });

        // update default layouts
        window.DEFAULT_LAYOUTS = defaultLayouts;
    }

    // it is not shown as live preview
    if (!isLivePreview){
        // re-order section using stored layouts
        sortSectionsByLayout(window.INVITATION_LAYOUTS);
    }
})();

/* ===================================================
    FUNCTION KADO
==================================================  */

var func_kado_init = function () {
    var post, request, content, template, ornament;

    if (typeof window.KADO_DATA !== 'undefined') {
        post = window.KADO_DATA.post;
        request = window.KADO_DATA.request;
        content = window.KADO_DATA.content || 'hadiah_content';
        template = window.KADO_DATA.template || 'default';
        ornament = window.KADO_DATA.ornament || '';
    }

    var data = new FormData();
    data.append('post', post);
    data.append('request', request);
    data.append('content', content);
    data.append('template', template);
    data.append('modal', 'show_modal_kado')

    var onSuccess = function (res) {
        if (res.hadiah_content && res.hadiah_content !== '') {
            var kadoSection = $('.wedding-gifts-wrap');

            kadoSection.html(res.hadiah_content);

            if (ornament !== '' || ornament !== undefined) {
                kadoSection.find('.wedding-gifts-inner').prepend(ornament);
            }

            detailKadoClick();
        }
    };

    function detailKadoClick() {
        $(document).on('click', '.wedding-gifts-body .hadiah-card-button', function (e) {
            e.preventDefault();
            var KadoName = $(this).attr('data-name');
            var KadoAddress = $(this).attr('data-address');
            var KadoPrice = $(this).attr('data-price');
            var KadoAmount = $(this).attr('data-amount');
            var KadoWeb = $(this).attr('data-web');
            var KadoImg = $(this).attr('data-img');
            var KadoDesc = $(this).attr('data-description');
            var KadoID = $(this).attr('data-id');
            var KadoDibeli = $(this).attr('data-dibeli');
            var KadoDibelilabel = $(this).attr('data-dibeli-label');
            var KadoAmountlabel = $(this).attr('data-amount-label');
            showKadoModal(KadoName, KadoAddress, KadoPrice, KadoAmount, KadoWeb, KadoImg, KadoDesc, KadoID, KadoDibeli, KadoDibelilabel, KadoAmountlabel);
        });
    }

    function showKadoModal(KadoName, KadoAddress, KadoPrice, KadoAmount, KadoWeb, KadoImg, KadoDesc, KadoID, KadoDibeli, KadoDibelilabel, KadoAmountlabel) {
        var data = createFormData('show_modal_kado', 'Is_show');

        var onSuccess = function (res) {
            if (res.modal !== '') {
                openModal(res.modal);
                var KadoModal = $('.kat__cropper-modal.kado.modal-details');

                var currency = KadoModal.find('.price-field').attr('data-currency') || 'Rp';
                var formatPrice = currency + ' ' + parseFloat(KadoPrice).toLocaleString('id-ID');
                var SisaKado = parseFloat(KadoAmount) - parseFloat(KadoDibeli);

                KadoModal.find('.address').text(KadoAddress);
                KadoModal.find('.kado-img').attr('src', KadoImg);
                KadoModal.find('.kado-name').text(KadoName);
                KadoModal.find('.kado-ket').text(KadoDesc);
                KadoModal.find('.price-field').text(formatPrice);
                KadoModal.find('.amount-field').text(KadoAmountlabel);
                KadoModal.find('.buying-kado-btn').attr('href', cleanUrl(KadoWeb));
                KadoModal.find('.confirm-kado-btn').attr('data-id', KadoID);
                KadoModal.find('.confirm-kado-btn').attr('data-img', KadoImg);
                KadoModal.find('.confirm-kado-btn').attr('data-name', KadoName);
                KadoModal.find('.confirm-kado-btn').attr('data-sisa', SisaKado);
                KadoModal.find('.note-kado').text(KadoDibelilabel);

                CloseModalButton();
            }
        };

        postData(data, onSuccess);
    }

    $(document).on('click', '.confirm-kado-btn', function (e) {
        e.preventDefault();
        var returnKadoID = $(this).attr('data-id');
        var returnKadoImg = $(this).attr('data-img');
        var returnKadoName = $(this).attr('data-name');
        var returnKadoSisa = $(this).attr('data-sisa');
        showConfirmModal(returnKadoID, returnKadoImg, returnKadoName, returnKadoSisa);
    });

    function showConfirmModal(returnKadoID, returnKadoImg, returnKadoName, returnKadoSisa) {
        if ($('.kat__cropper-modal.kado.modal-confirm').length > 0) {
            return;
        }

        var data = createFormData('show_confirm_modal', 'is_confirm');
        var onSuccess = function (res) {
            if (res.modal !== '') {
                openModal(res.modal);

                var ConfirmModal = $('.kat__cropper-modal.kado.modal-confirm');
                ConfirmModal.find('[name="kado_id"]').val(returnKadoID);
                ConfirmModal.find('.img-confirm').attr('src', returnKadoImg);
                ConfirmModal.find('.img-caption').text(returnKadoName);
                ConfirmModal.find('[name="sisa_kado"]').val(returnKadoSisa);
                sendKado();
                CloseModalButton();
            }
        };

        postData(data, onSuccess);
    }

    function CloseModalButton() {
        $('.close-kado-btn').on('click', function (e) {
            e.preventDefault();
            closeModal();
        });
    }

    function sendKado() {
        $(document).off('submit', 'form#frmBuyGift'); // Unbind previous event handler
        $(document).on('submit', 'form#frmBuyGift', function (e) {
            e.preventDefault();

            var data = new FormData(this);
            var $this = $(this);
            var $submitBtn = $this.find('button.kado-send-btn');
            var submitText = $submitBtn.html();

            var onSuccess = function (res) {
                setTimeout(afterSend, 500);
                if (res.message) showAlert({ type: 'success', caption: res.message });

                $(`.hadiah-card-wrap[data-id="${res.kado_id}"]`).find('.hadiah-card-button').attr({
                    'data-dibeli': res.buyed,
                    'data-dibeli-label': res.buyed_label + '',
                    'data-sisa': res.leftover,
                    'data-amount-label': res.leftover_label,
                })

                if (res.soldOut_id) {
                    $(`.hadiah-card[data-id="${res.soldOut_id}"]`).addClass('sold-out');
                    $(`.hadiah-card-wrap[data-id="${res.soldOut_id}"]`).addClass('sold-out');
                }

                closeModal();
            }

            var onError = function (res = null) {
                if (res && res.message) showAlert({ type: 'danger', caption: res.message });

                if (res.soldOut_id) {
                    $(`.hadiah-card[data-id="${res.soldOut_id}"]`).addClass('sold-out');
                    $(`.hadiah-card-wrap[data-id="${res.soldOut_id}"]`).addClass('sold-out');
                    closeModal();
                }

                setTimeout(afterSend, 500);
            }

            var beforeSend = function () {
                $this.find('input, textarea, button').prop('disabled', true);
                $submitBtn.html(submitText + ' <i class="fas fa-spinner fa-spin"></i>');
            }

            var afterSend = function () {
                $this.find('input, textarea, button').prop('disabled', false);
                $submitBtn.html(submitText);
            }

            postData(data, onSuccess, onError, beforeSend);

            return false;
        });
    }

    function createFormData(postValue, modalValue) {
        var data = new FormData();
        data.append('post', postValue);
        data.append('modal', modalValue);
        return data;
    }


    var onError = function (res = null) {
        // alert("An error occurred while processing your request.");
    };

    postData(data, onSuccess, onError);
}


/*  ================================================
        BANK ACCORDION VERSION
============================================= */

// Bank Button Toggle
$('.bankBtnAccordion').on('click', function () {
    const index = $('.bankBtnAccordion').index(this);
    const $item = $('.bankItemAccordion').eq(index);
    const $icon = $(this).find('.ph-fill');
    const $btnTop = $(this);

    $item.slideToggle(500);
    $icon.toggleClass('rotate');
    $btnTop.toggleClass('active');
    $item.toggleClass('active');
});

$('.bankItemAccordion').each(function (index) {
    const $icon = $('.bankBtnAccordion').eq(index).find('.ph-fill');
    const $btnTop = $('.bankBtnAccordion').eq(index);
    const isVisible = $(this).is(':visible');
    $icon.toggleClass('rotate', isVisible);
    $btnTop.toggleClass('active', isVisible);
});


/*  ================================================
        DOCUMENT [ON READY]
============================================= */
$(document).ready(function () {
    // Scroll to top
    $(window).scrollTop(0);

    // $('.bankBtnAccordion').not(':first').trigger('click');
    $('.bankBtnAccordion').trigger('click');


    // body height
    $('body').css({ '--body-height': `${window.visualViewport.height}px` });

    // RSVP Inititalization
    if (typeof fn_rsvp_init === 'function') fn_rsvp_init();

    // Kado Inititalization
    if (typeof func_kado_init === 'function') func_kado_init();

    // ---------- URLify --------------------------------------------------
    $('p, label').each(function (i, el) {
        el.innerHTML = urlify(el.innerHTML);
    });

    // // ---------- Make Textarea getting small --------------------------------------------------
    // $.each($('textarea'), function(i, textarea){
    //     textarea.style.height = '1px';
    // });

    // ---------- Checking the Quantity Control value --------------------------------------------------
    $('[data-quantity="control"]').each(function (i, input) {
        var max = $(input).attr('max');
        var value = $(input).val();

        // If value is greater than max
        if (value >= max) $(input).val(max);

        // If value lower than 0
        if (value <= 0) $(input).val(1);
    });

    // ---------- Check nominal (Wedding Gift) value --------------------------------------------------    
    $('[name="nominal"]').each(function (i, el) {
        if ($(el).is(':checked')) {
            if ($(this).val() <= 0) {
                $('.insert-nominal').slideDown();
                $('.insert-nominal').find('[name="inserted_nominal"]').focus();
            }
        }
    });

    // ---------- Show or Hide Saving Books --------------------------------------------------
    var select = $('select[name="choose_bank"]');
    if (select.length) {
        chooseBank($(select).val());
    }

    // ---------- Attendance Toggling --------------------------------------------------
    $.each($('input[name="attendance"]'), function (i, input) {
        attendanceToggle(input);
    });

    // ---------- RSVP INNER --------------------------------------------------
    var rsvpInner = $('.rsvp-inner');
    if ($(rsvpInner).hasClass('come')) {
        // If RSVP Inner has 'come' class
        $(rsvpInner).find('.rsvp-form').fadeOut();
        $(rsvpInner).find('.rsvp-confirm').fadeIn();
    }
    if ($(rsvpInner).hasClass('not-come')) {
        // If RSVP Inner has 'not-come' class
        $(rsvpInner).find('.rsvp-form').fadeOut();
        $(rsvpInner).find('.rsvp-confirm').fadeIn();
    }
    if ($(rsvpInner).hasClass('no-news')) {
        // If RSVP Inner has 'no-news' class
        $(rsvpInner).find('.rsvp-form').fadeIn();
        $(rsvpInner).find('.rsvp-confirm').fadeOut();
    }

    // when autoplay video wrapper exists
    if ($('.autoplay-video-section').length > 0) {
        startAutoplayVideo(); // start auto-play video
    }

    setTimeout(() => {
        // when the page does not have loading page, then show the animation from here
        if (typeof window.LOADING_PAGE_EXISTS === 'undefined') {
            initAOS();
        }
    }, 1000);
});

/**
 * RSVP+
 * =====================================
 */

(function () {
    'use strict';

    /**
     * Main RSVP Form Manager Class
     * Handles RSVP form initialization, navigation, and state management
     */
    class RSVPFormManager {
        constructor() {
            this.initialized = false;
            this.currentStep = 0;
            this.totalSteps = 0;
            this.originalInfoText = null;
            this.originalInfoDate = null;
            this.config = {};
            this.cachedElements = {};
            this.eventHandlers = [];

            // Bind methods to maintain context
            this.setup = this.setup.bind(this);
            this.handleContinueClick = this.handleContinueClick.bind(this);
            this.navigateToStep = this.navigateToStep.bind(this);
        }

        /**
         * Initialize the RSVP form functionality
         * @param {Object} config - Configuration options
         */
        init(config = {}) {
            // Prevent multiple initializations
            if (this.initialized) {
                console.warn('RSVP Form Manager already initialized');
                return;
            }

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup(config));
            } else {
                this.setup(config);
            }
        }

        /**
         * Setup the form functionality
         * @param {Object} config - Configuration options
         */
        setup(config) {
            try {
                // Ensure jQuery is available
                if (typeof $ === 'undefined') {
                    throw new Error('jQuery is required for RSVP Form Manager');
                }

                // Set configuration with defaults
                this.config = Object.assign({
                    rsvpSteps: [],
                    rsvpPlusEnabled: false,
                    langContinue: 'Continue',
                    langSubmit: 'Submit',
                    language: 'ID',
                    animationDuration: 400,
                    enableLogging: false
                }, config);

                // Store rsvpSteps globally for updateQuestionWrappers function
                window.rsvpSteps = this.config.rsvpSteps;

                // Cache frequently used elements
                this.cacheElements();

                // Setup event handlers with proper cleanup tracking
                this.setupEventHandlers();

                // Initialize form based on configuration
                this.initializeForm();

                this.initialized = true;

                if (this.config.enableLogging) {
                    // console.log('RSVP Form Manager initialized successfully');
                }
            } catch (error) {
                console.error('Error initializing RSVP Form Manager:', error);
                this.handleError(error);
            }
        }

        /**
         * Cache frequently used DOM elements for performance
         */
        cacheElements() {
            this.cachedElements = {
                form: $("#RSVPForm"),
                rsvpTitle: $(".rsvp-title, .rsvp-titles"),
                rsvpInfoText: $(".rsvp-info .info-text"),
                rsvpInfoDate: $(".rsvp-info .info-date"),
                continueBtn: $("#continueToRsvpPlus"),
                wrapper: null, // Will be set during initialization
                plusContainers: null, // Will be set during initialization
                stepperNav: null // Will be set during initialization
            };

            // Log cached elements for debugging
            if (this.config.enableLogging) {
                console.log('Cached elements:', {
                    form: this.cachedElements.form.length,
                    rsvpTitle: this.cachedElements.rsvpTitle.length,
                    rsvpInfoText: this.cachedElements.rsvpInfoText.length,
                    rsvpInfoDate: this.cachedElements.rsvpInfoDate.length,
                    continueBtn: this.cachedElements.continueBtn.length
                });
            }
        }

        /**
         * Setup all event handlers with proper cleanup tracking
         */
        setupEventHandlers() {
            // Check all functionality
            this.addEventHandler($(document), "change", "#check-all", (e) => {
                $("input[name=\"selected_event[]\"]").prop("checked", $(e.target).prop("checked"));
            });

            // Continue button click handler (from initial step)
            this.addEventHandler($(document), "click", "#continueToRsvpPlus", (e) => {
                e.preventDefault();
                this.handleContinueClick();
            });

            // Dynamic navigation for Continue and Back buttons in plus steps
            this.addEventHandler($(document), "click", "[data-action=\"next\"]", (e) => {
                e.preventDefault();
                const nextStep = this.currentStep + 1;
                if (nextStep <= this.totalSteps) {

                    const formRsvp = this.cachedElements.form;
                    const activeStep = formRsvp.find(`.rsvp-plus-wrapper.active`);

                    const memberInputs = activeStep.find('input.form-control.member-input');
                    let emptyMember = memberInputs.toArray().some(input => !$(input).val()?.trim());
                    if (emptyMember) {
                        showAlert(this.config.language === 'EN' ? 'Please complete guest and companion names' : 'Tolong lengkapi nama tamu dan pendamping', 'error');
                        return;
                    }

                    const questionGroups = {};
                    activeStep.find('.form-check-input[type="radio"]').each(function () {
                        const name = $(this).attr('name');
                        if (!questionGroups[name]) questionGroups[name] = [];
                        questionGroups[name].push(this);
                    });

                    let hasUnanswered = Object.values(questionGroups).some(group => {
                        return !group.some(input => $(input).is(':checked'));
                    });

                    if (hasUnanswered) {
                        showAlert(this.config.language === 'EN' ? 'Please select an answer first' : 'Tolong pilih jawaban yang tersedia terlebih dahulu', 'error');
                        return;
                    }

                    const checkboxes = activeStep.find('.form-check-input[type="checkbox"][name^="selected_event"]');
                    if (checkboxes.length) {
                        const checkedCount = checkboxes.filter(':checked').length;
                        if (checkedCount === 0) {
                            showAlert(this.config.language === 'EN' ? 'Please select the event to attend' : 'Tolong pilih acara yang akan dihadiri', 'error');
                            return;
                        }
                    }

                    this.navigateToStep(nextStep);
                }
            });

            this.addEventHandler($(document), "click", "[data-action=\"back\"]", (e) => {
                e.preventDefault();
                const prevStep = this.currentStep - 1;
                if (prevStep === 0) {
                    this.navigateToStep(0);
                } else if (prevStep > 0) {
                    this.navigateToStep(prevStep);
                }
            });

            // Hide/show continue button text based on RSVP status
            this.addEventHandler($(document), "change", "input[name=\"rsvp_status\"]", (e) => {
                this.updateContinueButtonText($(e.target).val());
            });
        }

        /**
         * Add event handler with cleanup tracking
         * @param {jQuery} $element - jQuery element to attach handler to
         * @param {string} event - Event type
         * @param {string} selector - Selector for delegation
         * @param {Function} handler - Event handler function
         */
        addEventHandler($element, event, selector, handler) {
            $element.on(event, selector, handler);
            this.eventHandlers.push(() => {
                $element.off(event, selector, handler);
            });
        }

        /**
         * Initialize the form based on whether RSVP Plus is enabled
         */
        initializeForm() {
            if (!this.cachedElements.form.length) {
                console.warn('RSVP Form not found');
                return;
            }

            // Initialize title for step 0
            this.updateRsvpTitle(0);

            if (this.config.rsvpPlusEnabled) {
                this.setupRsvpPlusForm();
            } else {
                this.setupRegularForm();
            }
        }

        /**
         * Setup RSVP Plus form with multiple steps
         */
        setupRsvpPlusForm() {
            const formRsvp = this.cachedElements.form;
            const wrapper = $("<div>", { class: "rsvp-regular-wrapper" });
            const statusWrap = formRsvp.find(".rsvp-status-wrap");
            const amountWrap = formRsvp.find(".rsvp-amount-wrap");
            const plusContainers = formRsvp.find(".rsvp-plus-wrapper");
            const stepperNav = formRsvp.find(".rsvp-stepper-nav");

            this.currentStep = 0;
            this.totalSteps = plusContainers.length;

            // Update cached elements
            this.cachedElements.wrapper = wrapper;
            this.cachedElements.plusContainers = plusContainers;
            this.cachedElements.stepperNav = stepperNav;

            // Move status and amount sections to wrapper
            statusWrap.add(amountWrap).appendTo(wrapper);

            // Insert wrapper before first plus container
            if (plusContainers.length > 0) {
                plusContainers.first().before(wrapper);
            }
        }

        /**
         * Setup regular RSVP form
         */
        setupRegularForm() {
            const formRsvp = this.cachedElements.form;
            const wrapper = $("<div>", { class: "rsvp-regular-wrapper" });
            const statusWrap = formRsvp.find(".rsvp-status-wrap");
            const amountWrap = formRsvp.find(".rsvp-amount-wrap");

            // Update cached elements
            this.cachedElements.wrapper = wrapper;

            statusWrap.add(amountWrap).appendTo(wrapper);
            formRsvp.prepend(wrapper);
        }

        /**
         * Handle continue button click with proper validation
         */
        handleContinueClick() {

            try {
                const rsvpStatus = $("input[name=\"rsvp_status\"]:checked").val();

                if (!rsvpStatus || rsvpStatus.trim() === '') {
                    this.showError(this.config.language === 'EN' ? "Please select your RSVP status" : "Tolong pilih status kehadiran Anda");
                    return;
                }

                if (rsvpStatus === "not_going") {
                    // If not going, submit directly without going to plus steps
                    this.cachedElements.form.submit();
                    return;
                }

                // Go to first plus step
                if (typeof window.updateQuestionWrappers === "function") {
                    window.updateQuestionWrappers();
                }
                this.navigateToStep(1);
            } catch (error) {
                console.error('Error in handleContinueClick:', error);
                this.handleError(error);
            }
        }

        /**
         * Update continue button text based on RSVP status
         * @param {string} status - RSVP status value
         */
        updateContinueButtonText(status) {
            try {
                if (this.cachedElements.continueBtn && this.cachedElements.continueBtn.length > 0) {
                    const buttonText = status === "not_going" ? this.config.langSubmit : this.config.langContinue;
                    const buttonCls = status === "not_going" ? 'submit' : '';

                    this.cachedElements.continueBtn.text(buttonText);
                    this.cachedElements.continueBtn.addClass(buttonCls);

                    if (this.config.enableLogging) {
                        console.log(`Updated continue button text: ${buttonText}`);
                    }
                } else if (this.config.enableLogging) {
                    console.warn('Continue button element not found');
                }
            } catch (error) {
                console.error('Error updating continue button text:', error);
                this.handleError(error);
            }
        }

        /**
         * Update RSVP title and info based on current step
         * @param {number} stepNumber - Current step number
         */
        updateRsvpTitle(stepNumber) {
            if (!this.cachedElements?.rsvpTitle?.length) return;

            let newTitle = this.cachedElements.rsvpTitle.hasClass("rsvp-titles")
                ? (this.config.language === 'EN' ? "Reservation" : "Reservasi")
                : "RSVP";

            let infoText = "";
            let infoDate = "";

            if (stepNumber === 0) {
                // Save the original text only the first time
                if (this.originalInfoText === null) {
                    this.originalInfoText = this.cachedElements.rsvpInfoText && this.cachedElements.rsvpInfoText.length ?
                        this.cachedElements.rsvpInfoText.text() : "";
                    this.originalInfoDate = this.cachedElements.rsvpInfoDate && this.cachedElements.rsvpInfoDate.length ?
                        this.cachedElements.rsvpInfoDate.text() : "";
                }

                infoText = this.originalInfoText;
                infoDate = this.originalInfoDate;
            } else {
                // Default to originals when moving forward
                infoText = this.originalInfoText || "";
                infoDate = this.originalInfoDate || "";

                const currentContainer = $(".rsvp-plus-wrapper[data-step=\"" + stepNumber + "\"]");
                if (currentContainer.length > 0) {
                    const dataTitle = currentContainer.attr("data-title");
                    if (dataTitle && dataTitle.trim() !== "") {
                        newTitle = dataTitle;
                    }

                    const dataDescription = currentContainer.attr("data-description");
                    if (dataDescription && dataDescription.trim() !== "") {
                        infoText = dataDescription;
                        infoDate = "";
                    }
                }
            }

            // Update title
            this.cachedElements.rsvpTitle.text(newTitle);

            // Update info text if element exists
            if (this.cachedElements.rsvpInfoText && this.cachedElements.rsvpInfoText.length > 0) {
                this.cachedElements.rsvpInfoText.text(infoText);
            }

            // Update info date if element exists
            if (this.cachedElements.rsvpInfoDate && this.cachedElements.rsvpInfoDate.length > 0) {
                this.cachedElements.rsvpInfoDate.text(infoDate);
            }

            if (this.config.enableLogging) {
                console.log(`Updated RSVP title for step ${stepNumber}:`, { newTitle, infoText, infoDate });
            }
        }

        /**
         * Navigate between form steps with animation
         * @param {number} step - Target step number
         */
        navigateToStep(step) {
            try {
                const isMovingForward = step > this.currentStep;
                const isMovingBackward = step < this.currentStep;

                if (step < 0 || step > this.totalSteps) {
                    console.warn(`Invalid step number: ${step}`);
                    return;
                }

                // Hide current step with animation
                if (this.currentStep === 0) {
                    this.animateStepTransition(0, step, isMovingForward, isMovingBackward);
                } else {
                    this.animateStepTransition(step, step, isMovingForward, isMovingBackward);
                }

                const self = this;
                setTimeout(function () {
                    self.completeStepTransition(step);
                }, this.config.animationDuration);
            } catch (error) {
                console.error('Error in navigateToStep:', error);
                this.handleError(error);
            }
        }

        /**
         * Animate step transition
         * @param {number} currentStep - Current step
         * @param {number} targetStep - Target step
         * @param {boolean} isMovingForward - Moving forward flag
         * @param {boolean} isMovingBackward - Moving backward flag
         */
        animateStepTransition(currentStep, targetStep, isMovingForward, isMovingBackward) {
            if (currentStep === 0) {
                // Animate out initial form
                if (isMovingForward && this.cachedElements.wrapper) {
                    this.cachedElements.wrapper.addClass("slide-out-left");
                } else if (this.cachedElements.wrapper) {
                    this.cachedElements.wrapper.addClass("slide-out-right");
                }
                if (this.cachedElements.stepperNav) {
                    this.cachedElements.stepperNav.addClass("step-fade-out");
                }
            } else {
                // Animate out current plus step
                const currentContainer = this.cachedElements.plusContainers?.filter(`[data-step="${currentStep}"]`);
                if (currentContainer?.length) {
                    if (isMovingForward) {
                        currentContainer.addClass("slide-out-left");
                    } else {
                        currentContainer.addClass("slide-out-right");
                    }
                }
            }
        }

        /**
         * Complete step transition after animation
         * @param {number} step - Target step number
         */
        completeStepTransition(step) {
            const isMovingForward = step > this.currentStep;
            const isMovingBackward = step < this.currentStep;

            try {
                // Hide current elements
                if (this.currentStep === 0) {
                    if (this.cachedElements.wrapper) {
                        this.cachedElements.wrapper.hide();
                        this.cachedElements.wrapper.removeClass("slide-out-left slide-out-right");
                    }
                    if (this.cachedElements.stepperNav) {
                        this.cachedElements.stepperNav.hide();
                        this.cachedElements.stepperNav.removeClass("step-fade-out");
                    }
                } else {
                    const currentContainer = this.cachedElements.plusContainers?.filter(`[data-step="${this.currentStep}"]`);
                    if (currentContainer?.length) {
                        currentContainer.hide().removeClass("active slide-out-left slide-out-right");
                    }
                }

                // Show target step with animation
                if (step === 0) {
                    this.showInitialStep(isMovingBackward);
                } else {
                    this.showPlusStep(step, isMovingForward);
                }

                this.currentStep = step;

                // Update the title after step change
                this.updateRsvpTitle(step);
            } catch (error) {
                console.error('Error in completeStepTransition:', error);
                this.handleError(error);
            }
        }

        /**
         * Show initial form step
         * @param {boolean} isMovingBackward - Moving backward flag
         */
        showInitialStep(isMovingBackward) {
            if (this.cachedElements.wrapper) {
                if (isMovingBackward) {
                    this.cachedElements.wrapper.addClass("slide-in-right");
                }
                this.cachedElements.wrapper.show();

                // Remove animation classes after animation
                setTimeout(() => {
                    this.cachedElements.wrapper.removeClass("slide-in-right").addClass("active");
                }, 50);
            }

            if (this.cachedElements.stepperNav) {
                this.cachedElements.stepperNav.show().addClass("step-fade-in");

                // Remove animation classes after animation
                setTimeout(() => {
                    this.cachedElements.stepperNav.removeClass("step-fade-in");
                }, 50);
            }
        }

        /**
         * Show plus step
         * @param {number} step - Step number
         * @param {boolean} isMovingForward - Moving forward flag
         */
        showPlusStep(step, isMovingForward) {
            if (this.cachedElements.wrapper) {
                this.cachedElements.wrapper.hide();
            }

            const targetContainer = this.cachedElements.plusContainers?.filter(`[data-step="${step}"]`);
            if (targetContainer?.length) {
                // Set initial animation position
                if (isMovingForward) {
                    targetContainer.addClass("slide-in-right");
                } else {
                    targetContainer.addClass("slide-in-left");
                }

                targetContainer.show();

                // Trigger animation
                setTimeout(() => {
                    targetContainer.removeClass("slide-in-left slide-in-right").addClass("active");
                }, 50);
            }
        }


        /**
         * Show error message to user
         * @param {string} message - Error message
         */
        showError(message) {
            if (typeof showAlert === 'function') {
                showAlert(message, 'error');
            } else {
                alert(message);
            }
        }

        /**
         * Handle errors consistently
         * @param {Error} error - Error object
         */
        handleError(error) {
            console.error('RSVP Form Manager Error:', error);
            this.showError(this.config.language === 'EN' ? 'An error occurred. Please try again.' : 'Terjadi kesalahan. Silakan coba lagi.');
        }

        /**
         * Clean up event handlers and resources
         */
        destroy() {
            // Remove all event handlers
            this.eventHandlers.forEach(removeHandler => {
                try {
                    removeHandler();
                } catch (e) {
                    console.warn('Error removing event handler:', e);
                }
            });
            this.eventHandlers = [];

            // Clear cached elements
            this.cachedElements = {};

            this.initialized = false;
        }

    }

    // Create global instance
    window.RSVPFormManager = new RSVPFormManager();

    /**
     * Reactive Member Input System (Member Index-Based)
     * Manages member input data with reactive updates and localStorage persistence
     */
    class MemberInputSystem {
        constructor() {
            this.data = {};
            this.watchers = {};
            this.eventHandlers = [];
            this.initialized = false;

            // Bind methods to maintain context
            this.set = this.set.bind(this);
            this.get = this.get.bind(this);
            this.updateDependents = this.updateDependents.bind(this);
        }

        /**
         * Initialize the member input system
         */
        init() {
            if (this.initialized) {
                console.warn('Member Input System already initialized');
                return;
            }

            try {
                this.setupEventHandlers();
                this.restoreFromLocalStorage();
                this.initialized = true;

                // console.log('Member Input System initialized successfully');
            } catch (error) {
                console.error('Error initializing Member Input System:', error);
            }
        }

        /**
         * Setup event handlers for reactive updates
         */
        setupEventHandlers() {
            // Handle input changes on member input fields
            this.addEventHandler($(document), 'input', '.member-input', (e) => {
                const $element = $(e.target);
                const memberIndex = parseInt($element.data('member'));
                const stepSlug = $element.data('step');
                const newValue = $element.val();

                if (!isNaN(memberIndex)) {
                    this.set(memberIndex, newValue);

                    // Trigger custom event for other integrations
                    $element.trigger('memberInputChanged', {
                        memberIndex: memberIndex,
                        stepSlug: stepSlug,
                        value: newValue
                    });
                }
            });

            // Handle updateQuestionWrappers trigger
            this.addEventHandler($(document), 'updateQuestionWrappers', () => {
                setTimeout(() => {
                    this.initializeDependents();
                }, 100);
            });
        }

        /**
         * Add event handler with cleanup tracking
         */
        addEventHandler($element, event, selector, handler) {
            $element.on(event, selector, handler);
            this.eventHandlers.push(() => {
                $element.off(event, selector, handler);
            });
        }

        /**
         * Set member input value and trigger updates globally
         * @param {number} memberIndex - Member index (0-based)
         * @param {string} value - New value
         * @returns {string} Old value
         */
        set(memberIndex, value) {
            try {
                if (typeof memberIndex !== 'number' || memberIndex < 0) {
                    throw new Error('Invalid member index');
                }

                const oldValue = this.data[memberIndex];
                this.data[memberIndex] = value || '';

                // Trigger reactive updates for ALL steps with this member index
                this.updateDependents(memberIndex, this.data[memberIndex]);

                // Save to localStorage for guest members (index > 0)
                if (memberIndex > 0) {
                    this.saveToLocalStorage(memberIndex, this.data[memberIndex]);
                }

                // Trigger watchers
                this.triggerWatchers(memberIndex, this.data[memberIndex]);

                return oldValue;
            } catch (error) {
                console.error('Error setting member input:', error);
                return null;
            }
        }

        /**
         * Get member input value
         * @param {number} memberIndex - Member index
         * @returns {string} Member value or empty string
         */
        get(memberIndex) {
            if (typeof memberIndex !== 'number' || memberIndex < 0) {
                console.warn('Invalid member index:', memberIndex);
                return '';
            }
            return this.data[memberIndex] || '';
        }

        /**
         * Update dependent DOM elements across ALL steps
         * @param {number} memberIndex - Member index
         * @param {string} value - New value
         */
        updateDependents(memberIndex, value) {
            try {
                $(`[data-member="${memberIndex}"]`).each((index, element) => {
                    const $element = $(element);
                    if ($element.val() !== value) {
                        $element.val(value);
                    }
                });
            } catch (error) {
                console.error('Error updating dependents:', error);
            }
        }

        /**
         * Save value to localStorage
         * @param {number} memberIndex - Member index
         * @param {string} value - Value to save
         */
        saveToLocalStorage(memberIndex, value) {
            try {
                localStorage.setItem(`member_${memberIndex}`, value);
            } catch (error) {
                console.warn('Error saving to localStorage:', error);
            }
        }

        /**
         * Restore values from localStorage
         */
        restoreFromLocalStorage() {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('member_')) {
                        const memberIndex = parseInt(key.replace('member_', ''));
                        if (!isNaN(memberIndex) && memberIndex > 0) {
                            const value = localStorage.getItem(key);
                            if (value) {
                                this.data[memberIndex] = value;
                            }
                        }
                    }
                });
            } catch (error) {
                console.warn('Error restoring from localStorage:', error);
            }
        }

        /**
         * Clear all data for a specific member index
         * @param {number} memberIndex - Member index to clear
         */
        clearMember(memberIndex) {
            try {
                if (typeof memberIndex !== 'number' || memberIndex < 0) {
                    throw new Error('Invalid member index');
                }

                delete this.data[memberIndex];

                // Also clear from localStorage
                if (memberIndex > 0) {
                    localStorage.removeItem(`member_${memberIndex}`);
                }
            } catch (error) {
                console.error('Error clearing member:', error);
            }
        }

        /**
         * Clear all member data
         */
        clearAll() {
            try {
                this.data = {};

                // Also clear all localStorage member data
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('member_')) {
                        localStorage.removeItem(key);
                    }
                });

                // Clear watchers
                this.watchers = {};
            } catch (error) {
                console.error('Error clearing all data:', error);
            }
        }

        /**
         * Get all member data
         * @returns {Object} Copy of all member data
         */
        getAll() {
            return { ...this.data };
        }

        /**
         * Initialize dependent elements
         */
        initializeDependents() {
            try {
                $('[data-depends-on-member]').each((index, element) => {
                    const $element = $(element);
                    const memberIndex = parseInt($element.data('depends-on-member'));

                    if (!isNaN(memberIndex) && memberIndex >= 0) {
                        const currentValue = this.get(memberIndex);
                        if (currentValue) {
                            this.updateDependents(memberIndex, currentValue);
                        }
                    }
                });
            } catch (error) {
                console.error('Error initializing dependents:', error);
            }
        }

        /**
         * Watch for changes to a specific member index
         * @param {number} memberIndex - Member index to watch
         * @param {Function} callback - Callback function
         */
        watchMember(memberIndex, callback) {
            try {
                if (typeof memberIndex !== 'number' || memberIndex < 0) {
                    throw new Error('Invalid member index');
                }

                if (typeof callback !== 'function') {
                    throw new Error('Callback must be a function');
                }

                if (!this.watchers[memberIndex]) {
                    this.watchers[memberIndex] = [];
                }

                this.watchers[memberIndex].push(callback);
            } catch (error) {
                console.error('Error adding watcher:', error);
            }
        }

        /**
         * Trigger watchers for a member index
         * @param {number} memberIndex - Member index
         * @param {string} value - New value
         */
        triggerWatchers(memberIndex, value) {
            try {
                if (this.watchers[memberIndex]) {
                    this.watchers[memberIndex].forEach(callback => {
                        try {
                            callback(value);
                        } catch (error) {
                            console.error('Error in member watcher:', error);
                        }
                    });
                }
            } catch (error) {
                console.error('Error triggering watchers:', error);
            }
        }

        /**
         * Clean up resources and event handlers
         */
        destroy() {
            // Remove all event handlers
            this.eventHandlers.forEach(removeHandler => {
                try {
                    removeHandler();
                } catch (e) {
                    console.warn('Error removing event handler:', e);
                }
            });
            this.eventHandlers = [];

            // Clear data
            this.clearAll();
        }
    }

    // Create global instances
    window.MemberInputs = new MemberInputSystem();

    /**
     * Global cleanup function to destroy all instances and remove event handlers
     * Call this when the page is being unloaded or when components need to be reset
     */
    window.cleanupWeddingTemplate = function () {
        try {
            if (window.RSVPFormManager && window.RSVPFormManager.initialized) {
                window.RSVPFormManager.destroy();
                // Only try to update title if RSVPFormManager is properly initialized
                if (window.RSVPFormManager.cachedElements &&
                    window.RSVPFormManager.cachedElements.rsvpTitle &&
                    window.RSVPFormManager.cachedElements.rsvpTitle.length > 0) {
                    window.RSVPFormManager.updateRsvpTitle(0);
                }
            }

            if (window.MemberInputs && window.MemberInputs.initialized) {
                window.MemberInputs.destroy();
                // Only try to update title if RSVPFormManager is properly initialized
                if (window.RSVPFormManager && window.RSVPFormManager.cachedElements &&
                    window.RSVPFormManager.cachedElements.rsvpTitle &&
                    window.RSVPFormManager.cachedElements.rsvpTitle.length > 0) {
                    window.RSVPFormManager.updateRsvpTitle(0);
                }
            }

            // Clear global references
            window.rsvpSteps = null;

        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    };

    /**
     * Initialize all systems with proper error handling
     */
    window.initWeddingTemplate = function () {
        try {
            // Initialize RSVP Form Manager if elements exist
            if ($("#RSVPForm").length > 0) {
                window.RSVPFormManager.init();
            }

            // Initialize Member Input System
            if (window.MemberInputs && !window.MemberInputs.initialized) {
                window.MemberInputs.init();
            }

        } catch (error) {
            console.error('Error initializing wedding template:', error);
        }
    };

    // Auto-initialize when DOM is ready (only if not already initialized)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initWeddingTemplate);
    } else {
        // DOM is already ready, initialize immediately
        setTimeout(window.initWeddingTemplate, 0);
    }

    // Cleanup on page unload
    $(window).on('beforeunload', function () {
        window.cleanupWeddingTemplate();
    });

    /**
     * Global function to update question wrappers (called from PHP) - Member Index-Based
     * Enhanced with better error handling and performance optimizations
     */
    window.updateQuestionWrappers = function () {
        try {
            const rsvpAmount = parseInt($("input[name=\"rsvp_amount\"]").val())
                || parseInt($("input[name=\"guest_amount\"]").val())
                || 1;

            // Validate rsvpAmount
            if (rsvpAmount < 1 || rsvpAmount > 50) {
                console.warn('Invalid RSVP amount, using default of 1');
                rsvpAmount = 1;
            }

            $(".rsvpPlus-body").each(function (stepIndex) {
                const $body = $(this);
                const stepData = window.rsvpSteps && window.rsvpSteps[stepIndex];
                const guestName = $body.data('guest') !== '' ? $body.data('guest') : $("input.group-guest").val();

                if (!stepData) {
                    console.warn(`No step data found for step index: ${stepIndex}`);
                    return;
                }

                $body.empty();

                for (let memberIndex = 0; memberIndex < rsvpAmount; memberIndex++) {
                    const $container = $("<div class=\"rsvpPlus-questionWrapper-container\"></div>");

                    // Get existing value for this member index (global across steps)
                    const existingValue = window.MemberInputs.get(memberIndex);
                    const defaultValue = (memberIndex === 0) ? guestName : existingValue;
                    const defaultLabel = (memberIndex === 0) ? (window.RSVPFormManager.config.language === 'EN' ? 'Guest Name' : 'Nama Tamu') : (window.RSVPFormManager.config.language === 'EN' ? `Partner Name ${memberIndex}` : `Nama Tamu Pendamping ${memberIndex}`);

                    // Build questions HTML
                    if (stepData.questions && Array.isArray(stepData.questions) && stepData.questions.length > 0) {
                        // Add member name input
                        $container.append(`
                            <div class="form-group">
                                <label class="form-label">${defaultLabel}</label>
                                <input type="text" class="form-control member-input"
                                    name="${stepData.slug}_members[${memberIndex}]"
                                    placeholder="${(window.RSVPFormManager.config.language === 'EN' ? 'Enter name here' : 'Masukkan nama di sini')}" value="${defaultValue || ''}" data-member="${memberIndex}" data-step="${stepData.slug}">
                            </div>
                        `);

                        // Add questions
                        stepData.questions.forEach((question, questionIndex) => {
                            if (question.question_type === "options" && Array.isArray(question.options)) {
                                const $field = $(`
                                    <div class="form-group">
                                        <label class="form-label">${question.question_text || ""}</label>
                                    </div>
                                `);

                                question.options.forEach(option => {
                                    if (option && option.option_text) {
                                        $field.append(`
                                            <div class="form-check">
                                                <label class="form-check-label">
                                                    ${option.option_text}
                                                    <input type="radio" class="form-check-input"
                                                    name="${stepData.slug}_questions[${memberIndex}][${question.id}]"
                                                    value="${option.id}" ${option.checked ? 'checked' : ''}>

                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" style="fill: var(--button-text-secondary)">
                                                        <path d="M17.9422 6.06705L7.94217 16.067C7.88412 16.1252 7.81519 16.1713 7.73932 16.2027C7.66344 16.2342 7.58212 16.2504 7.49998 16.2504C7.41785 16.2504 7.33652 16.2342 7.26064 16.2027C7.18477 16.1713 7.11584 16.1252 7.05779 16.067L2.68279 11.692C2.56552 11.5748 2.49963 11.4157 2.49963 11.2499C2.49963 11.084 2.56552 10.9249 2.68279 10.8077C2.80007 10.6904 2.95913 10.6245 3.12498 10.6245C3.29083 10.6245 3.44989 10.6904 3.56717 10.8077L7.49998 14.7413L17.0578 5.18267C17.1751 5.0654 17.3341 4.99951 17.5 4.99951C17.6658 4.99951 17.8249 5.0654 17.9422 5.18267C18.0594 5.29995 18.1253 5.45901 18.1253 5.62486C18.1253 5.79071 18.0594 5.94977 17.9422 6.06705Z" fill="#FDF6E4"></path>
                                                    </svg>
                                                </label>
                                            </div>
                                        `);
                                    }
                                });
                                $container.append($field);
                            } else {
                                $container.append(`
                                    <div class="form-group">
                                        <label class="form-label">${question.question_text || ""}</label>
                                        <input type="text" class="form-control"
                                            name="${stepData.slug}_questions[${memberIndex}][${question.id}]"
                                            placeholder="${(window.RSVPFormManager.config.language === 'EN' ? 'Enter answer here' : 'Masukkan jawaban di sini')}">
                                    </div>
                                `);
                            }
                        });
                    }

                    $body.append($container);
                }
            });

            // Initialize reactive system if not already done
            if (!window.MemberInputs.initialized) {
                window.MemberInputs.init();
            }

            // Restore localStorage values and trigger reactive updates
            $(".member-input").each(function () {
                const $input = $(this);
                const memberIndex = parseInt($input.data("member"));

                if (!isNaN(memberIndex) && memberIndex > 0) {
                    const savedValue = localStorage.getItem(`member_${memberIndex}`);
                    if (savedValue && !$input.val()) {
                        $input.val(savedValue);
                        // Trigger reactive update globally
                        window.MemberInputs.set(memberIndex, savedValue);
                    }
                }
            });

            // Initialize any existing dependent elements (global by member index)
            $('[data-depends-on-member]').each(function () {
                const $element = $(this);
                const memberIndex = parseInt($element.data('depends-on-member'));

                if (!isNaN(memberIndex) && memberIndex >= 0) {
                    // Set initial value if available (global)
                    const currentValue = window.MemberInputs.get(memberIndex);
                    if (currentValue) {
                        window.MemberInputs.updateDependents(memberIndex, currentValue);
                    }
                }
            });

        } catch (error) {
            console.error('Error in updateQuestionWrappers:', error);
        }
    };

    /**
     * Utility functions for reactive member inputs (Member Index-Based)
     * Provides convenient methods for working with the member input system
     */
    class MemberInputUtils {
        constructor() {
            this.watchers = {};
        }

        /**
         * Get member input value (global by member index)
         * @param {number} memberIndex - Member index
         * @returns {string} Member value
         */
        getValue(memberIndex) {
            return window.MemberInputs.get(memberIndex);
        }

        /**
         * Set member input value and trigger updates (global by member index)
         * @param {number} memberIndex - Member index
         * @param {string} value - New value
         * @returns {string|null} Old value or null on error
         */
        setValue(memberIndex, value) {
            return window.MemberInputs.set(memberIndex, value);
        }

        /**
         * Create a dependent element that updates when member input changes
         * @param {Object} options - Configuration options
         * @param {string} options.selector - jQuery selector for the element
         * @param {number} options.memberIndex - Member index to depend on
         * @param {string} options.updateType - Type of update ('text', 'value', 'html')
         * @param {string} options.defaultText - Default text when no value
         * @param {Function} options.formatter - Function to format the value
         */
        createDependent(options) {
            try {
                const $element = $(options.selector);

                if (!$element.length) {
                    console.warn(`Element not found: ${options.selector}`);
                    return;
                }

                // Validate options
                if (typeof options.memberIndex !== 'number' || options.memberIndex < 0) {
                    throw new Error('Invalid member index');
                }

                // Set data attributes
                $element.attr('data-depends-on-member', options.memberIndex);
                $element.attr('data-update-type', options.updateType || 'text');
                $element.attr('data-default-text', options.defaultText || '');

                // Set initial value if available (global)
                const currentValue = window.MemberInputs.get(options.memberIndex);
                if (currentValue) {
                    this.updateElementValue($element, currentValue, options);
                }

                // Set up watcher for future updates
                window.MemberInputs.watchMember(options.memberIndex, (value) => {
                    this.updateElementValue($element, value, options);
                });

            } catch (error) {
                console.error('Error creating dependent element:', error);
            }
        }

        /**
         * Update element value based on options
         * @param {jQuery} $element - Element to update
         * @param {string} value - New value
         * @param {Object} options - Configuration options
         */
        updateElementValue($element, value, options) {
            try {
                const updateType = $element.attr('data-update-type') || 'text';
                const defaultText = $element.attr('data-default-text') || '';

                let displayValue = value || defaultText;

                // Apply formatter if provided
                if (options.formatter && typeof options.formatter === 'function') {
                    displayValue = options.formatter(displayValue);
                }

                // Update element based on type
                switch (updateType) {
                    case 'value':
                        $element.val(displayValue);
                        break;
                    case 'html':
                        $element.html(displayValue);
                        break;
                    case 'text':
                    default:
                        $element.text(displayValue);
                        break;
                }
            } catch (error) {
                console.error('Error updating element value:', error);
            }
        }

        /**
         * Update multiple dependents at once
         * @param {Array} updates - Array of update objects
         */
        updateMultiple(updates) {
            try {
                if (!Array.isArray(updates)) {
                    throw new Error('Updates must be an array');
                }

                updates.forEach(update => {
                    if (typeof update.memberIndex === 'number' && update.value !== undefined) {
                        window.MemberInputs.set(update.memberIndex, update.value);
                    }
                });
            } catch (error) {
                console.error('Error updating multiple dependents:', error);
            }
        }

        /**
         * Watch for changes to a specific member index
         * @param {number} memberIndex - Member index to watch
         * @param {Function} callback - Callback function
         */
        watchMember(memberIndex, callback) {
            try {
                window.MemberInputs.watchMember(memberIndex, callback);
            } catch (error) {
                console.error('Error adding watcher:', error);
            }
        }

        /**
         * Create a batch update helper
         * @param {Array} memberIndexes - Array of member indexes to update
         * @param {string} value - Value to set for all members
         */
        batchUpdate(memberIndexes, value) {
            try {
                if (!Array.isArray(memberIndexes)) {
                    throw new Error('Member indexes must be an array');
                }

                const updates = memberIndexes.map(memberIndex => ({
                    memberIndex,
                    value
                }));

                this.updateMultiple(updates);
            } catch (error) {
                console.error('Error in batch update:', error);
            }
        }

        /**
         * Get all member values as an array
         * @returns {Array} Array of member values
         */
        getAllValues() {
            try {
                const allData = window.MemberInputs.getAll();
                return Object.values(allData);
            } catch (error) {
                console.error('Error getting all values:', error);
                return [];
            }
        }

        /**
         * Validate member index
         * @param {number} memberIndex - Member index to validate
         * @returns {boolean} True if valid
         */
        isValidMemberIndex(memberIndex) {
            return typeof memberIndex === 'number' && memberIndex >= 0 && !isNaN(memberIndex);
        }
    }

    // Create global instance
    window.MemberInputUtils = new MemberInputUtils();

    /**
     * Initialize reactive system when DOM is ready
     * Enhanced with proper error handling and performance optimizations
     */
    $(document).ready(function () {
        try {
            // Initialize RSVP Form Manager if elements exist
            if ($("#RSVPForm").length > 0) {
                window.RSVPFormManager.init();
            }

            // Initialize Member Input System
            if (window.MemberInputs && !window.MemberInputs.initialized) {
                window.MemberInputs.init();
            }

            // Handle updateQuestionWrappers trigger with debouncing
            let updateQuestionWrappersTimeout;
            $(document).on('updateQuestionWrappers', function () {
                clearTimeout(updateQuestionWrappersTimeout);
                updateQuestionWrappersTimeout = setTimeout(function () {
                    try {
                        $('[data-depends-on-member]').each(function () {
                            const $element = $(this);
                            const memberIndex = parseInt($element.data('depends-on-member'));

                            if (!isNaN(memberIndex) && memberIndex >= 0) {
                                const currentValue = window.MemberInputs.get(memberIndex);
                                if (currentValue) {
                                    window.MemberInputs.updateDependents(memberIndex, currentValue);
                                }
                            }
                        });
                    } catch (error) {
                        console.error('Error in updateQuestionWrappers handler:', error);
                    }
                }, 100);
            });

            $(document).on("change", "input[name='selected_event[]']", function () {
                const total = $("input[name='selected_event[]']").length;
                const checked = $("input[name='selected_event[]']:checked").length;

                $("#check-all").prop("checked", total > 0 && total === checked);
            });

        } catch (error) {
            console.error('Error initializing reactive system:', error);
        }
    });

})();

/**
 * ===================
 *  FALL EFFECT
 * ===================
 */
$(async function () {
    setTimeout(() => {
        particles = tsParticles.domItem(0);
    }, 0);

    // --- DATA PENGATURAN DARI DATABASE ANDA ---
    // Data ini di-generate oleh backend Anda saat halaman dimuat
    const invitationEffectSettings = {
        using_particle_effect: window.USING_EFFECT || 0,      // 1 atau 0
        particle_effect_id: window.EFFECT,         // ID efek (1: mawar, 2: sakura, 3: sparkle, 4: cream petals, 5: snow, 6: white petals)
        particle_effect_volume: window.EFFECT_VOLUME, // Enum volume
        particle_effect_speed: window.EFFECT_SPEED // Enum kecepatan
    };

    // --- LOGIKA UNTUK MENAMPILKAN EFEK ---

    // Periksa jika efek diaktifkan
    if (!invitationEffectSettings || invitationEffectSettings.using_particle_effect !== 1) {
        console.log('Efek partikel tidak aktif untuk undangan ini.');
        return; // Hentikan eksekusi jika efek mati
    }

    // Mapping
    const effect_asset_path = './assets/ornaments';
    const effectMapping = {
        1: {
            preset: "object",
            image: [
                {
                    src: `${effect_asset_path}/rose/orn-1.png`,
                },
                {
                    src: `${effect_asset_path}/rose/orn-2.png`,
                },
                {
                    src: `${effect_asset_path}/rose/orn-3.png`,
                },
                {
                    src: `${effect_asset_path}/rose/orn-4.png`,
                },
            ]
        },
        2: {
            preset: "object",
            image: [
                {
                    src: `${effect_asset_path}/sakura/orn-1.png`,
                },
                {
                    src: `${effect_asset_path}/sakura/orn-2.png`,
                },
                {
                    src: `${effect_asset_path}/sakura/orn-3.png`,
                },
                {
                    src: `${effect_asset_path}/sakura/orn-4.png`,
                },
            ]
        },
        3: {
            preset: "stars",
            image: [
                {
                    src: `${effect_asset_path}/sparkle/orn-1.png`,
                },
                {
                    src: `${effect_asset_path}/sparkle/orn-2.png`,
                },
                {
                    src: `${effect_asset_path}/sparkle/orn-3.png`,
                },
                {
                    src: `${effect_asset_path}/sparkle/orn-4.png`,
                },
            ]
        },
        4: {
            preset: "object",
            image: [
                {
                    src: `${effect_asset_path}/cream-petals/orn-1.png`,
                },
                {
                    src: `${effect_asset_path}/cream-petals/orn-2.png`,
                },
            ]
        },
        5: {
            preset: "snow",
            image: [
                {
                    src: `${effect_asset_path}/snow/orn-1.png`,
                },
                {
                    src: `${effect_asset_path}/snow/orn-2.png`,
                },
            ]
        },
        6: {
            preset: "object",
            image: [
                {
                    src: `${effect_asset_path}/white-petals/orn-1.png`,
                },
            ]
        },
    };
    const volumeMapping = { 'VERY_LOW': 50, 'LOW': 75, 'MEDIUM': 100, 'HIGH': 125, 'VERY_HIGH': 150 };
    let speedMapping = { 'NORMAL': 1, 'FAST': 2 };


    // Ambil konfigurasi atau gunakan default jika data null/tidak valid
    const selectedEffect = effectMapping[invitationEffectSettings.particle_effect_id] || effectMapping[1];
    const selectedVolume = volumeMapping[invitationEffectSettings.particle_effect_volume] || 50;
    if (selectedEffect.preset == 'object') {
        speedMapping = { 'NORMAL': { min: 0.5, max: 1.5 }, 'FAST': { min: 4, max: 6 } };
    } else if (selectedEffect.preset == 'stars') {
        speedMapping = { 'NORMAL': 0.5, 'FAST': 1 };
    }
    const selectedSpeed = speedMapping[invitationEffectSettings.particle_effect_speed] || { min: 1, max: 2 };

    // Muat tsParticles
    await loadFull(tsParticles);

    const baseParticleConfig = {
        number: {
            density: { enable: true, area: 800 },
            value: selectedVolume
        },
        shape: {
            type: "image",
            options: {
                image: selectedEffect.image,
            }
        },
        size: {
            value: { min: 5, max: 10 }
            // value: 12.5
        },
    };

    const starsParticle = {
        ...baseParticleConfig,
        move: {
            direction: "none",
            enable: true,
            outModes: {
                default: OutMode.out,
            },
            random: true,
            speed: selectedSpeed,
            straight: false,
        },
        opacity: {
            animation: {
                enable: true,
                speed: 3,
                sync: false,
            },
            value: { min: 0, max: 1 },
        },
        size: {
            value: {
                min: 5,
                max: 10
            }
        },
    }

    const snowParticle = {
        ...baseParticleConfig,
        move: {
            direction: "bottom",
            enable: true,
            random: false,
            straight: false,
            speed: selectedSpeed
        },
    }

    const objParticle = {
        ...baseParticleConfig,
        move: {
            direction: "bottom",
            enable: true,
            outModes: {
                default: "out"
            },
            size: true,
            // straight: false membuat gerakan tidak terlalu lurus kaku
            straight: false,
            speed: selectedSpeed,
        },
        opacity: {
            value: 0.9,
            // animation: {
            //     enable: false,
            //     startValue: "max",
            //     destroy: "min",
            //     speed: 0.3,
            //     sync: true
            // }
        },
        rotate: {
            value: {
                min: 0,
                max: 360
            },
            direction: "random",
            move: true,
            animation: {
                enable: true,
                speed: 10,
                sync: false
            }
        },
        tilt: {
            direction: "random",
            enable: true,
            move: true,
            value: {
                min: 0,
                max: 270
            },
            animation: {
                enable: true,
                speed: 10,
                sync: false
            }
        },
        roll: {
            darken: {
                enable: true,
                value: 25
            },
            enlighten: {
                enable: true,
                value: 25
            },
            enable: true,
            speed: {
                min: 5,
                max: 15
            }
        },
        wobble: {
            distance: 20,
            enable: true,
            move: true,
            speed: {
                min: 5,
                max: 10
            }
        },
    }

    // Buat objek mapping untuk konfigurasi partikel
    const particleConfigMapping = {
        'stars': starsParticle,
        'snow': snowParticle,
        'object': objParticle, // object adalah preset untuk mawar, sakura, cream petals, dan white petals
    };

    // Ambil konfigurasi, dengan fallback ke objParticle jika preset tidak terdefinisi
    const particleConfig = particleConfigMapping[selectedEffect.preset] || objParticle;

    await tsParticles.load({
        id: "kat__effect",
        options: {
            detectRetina: false,
            particles: particleConfig,
            // smooth: true,
            responsive: [
                {
                    minWidth: 961,
                    options: {
                        fullScreen: {
                            enable: false
                        },
                        width: "61%"
                    }
                }
            ]
        }
    })
});

// E Invitation Handler 
var e_invitation_handler = function (pages) {
    return new Promise(async (resolve, reject) => {
        // Performance monitoring
        const startTime = performance.now();

        // pages could not found
        if (!pages || pages.length === 0) {
            return resolve({ captured: 0, failed: 0, attempt: 0, total: 0, processingTime: 0 });
        }

        const pageTotal = pages.length;
        const concurrencyLimit = 5; // Process 5 pages simultaneously
        const batchSize = Math.min(25, Math.ceil(pageTotal / 4)); // Dynamic batch sizing
        const delay = 100; // Reduced delay for better performance

        //  iframe cleanup
        const cleanupIframes = () => {
            const iframes = document.querySelectorAll('iframe[data-temp-iframe="true"]');
            iframes.forEach(iframe => {
                if (iframe && iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            });
        };

        // Timer utility
        const timer = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Enhanced capture function with better error handling
        const capturePage = async (page) => {
            let iframe = null;
            try {
                const captureResult = await captureEInvitation(page);
                if (captureResult.success) {
                    const uploadResult = await uploadEInvitation(captureResult.data);
                    if (uploadResult.success) {
                    }
                }
            } catch (error) {
                console.warn(`Failed to process page ${page.id}:`, error);
            } finally {
                // Ensure iframe cleanup
                if (iframe && iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            }
        };

        // Parallel processing with concurrency control
        const processPagesInBatches = async () => {
            const batches = [];
            for (let i = 0; i < pages.length; i += batchSize) {
                batches.push(pages.slice(i, i + batchSize));
            }

            for (const batch of batches) {
                // Process batch with concurrency limit
                const promises = batch.map(page => capturePage(page));
                await Promise.allSettled(promises.slice(0, concurrencyLimit));

                // Remaining promises in batch
                for (let i = concurrencyLimit; i < promises.length; i++) {
                    await promises[i];
                }

                // Cleanup after each batch
                cleanupIframes();

                // Brief pause between batches to prevent overwhelming the system
                if (batches.length > 1) {
                    await timer(delay);
                }
            }
        };

        try {

            // Start processing
            await processPagesInBatches();

            // Final cleanup
            cleanupIframes();

            // Calculate processing time
            const endTime = performance.now();
            const processingTime = Math.round(endTime - startTime);

            // Resolve with comprehensive results
            resolve({
                captured: 0,
                uploaded: 0,
                failed: 0,
                attempt: pageTotal,
                total: pageTotal,
                processingTime
            });

        } catch (error) {
            console.error('Error in e_invitation_handler:', error);
            cleanupIframes();
            reject(error);
        }
    });
};

// Capture E Invitation
var captureEInvitation = function (page) {
    return new Promise((resolve, reject) => {
        const { url = '', params = '', element = '', id = 0 } = page;

        // Input validation
        if (!url || !element) {
            return reject(new Error('URL and element are required'));
        }

        // Create iframe with cleanup tracking
        const iframe = document.createElement('iframe');
        iframe.src = url + (params ? '?' + params : '');
        iframe.setAttribute('data-temp-iframe', 'true');
        iframe.style.cssText = 'position: absolute; opacity: 0; z-index: -9999; visibility: hidden; pointer-events: none;';

        // Timeout for iframe loading
        const loadTimeout = setTimeout(() => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
            reject(new Error('Iframe load timeout'));
        }, 15000); // 15 second timeout

        iframe.onload = function () {
            clearTimeout(loadTimeout);

            try {
                const innerDoc = iframe.contentDocument || iframe.contentWindow.document;

                if (!innerDoc.getElementById(element)) {
                    cleanup();
                    return reject(new Error('Target element not found'));
                }

                //  html2canvas configuration
                const options = {
                    scrollX: 0,
                    scrollY: 0,
                    allowTaint: true,
                    useCORS: true,
                    scale: 1.5,
                    letterRendering: true,
                    logging: false, // Disable logging for performance
                    proxy: "",
                    // Performance optimizations
                    width: innerDoc.getElementById(element).scrollWidth,
                    height: innerDoc.getElementById(element).scrollHeight,
                    backgroundColor: '#ffffff',
                    removeContainer: true,
                    foreignObjectRendering: false,
                    // Reduce quality for faster processing
                    quality: 0.8
                };

                html2canvas(innerDoc.getElementById(element), options)
                    .then(function (canvas) {
                        cleanup();
                        resolve({
                            success: true,
                            data: {
                                img: canvas.toDataURL("image/jpeg", 0.8),
                                id: id
                            }
                        });
                    })
                    .catch(error => {
                        cleanup();
                        reject(new Error(`Canvas generation failed: ${error.message}`));
                    });

            } catch (error) {
                cleanup();
                reject(new Error(`Iframe processing error: ${error.message}`));
            }
        };

        iframe.onerror = function () {
            clearTimeout(loadTimeout);
            cleanup();
            reject(new Error('Iframe load failed'));
        };

        const cleanup = () => {
            if (iframe && iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        };

        document.body.appendChild(iframe);
    });
};

// Upload E Invitation
var uploadEInvitation = function (captureData) {
    return new Promise((resolve, reject) => {
        const { img, id } = captureData;

        // Input validation
        if (!img || !id) {
            return reject(new Error('Image data and ID are required'));
        }

        // Validate image data format
        if (!img.startsWith('data:image/jpeg')) {
            return reject(new Error('Invalid image format'));
        }

        // Check image size (prevent memory issues)
        const imgSize = Math.round(img.length * 0.75); // Base64 size estimate
        if (imgSize > 10 * 1024 * 1024) { // 10MB limit
            return reject(new Error('Image too large (>10MB)'));
        }

        // Prepare form data
        const data = new FormData();
        data.append('post', 'postCapturedPage');
        data.append('imgSource', img);
        data.append('id', id);

        // Upload timeout
        const uploadTimeout = setTimeout(() => {
            reject(new Error('Upload timeout'));
        }, 30000); // 30 second timeout

        // Success handler
        const onSuccess = function (res) {
            clearTimeout(uploadTimeout);
            resolve({ success: true, data: { img, id } });
        };

        // Error handler with retry logic
        const onError = function (res = null) {
            clearTimeout(uploadTimeout);
            const errorMessage = res && res.message ? res.message : 'Upload failed';
            reject(new Error(errorMessage));
        };

        // Before send (no-op for now, but kept for compatibility)
        const beforeSend = function () {
            // Could add loading indicators here if needed
        };

        try {
            // Use the existing postData function
            postData(data, onSuccess, onError, beforeSend);
        } catch (error) {
            clearTimeout(uploadTimeout);
            reject(new Error(`Upload preparation failed: ${error.message}`));
        }
    });
};

// ---------- Helper Functions for Cookies --------------------------------------------------
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

// ---------- Render Language Toggle (Function) --------------------------------------------------
function renderLanguageToggle() {
    // HTML string for the toggle
    const toggleHTML = `
        <div id="language-toggle">
            <select id="language-select">
                <option value="ID">ID</option>
                <option value="EN">EN</option>
            </select>
        </div>
    `;

    // Append HTML to body
    document.body.insertAdjacentHTML('beforeend', toggleHTML);

    // Get the select element
    const select = document.querySelector('#language-select');
    const defaultLang = window.DEFAULT_LANG ?? 'ID'

    // Get current language from cookie, default to 'ID'
    const currentLang = getCookie('template_lang') || defaultLang;

    // Define selectize options
    const languageOptions = {
        maxItems: 1,
        valueField: 'id',
        labelField: 'title',
        searchField: ['title'],
        options: [
            { id: 'ID', title: 'ID', flag: '' },
            { id: 'EN', title: 'EN', flag: '' }
        ],
        create: false,
        className: 'language-selectize',
        render: {
            item: function (item, escape) {
                return '<div class="option-item"><div class="image-wrapper"><img src="' + escape(item.flag) + '"></div><i class="ph ph-check"></i></div>';
            },
            option: function (item, escape) {
                return '<div class="option-item"><div class="image-wrapper"><img src="' + escape(item.flag) + '"></div><i class="ph ph-check"></i></div>';
            }
        },
        onInitialize: function () {
            this.setValue(currentLang, true); // Set initial value silently
            window.languageSelectize = this; // Store selectize instance for scroll handling
        },
        onChange: function (value) {
            setCookie('template_lang', value, 365);
            window.location.reload();
        }
    };

    // Initialize selectize
    $(select).selectize(languageOptions);

    // Add slide functionality similar to music box
    let prevScrollpos = window.pageYOffset;
    let isToggleHidden = false;
    let toggleTimeout;

    const showLanguageToggle = function () {
        $('#language-toggle').removeClass('slide-out').addClass('slide-in');
        isToggleHidden = false;
        clearTimeout(toggleTimeout);
    };

    const hideLanguageToggle = function () {
        $('#language-toggle').removeClass('slide-in').addClass('slide-out');
        isToggleHidden = true;
        clearTimeout(toggleTimeout);
        toggleTimeout = setTimeout(showLanguageToggle, 5000);
    };

    $(window).on('scroll', function () {
        // Close selectize dropdown on scroll
        if (window.languageSelectize && window.languageSelectize.isOpen) {
            window.languageSelectize.close();
        }

        const currentScrollPos = window.pageYOffset;
        if (prevScrollpos > currentScrollPos) {
            if (isToggleHidden) showLanguageToggle();
        } else {
            if (!isToggleHidden) hideLanguageToggle();
        }
        prevScrollpos = currentScrollPos;
    });
}

function cleanUrl(url) {
  if (!url) return '';

  return url
    // hapus zero-width & invisible characters
    .replace(/[\u200B-\u200D\uFEFF\u2060]/g, '')
    // hapus karakter aneh di awal (selain huruf/angka/http)
    .replace(/^[^\w]+/, '')
    // trim spasi
    .trim();
}

// Call the function to render the toggle
if (window.LANGUAGE_TOGGLE && window.LANGUAGE_TOGGLE === 1) {
    renderLanguageToggle();
}
