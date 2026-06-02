let menu = $("nav.navmenu");
let sheet = $(".sheet");
let intActMenu = null;
var rangeAutoScroll = 333;
var intervalAutoScroll = 2000;
var speedAutoScroll = 999;
var easingAutoScroll = 'swing';
$(document).ready(function(){
    $("button.open-invitation").click(function(e){
        $("#nav-cover .do-animate").addClass("animate")
    })
    $(".nav-tabs .nav-link").on('click', function(event) {
        event.preventDefault();
        if (this.hash !== "") {
          var hash = $(this).data("bs-target");
          $('html, body').animate({
            scrollTop: $(hash).offset().top
            }, 800,'swing', function(){
          });
        } 
    });
    
    $(window).scroll(function(event){
        var wScrollTop = $(this).scrollTop()+(window.innerHeight/2)+33;
        if(wScrollTop>window.innerHeight/2+33) menu.addClass("show")
        else menu.removeClass("show")
        if(intActMenu) clearInterval(intActMenu);
        setActiveMenu();
         
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

setActiveMenu = () => {
    intActMenu = setInterval(function() {
        var haveActive = false;
        scrollItems = sheet.each(function(){
            var windowScrollTop = $(window).scrollTop()+(window.innerHeight/2)+150;
            var element = $(this);
            if(windowScrollTop>element.offset().top && windowScrollTop < (element.offset().top + element.height()) && !haveActive) { 
                haveActive = true;
                $(`#${this.id}-tab`).addClass("active");
                clearInterval(intActMenu);
            }else{
                $(`#${this.id}-tab`).removeClass("active");
                clearInterval(intActMenu);
            }
        });
    }, 1000);
}