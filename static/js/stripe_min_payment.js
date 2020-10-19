function setTwoNumberDecimal(el) {
    el.value = parseFloat(el.value).toFixed(2);
}


$(window).on('load', function() {
    $("#topup_button").click(function() {
        var amount_entered = Number(document.getElementById("topup_value").value);
        
        if (isNaN(amount_entered) || amount_entered < 10) {
            document.getElementById('invalid_topup').style.display = "block";
        } else {
            document.getElementById('invalid_topup').style.display = "none";
            $('.stripe-button-el').click();
        }
    });
    
    /*
    $(".stripe-button-el").click(function() {
        if (isNaN(amount_entered) || amount_entered < 10) {
            alert("not high enough");
            $('.stripe-button-el').attr("disabled", true);
        } else {
            return true;
        }
    });
    */
    
});