function initRightBar(){
    $("#rightnav>li>a").click(function(event) {
        $("#rightnav>li>a").css('background-color', '#556c81');
        $("#rightnav>li>ul>li>a").css('background-color', '#556c81');

        $(this).parent().children('ul>li>a').css('background-color', '#344f68');
        $(this).css('background-color', '#0D2E4C');
        $("#rightnav>li>ul").hide();
        $(this).parent().children('ul').toggle('slow');
        // event.preventDefault();
    });
    $("#rightnav>li>a").on('mouseleave', '', function(event) {
        $(this).css('background-color', '#556c81');
        // event.preventDefault();
    });
    $("#rightnav>li>a").on('mouseenter', '', function(event) {
        $(this).css('background-color', '#344f68');
        // event.preventDefault();
    });

    $("#rightnav>li>ul>li>a").click(function(event) {
        $("#rightnav>li>ul>li>a").css('background-color', '#556c81');
        $(this).parent().parent().children('li>a').css('background-color', '#344f68');
        $(this).parent().parent().parent().children('a').css('background-color', '#344f68');
        $(this).css('background-color', '#0D2E4C');
        // event.preventDefault();
    });
    $("#rightnav>li>ul>li>a").on('mouseleave', '', function(event) {
        $(this).css('background-color', '#556c81');
        // event.preventDefault();
    });
    $("#rightnav>li>ul>li>a").on('mouseenter', '', function(event) {
        $(this).css('background-color', '#344f68');
        // event.preventDefault();
    });

    $("#rightnav>li>ul").hide();
    $($("#rightnav>li>ul")[0]).show()


}

$('div .shared-by').click(function(event) {
    var flag = false;
    var current = $(this).siblings('#preview').children('.note-content');
    var all = $('.note-content');
    // flag = $.inArray(current, all);
    // all.splice(current, 1);
    // all.hide();
    current.fadeToggle('fast');
});

$(document).ready(function() {
    initRightBar();
    hljs.initHighlightingOnLoad();
    $('.note-content').hide();
});
