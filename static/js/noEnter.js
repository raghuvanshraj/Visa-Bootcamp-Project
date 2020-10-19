noEnter = (elementToOverride, elementToCheck) => {
    if ($(elementToCheck).length == 0) {
        $(elementToOverride).keypress(event => {
            if (event.which === 13 || event.keyCode == 13) {
                event.preventDefault();
                return false;
            } else {
                return true;
            }
        });
    };
};
