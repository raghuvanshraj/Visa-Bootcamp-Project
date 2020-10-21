function detectmob() {
    if(window.innerWidth <= 700) {
        return true;
    } else {
        return false;
    }
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var prize;
var segment_chosen;


$(window).on('load', function() {
    prize = 0;
    segment_chosen = document.getElementById("prize").value;
    var outer_radius = 170;
    var pic_location = "../static/assets/images/wheel_stuff/big.png"
    
    if (detectmob()) {
        pic_location = "../../../static/assets/images/wheel_stuff/small.png"
        outer_radius = 125;
        document.getElementById('wheel-cell').height = 430;
        document.getElementById('VisaWheel').width = 280;
        document.getElementById('VisaWheel').height = 280;
    }
    
    console.log(segment_chosen);
    
    var theWheel = new Winwheel({
        'canvasId'          : 'VisaWheel',
        'numSegments'       : 8,                 // Specify number of segments.
        'outerRadius'       : outer_radius,               // Set outer radius so wheel fits inside the background.  
        'segments'          :                    // Define segments including image and text.
        [
           {'fillStyle' : '#eae56f', 'text' : 'Offer 1'},
		   {'fillStyle' : '#89f26e', 'text' : 'Offer 2'},
		   {'fillStyle' : '#7de6ef', 'text' : 'Offer 3'},
		   {'fillStyle' : '#e7706f', 'text' : 'Try again'},
		   {'fillStyle' : '#eae56f', 'text' : 'Offer 5'},
		   {'fillStyle' : '#89f26e', 'text' : 'Offer 6'},
		   {'fillStyle' : '#7de6ef', 'text' : 'Offer 7'},
		   {'fillStyle' : '#e7706f', 'text' : 'Try again'}
        ],
        'animation' :           // Specify the animation to use.
        {
            'type'     : 'spinToStop',
            'duration' : 8,     // Duration in seconds.
            'spins'    : 8,     // Number of complete spins.
            'callbackFinished' : finish_wheel,
            'callbackSound'    : playSound,   // Function to call when the tick sound is to be triggered.
            'soundTrigger'     : 'pin'        // Specify pins are to trigger the sound, the other option is 'segment'.
        },
        'pins' :
        {
            'number' : 16   // Number of pins. They space evenly around the wheel.
        }
    });
	
    /*
    var firstImg = new Image();
 
    // Create callback to execute once the image has finished loading.
    firstImg.onload = function()
    {
        theWheel.wheelImage = firstImg;    // Make wheelImage equal the loaded image object.
        theWheel.draw();                   // Also call draw function to render the wheel.
    }
     
    // Set the image source, once complete this will trigger the onLoad callback (above).
    firstImg.src = pic_location;
    */
    
    
    
    // Rig wheel
    /*
    angle_to_stop = getRandomInt(0, 360);
    if (angle_to_stop<=142 && angle_to_stop>=135) {
        angle_to_stop = 133;
    } else if (angle_to_stop<=180 && angle_to_stop>=170) {
        angle_to_stop = 183;
    } else if (angle_to_stop<=235 && angle_to_stop>=225) {
        angle_to_stop = 223;
    } else if (angle_to_stop<=262 && angle_to_stop>=255) {
        angle_to_stop = 273;
    } else if (angle_to_stop<=323 && angle_to_stop>=315) {
        angle_to_stop = 313;
    }
    */
    var angle_to_stop = theWheel.getRandomForSegment(segment_chosen);
    theWheel.animation.stopAngle = angle_to_stop;
    
    // -----------------------------------------------------------------
    // This function is called when the segment under the prize pointer changes
    // we can play a small tick sound here like you would expect on real prizewheels.
    // -----------------------------------------------------------------
    var audio = new Audio('../../../static/js/wheel_stuff/tick.mp3');  // Create audio object and load tick.mp3 file.

    function playSound()
    {
        // Stop and rewind the sound if it already happens to be playing.
        audio.pause();
        audio.currentTime = 0;

        // Play the sound.
        audio.play();
    }
    
    // Vars used by the code in this page to do power controls.
    var wheelPower = 0;
    var wheelSpinning = false;

    // -------------------------------------------------------
    // Function to handle the onClick on the power buttons.
    // -------------------------------------------------------
    $(".power-setting").on("click", function() {
        var power_setting = $(this).html();
        if (power_setting == "High") {
            powerLevel = 3;
        } else if (power_setting == "Med") {
            powerLevel = 2;
        } else {
            powerLevel = 1;
        }
        powerSelected(powerLevel);
    });
    
    
	if (segment_chosen > 8) {
		// Disable the spin button due to insufficient points
		document.getElementById('spin_button').src       = "../../../static/assets/images/wheel_stuff/spin_off.png";
		document.getElementById('spin_button').className = "";
	} else {
		$("#spin_button").on("click", function() {
			startSpin();
		});
	}
	
    
    // reset wheel to original
    $("#reset-button").on("click", function() {
        resetWheel();
    });
    
    
    function powerSelected(powerLevel)
    {
        // Ensure that power can't be changed while wheel is spinning.
        if (wheelSpinning == false)
        {
            // Reset all to grey incase this is not the first time the user has selected the power.
            $('#pw1').css('background-color', '#cccccc');
            $('#pw2').css('background-color', '#cccccc');
            $('#pw3').css('background-color', '#cccccc');
            

            // Now light up all cells below-and-including the one selected by changing the class.
            if (powerLevel == 1)
            {
                $('#pw1').css('background-color', '#6fe8f0');
            }

            if (powerLevel == 2)
            {
                $('#pw2').css('background-color', '#86ef6f');
            }

            if (powerLevel == 3)
            {
                $('#pw3').css('background-color', '#ef6f6f');
            }

            // Set wheelPower var used when spin button is clicked.
            wheelPower = powerLevel;
			
			if (segment_chosen > 8) {
				// Disable the spin button due to insufficient points
				document.getElementById('spin_button').src       = "../../../static/assets/images/wheel_stuff/spin_off.png";
				document.getElementById('spin_button').className = "";
			} else {
				// Light up the spin button by changing it's source image and adding a clickable class to it.
				document.getElementById('spin_button').src = "../../../static/assets/images/wheel_stuff/spin_on.png";
				document.getElementById('spin_button').className = "clickable";
			}
        }
    }

    // -------------------------------------------------------
    // Click handler for spin button.
    // -------------------------------------------------------
    function startSpin()
    {
        if (wheelPower == 0) {
            alert("Select power level for the wheel first!");
        }
        // Ensure that spinning can't be clicked again while already running.
        if (wheelSpinning == false && wheelPower > 0)
        {
            // Based on the power level selected adjust the number of spins for the wheel, the more times is has
            // to rotate with the duration of the animation the quicker the wheel spins.
            if (wheelPower == 1)
            {
                theWheel.animation.spins = 3;
            }
            else if (wheelPower == 2)
            {
                theWheel.animation.spins = 8;
            }
            else if (wheelPower == 3)
            {
                theWheel.animation.spins = 15;
            }

            // Disable the spin button so can't click again while wheel is spinning.
            document.getElementById('spin_button').src       = "../../../static/assets/images/wheel_stuff/spin_off.png";
            document.getElementById('spin_button').className = "";

            // Begin the spin animation by calling startAnimation on the wheel object.
            theWheel.startAnimation();

            // Set to true so that power can't be changed and spin button re-enabled during
            // the current animation. The user will have to reset before spinning again.
            wheelSpinning = true;
        }
    }

    // -------------------------------------------------------
    // Function for reset button.
    // -------------------------------------------------------
    function resetWheel()
    {
        document.getElementById('reset-button').style.display = "none";
        theWheel.stopAnimation(false);  // Stop the animation, false as param so does not call callback function.
        theWheel.rotationAngle = 0;     // Re-set the wheel angle to 0 degrees.
        theWheel.draw();                // Call draw to render changes to the wheel.

        $('#pw1').css('background-color', '#cccccc');
        $('#pw2').css('background-color', '#cccccc');
        $('#pw3').css('background-color', '#cccccc');

        wheelSpinning = false;          // Reset to false to power buttons and spin can be clicked again.
    }
    
    function finish_wheel(indicatedSegment) {
        prize = indicatedSegment.text;
        console.log(prize);
        //document.getElementById("prize").value = prize;
		if (prize == "Try again") {
			// Auto refreshes page
			$('#claim-prize-button').click();
		} else {
			// Shows claim prize button
			document.getElementById('collect-prize').style.display = "block";
		}
        //$('#claim-prize-button').click();
    }
    
    
    $('#claim-prize').submit(function() {
        // DO STUFF...
        //document.getElementById("prize").value = prize;
        return true; // return false to cancel form action
    });
});

