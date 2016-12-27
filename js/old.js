var counter = 0;
var initSnow = function() {
    if (counter++ === 0) {
        particlesJS("particles-js", {"particles":{"number":{"value":150,"density":{"enable":true,"value_area":800}},"color":{"value":"#eee"},"shape":{"type":"circle","stroke":{"width":2,"color":"#bbb"},"polygon":{"nb_sides":5},"image":{"src":"img/github.svg","width":100,"height":100}},"opacity":{"value":.9,"random":false,"anim":{"enable":false,"speed":1,"opacity_min":0.1,"sync":false}},"size":{"value":5,"random":true,"anim":{"enable":false,"speed":40,"size_min":0.1,"sync":false}},"line_linked":{"enable":false,"distance":150,"color":"#eee","opacity":0.4,"width":1},"move":{"enable":true,"speed":3,"direction":"bottom","random":false,"straight":false,"out_mode":"out","bounce":false,"attract":{"enable":false,"rotateX":600,"rotateY":1200}}},"interactivity":{"detect_on":"canvas","events":{"onhover":{"enable":false,"mode":"grab"},"onclick":{"enable":false,"mode":"push"},"resize":true},"modes":{"grab":{"distance":400,"line_linked":{"opacity":1}},"bubble":{"distance":400,"size":40,"duration":2,"opacity":8,"speed":3},"repulse":{"distance":200,"duration":0.4},"push":{"particles_nb":4},"remove":{"particles_nb":2}}},"retina_detect":true});var count_particles, stats, update; stats = new Stats; stats.setMode(0); stats.domElement.style.position = 'absolute'; stats.domElement.style.left = '0px'; stats.domElement.style.top = '0px'; document.body.appendChild(stats.domElement); count_particles = document.querySelector('.js-count-particles'); update = function() { stats.begin(); stats.end(); requestAnimationFrame(update); }; requestAnimationFrame(update);
    } else if (counter % 2 == 0) {
        pJSDom[0].pJS.particles.move.enable = false;
    } else {
        pJSDom[0].pJS.particles.move.enable = true;
        pJSDom[0].pJS.fn.particlesRefresh();
    }
}
/*
$(document).ready(function() {
    $("#top").parallax({imageSrc: 'img/bg.jpg', speed: 0.1, bleed: 75});
    $("#aboutnav").click(function(el) {
        $('html, body').animate({
            scrollTop: $("#whoami").offset().top
        }, 1000);
    });
    $("#linksnav").click(function(el) {
        $('html, body').animate({
            scrollTop: $("#links").offset().top
        }, 1000);
    });
    $("#projectnav").click(function(el) {
        $('html, body').animate({
            scrollTop: $("#projects").offset().top
        }, 1000);
    });
    $("#skillsnav").click(function(el) {
        $('html, body').animate({
            scrollTop: $("#skills").offset().top
        }, 1000);
    });
    $("#toggle").click(initSnow);
});
*/

