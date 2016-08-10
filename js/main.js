$(document).ready(function() {
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
});