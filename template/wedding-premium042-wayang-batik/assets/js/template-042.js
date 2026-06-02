let navmenu = $(".navmenu");
var rangeAutoScroll = 333;
var intervalAutoScroll = 2000;
var speedAutoScroll = 999;
var easingAutoScroll = 'swing';
$(".zs-slideshow").remove();
$(document).ready(function(){
    $("button.open-invitation").click(function(e){
        $(".not-scrollanimate.do-animate").addClass("animate")
    })
    $(".navigation ul li").on('click', function(event) {
        event.preventDefault();
        var hash = $(this).data("targetid");
        $('html, body').animate({
            scrollTop: $(hash).offset().top
            }, 800,'swing', function(){
        });
    });
    
    $(".humberger-btn").click(function(e){
        $(".navigation").toggleClass("open");
    })
    
    $(window).scroll(function(event){
        var wScrollTop = $(this).scrollTop()+(window.innerHeight/2)+33;
        if(wScrollTop>window.innerHeight/2+33) navmenu.addClass("show");
        else navmenu.removeClass("show");
    });
    
    $("#button-mode-read").on("click",function(e){
        e.preventDefault();
        if(this.classList.contains("active")){
            clearInterval(interValScrolling);
            this.classList.remove("active");
            this.querySelector("svg").classList.remove("animationSpin");
            $("body").attr("style","");
        }else{
            autoScroll(this);
            this.classList.add("active");
            this.querySelector("svg").classList.add("animationSpin");
        }
    });
    
    $("#button-to-top").click(function () {
       $("html, body").animate({scrollTop: 0}, 1000);
    });
});

autoScroll = (currentElement) =>{
    let JQWin = $(window);
    let JQDoc = $(document);
    let JQBody = $("body");
    interValScrolling = setIntervalAndExecute(function() {
       if((window.innerHeight + window.scrollY) >= document.body.offsetHeight){
           clearInterval(interValScrolling);
           currentElement.classList.remove("active");
           currentElement.querySelector("svg").classList.remove("animationSpin");
           document.body.setAttribute("style","");
       }
       else{
           $("html, body").animate({ scrollTop: this.scrollY+rangeAutoScroll }, speedAutoScroll,easingAutoScroll);
           document.body.setAttribute("style","overflow:hidden");
       }
    }, intervalAutoScroll);
}

function setIntervalAndExecute(fn, t) {
    fn();return(setInterval(fn, t));
}

particlesJS('particles-js',
  
  {
    "particles": {
      "number": {
        "value": 80,
        "density": {
          "enable": true,
          "value_area": 800
        }
      },
      "color": {
        "value": "#ffffff"
      },
      "shape": {
        "type": "circle",
        "stroke": {
          "width": 0,
          "color": "#000000"
        },
        "polygon": {
          "nb_sides": 5
        },
        "image": {
          "src": "img/github.svg",
          "width": 100,
          "height": 100
        }
      },
      "opacity": {
        "value": 0.5,
        "random": false,
        "anim": {
          "enable": false,
          "speed": 1,
          "opacity_min": 0.1,
          "sync": false
        }
      },
      "size": {
        "value": 5,
        "random": true,
        "anim": {
          "enable": false,
          "speed": 40,
          "size_min": 0.1,
          "sync": false
        }
      },
      "line_linked": {
        "enable": false,
        "distance": 150,
        "color": "#ffffff",
        "opacity": 0.4,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 5,
        "direction": "none",
        "random": false,
        "straight": false,
        "out_mode": "out",
        "attract": {
          "enable": false,
          "rotateX": 600,
          "rotateY": 1200
        }
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": true,
          "mode": "repulse"
        },
        "onclick": {
          "enable": true,
          "mode": "push"
        },
        "resize": true
      },
      "modes": {
        "grab": {
          "distance": 400,
          "line_linked": {
            "opacity": 1
          }
        },
        "bubble": {
          "distance": 400,
          "size": 40,
          "duration": 2,
          "opacity": 8,
          "speed": 3
        },
        "repulse": {
          "distance": 200
        },
        "push": {
          "particles_nb": 4
        },
        "remove": {
          "particles_nb": 2
        }
      }
    },
    "retina_detect": true,
    "config_demo": {
      "hide_card": false,
      "background_color": "#b61924",
      "background_image": "",
      "background_position": "50% 50%",
      "background_repeat": "no-repeat",
      "background_size": "cover"
    }
  }

);