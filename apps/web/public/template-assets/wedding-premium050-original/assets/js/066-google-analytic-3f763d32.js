var futureElementIsCreated=false
window.addEventListener("scroll",function(e){
    if(!futureElementIsCreated){
        var script = document.createElement("script"); 
        script.type = "text/javascript";
        script.async=!0;
        script.src = '//www.googletagmanager.com/gtag/js?id=UA-85446435-4';
        document.getElementsByTagName("head")[0].appendChild(script);
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'UA-85446435-4');
        //--------------------------
        futureElementIsCreated=true;
    }
});