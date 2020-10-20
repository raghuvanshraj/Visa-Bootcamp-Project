$(window).on('load', function() {
    var length = $('#collection-timeslots').children('option').length;
    for (i=0; i<length; i++) {
        var timeslot = $('.row #collection-timeslots option:eq('+ i +')');
        timeslot_option = timeslot.attr('id');
        if (timeslot_option <= 5) {
            timeslot.css('background-color', '#ff9999');

            REWARD_POINTS = 5;
            timing = timeslot[0].innerHTML;
            timeslot[0].innerHTML = timing + REWARD_POINTS;
        } else if (timeslot_option <= 10) {
            timeslot.css('background-color', '#ffff99');

            REWARD_POINTS = 10;
            timing = timeslot[0].innerHTML;
            timeslot[0].innerHTML = timing + REWARD_POINTS;
        } else if (timeslot_option <= 20) {
            timeslot.css('background-color', '#66cc99');

            REWARD_POINTS = 15;
            timing = timeslot[0].innerHTML;
            timeslot[0].innerHTML = timing + REWARD_POINTS;
        } else {
            timeslot.css('background-color', '#D3D3D3');
        }
    }
});