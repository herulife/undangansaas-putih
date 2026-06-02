(function () {
  var initialized = false;
  var typingStarted = false;

  function singleDoAnimateTyping(element) {
    var i = 0;
    var txt = element.innerText;
    var speed = 77;
    element.innerHTML = '';

    function typeWriter() {
      if (i < txt.length) {
        element.innerHTML += txt.charAt(i);
        i += 1;
        setTimeout(typeWriter, speed);
      } else if (element.classList.contains('loop')) {
        singleDoAnimateTyping(element);
      }
    }

    typeWriter();
  }

  function multipleDoAnimateTyping(elements) {
    var queue = Array.prototype.slice.call(elements);
    var looping = [];
    var speed = 77;

    function runNext(index) {
      if (!queue.length) return;
      if (index >= queue.length) {
        queue = looping;
        looping = [];
        runNext(0);
        return;
      }

      var element = queue[index];
      var text = element.innerText;
      var i = 0;
      element.innerHTML = '';
      if (element.classList.contains('loop')) looping.push(element);

      function typeWriter() {
        if (i < text.length) {
          element.innerHTML += text.charAt(i);
          i += 1;
          setTimeout(typeWriter, speed);
        } else {
          runNext(index + 1);
        }
      }

      typeWriter();
    }

    runNext(0);
  }

  function animateVisibleElements() {
    if (!window.jQuery) return;
    try {
      var wScrollTop = window.scrollY + (window.innerHeight / 1.75);
      $('.do-animate:not(.not-scrollanimate,.animate-start),.animate-init:not(.not-scrollanimate,.animate-start)').each(function () {
        var JqElement = $(this);
        var elementOffsetTop = JqElement.offset().top;
        if (wScrollTop > elementOffsetTop) {
          JqElement.addClass('animate');
        } else if ((window.scrollY + window.innerHeight) < elementOffsetTop) {
          JqElement.removeClass('animate');
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  function startIntroAnimations() {
    try {
      $('.animate-start,.not-scrollanimate').addClass('animate');
      if (!typingStarted) {
        typingStarted = true;
        multipleDoAnimateTyping(document.querySelectorAll('.typing.animate'));
      }
      setTimeout(animateVisibleElements, 80);
    } catch (error) {
      console.log(error);
    }
  }

  function initAnimationScroll() {
    if (initialized || !window.jQuery) return;
    initialized = true;
    window.addEventListener('scroll', animateVisibleElements, { passive: true });
    document.addEventListener('click', function (event) {
      if (event.target.closest('button, a, .open-invitation')) startIntroAnimations();
    }, true);
    setTimeout(animateVisibleElements, 80);
  }

  window.__linkundanganStartAnimations = startIntroAnimations;
  window.__linkundanganRefreshAnimations = animateVisibleElements;

  initAnimationScroll();
  document.addEventListener('readystatechange', initAnimationScroll);
  document.addEventListener('DOMContentLoaded', initAnimationScroll);
  window.addEventListener('load', function () {
    initAnimationScroll();
    setTimeout(animateVisibleElements, 120);
  });
})();
