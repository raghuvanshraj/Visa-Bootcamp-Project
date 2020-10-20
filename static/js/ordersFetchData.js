resolveGraphqlItems = (host, graphql_query, csrf_name) => {
    return fetch(host , {
        mode: 'cors',
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf_name},
        body: JSON.stringify({query: graphql_query })
    })
    .then(response => { return response.json(); })
    .then(data => {
        nodes = data["data"]["allValidItems"]["edges"];
        var select = document.getElementsByName("main_dish")[0];

        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i].node;
            imageUrl = (node.imageUrl == null)
                        ? "../../../static/assets/images/240px-No_image_available.svg.png"
                        : node.imageUrl;

            var option = document.createElement("option");
            option.setAttribute("data-img-class", "w250");
            option.setAttribute("data-img-src", imageUrl);
            option.value=node.itemId;
            option.innerHTML = node.itemName + " $" + node.price.toFixed(2);
            select.appendChild(option);
        }
    })
    .catch(function(error) {
        console.log('Request failed', error)
    });
};

resolveGraphqlItemBases = (host, graphql_query, graphql_query_upsize, graphql_query_sauces, csrf_name) => {
    return fetch(host , {
        mode: 'cors',
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf_name},
        body: JSON.stringify({query: graphql_query })
    })
    .then(response => { return response.json(); })
    .then(baseData => {
        // Force load GraphQL on upsize tab
        fetch(host , {
            mode: 'cors',
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf_name},
            body: JSON.stringify({query: graphql_query_upsize })
        })
        .then(response => { return response.json(); })
        .then(upsizeData => {
            var baseOptions = document.querySelector('input[name="base"]');

            // fetch sauce data ONLY AFTER base is loaded.
            fetch(host , {
                mode: 'cors',
                method: 'POST',
                credentials: 'same-origin',
                headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf_name},
                body: JSON.stringify({query: graphql_query_sauces })
            })
            .then(response => { return response.json(); })
            .then(sauceData => {
                var baseUpsizeOptions = document.querySelector('input[name="baseUpsize"]');
                loadBaseDropdown(sauceData, upsizeData, baseData);
                loadBaseDropdownUpsize(sauceData, upsizeData, baseData);
                loadAddonSauceDropdown(sauceData, upsizeData, baseData);
            });
        });
    })
    .catch(function(error) {
        console.log('Request failed', error)
    });
};

loadBaseDropdown = (sauceData, upsizeData, baseData) => {
    var nodes = baseData["data"]["allValidItemBasesForMenu"]["edges"];
    var allOptionsText = [];
    var isFirstRadio = true;

    for (var i = 0; i < nodes.length; i++) {
        node = nodes[i].node;

        // prevent double counting of the same base (e.g. Jap white rice (Donburi Sauce)
        //   is the same as Jap white rice (roasted sesame)
        var possibleOption = node.itemBaseName.split("(")[0].trim();
        if (allOptionsText.indexOf(possibleOption) == -1) {
            allOptionsText.push(possibleOption);

            var radioButtonValue = node.itemBaseId;
            var parentContainer = document.getElementById("base");
            var radioButtonName = "base";
            var radioButtonReadableValue = possibleOption; // we will be customizing later
            var radioButton = createRadioButton(radioButtonValue, radioButtonName, parentContainer, radioButtonReadableValue, !node.isValid, isFirstRadio);
            isFirstRadio = false;
        }

        radioButton.onclick = () => {
            loadBaseDropdownUpsize(sauceData, upsizeData, baseData);
            loadAddonSauceDropdown(sauceData, upsizeData, baseData);
        };
    }
}

loadBaseDropdownUpsize = (sauceData, upsizeData, baseData) => {
    var baseSectionContainer = document.getElementById("base");
    var nodes = upsizeData["data"]["allValidItemBasesForMenu"]["edges"];

    var parentContainer = document.getElementById("baseUpsize");
    parentContainer.innerHTML = "";
    var header = document.createElement("h4");
    header.innerHTML = "Upsize your base";
    parentContainer.appendChild(header);

    var radioButtonValue = document.querySelector('input[name="base"]:checked').value;
    var radioButtonName = "baseUpsize";
    var radioButtonReadableValue = "No";
    var isFirstRadio = true;
    var isDisabled = false;
    var radioButton = createRadioButton(radioButtonValue, radioButtonName, parentContainer, radioButtonReadableValue, isDisabled, isFirstRadio);
    radioButton.onclick = () => {
        loadAddonSauceDropdown(sauceData, upsizeData, baseData);
    };

    for (var i = 0; i < nodes.length; i++) {
        node = nodes[i].node;
        var selectedBaseReadableValue = document.querySelector('input[name="base"]:checked').parentNode.nextElementSibling.innerHTML;
        var isCorrectStart = node.itemBaseName.startsWith("Upsized " + selectedBaseReadableValue);
        if (isCorrectStart === true) {
            var radioButtonValue = node.itemBaseId;
            var radioButtonName = "baseUpsize";
            var radioButtonReadableValue = "Yes";
            var isDisabled = !node.isValid;
            var isFirstRadio = false;
            radioButton = createRadioButton(radioButtonValue, radioButtonName, parentContainer, radioButtonReadableValue, isDisabled, isFirstRadio);
            radioButton.onclick = () => {
                loadAddonSauceDropdown(sauceData, upsizeData, baseData);
            };
            break;
        }
    }
};

loadAddonSauceDropdown = (sauceData, upsizeData, baseData) => {
    var baseSectionContainer = document.getElementById("base");
    var baseUpsizeContainer = document.getElementById("baseUpsize");
    var nodes = sauceData["data"]["allValidItemAddonsSauces"]["edges"];
    var parentContainer = document.getElementById("baseSauce");

    var header = document.createElement("h4");
    parentContainer.innerHTML = "";
    header.innerHTML = "Select your sauce";
    parentContainer.appendChild(header);

    var selectedBaseReadableValue = document.querySelector('input[name="base"]:checked').parentNode.nextElementSibling.innerHTML;
    var selectedBaseUpsizeReadableValue = document.querySelector('input[name="baseUpsize"]:checked').parentNode.nextElementSibling.innerHTML;
    var selectBaseUpsizeOption = (selectedBaseUpsizeReadableValue == "Yes") ? "Upsized ": "";

    var fetchedDataToRefer = (selectBaseUpsizeOption == "Upsized ") ? upsizeData["data"]["allValidItemBasesForMenu"]["edges"]
                                                                    : baseData["data"]["allValidItemBasesForMenu"]["edges"];

    var isFirstRadio = true;
    for (var i = 0; i < nodes.length; i++) {
        node = nodes[i].node;

        for (var j = 0; j < fetchedDataToRefer.length; j++) {
            itemBaseName = fetchedDataToRefer[j].node.itemBaseName;
            var potentialBaseAndSauce = selectBaseUpsizeOption + selectedBaseReadableValue + " (" + node.itemAddonName + ")";
            var isCorrect = itemBaseName == potentialBaseAndSauce;

            if (isCorrect){
                var radioButtonValue = fetchedDataToRefer[j].node.itemBaseId;
                var radioButtonName = "baseSauce";
                var radioButtonReadableValue = node.itemAddonName;
                var isDisabled = !node.isValid;

                var radioButton = createRadioButton(radioButtonValue, radioButtonName, parentContainer, radioButtonReadableValue, isDisabled, isFirstRadio);
                isFirstRadio = false;
            }
        }
    }
};

createRadioButton = (radioButtonValue, radioButtonName, parentContainer, radioButtonReadableValue, isDisabled, isFirstRadio) => {
    var radioButton = document.createElement("input");
    radioButton.type = "radio";
    radioButton.name = radioButtonName;
    radioButton.value = radioButtonValue;

    var labelForRadio = document.createElement("label");
    labelForRadio.classList.add("radio-inline");
    labelForRadio.appendChild(radioButton);
    parentContainer.appendChild(labelForRadio);

    if (radioButtonReadableValue !== "") {
        var labelForRadioOptionText = document.createElement("label");
        labelForRadioOptionText.innerHTML = radioButtonReadableValue;
        parentContainer.appendChild(labelForRadioOptionText);
    }

    if (isDisabled)
        radioButton.setAttribute('disabled', true);

    if (isFirstRadio) {
        radioButton.checked = true;
    }

    var radioContainer = document.createElement("div");
    radioContainer.setAttribute("class", "radioGroup");
    radioContainer.appendChild(labelForRadio);
    radioContainer.appendChild(labelForRadioOptionText);
    parentContainer.appendChild(radioContainer);

    return radioButton;
}

resolveGraphqlItemAddons = (host, graphql_query, csrf_name) => {
    return fetch(host , {
        mode: 'cors',
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf_name},
        body: JSON.stringify({query: graphql_query })
    })
    .then(response => { return response.json(); })
    .then(data => {
        nodes = data["data"]["allValidItemAddons"]["edges"];

        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i].node;
            select_name = "";
            switch(node.itemType) {
                case "Extra protein":
                    select_name = "extra_proteins";
                    break;
                case "House special":
                    select_name = "house_special";
                    break;
                case "Drink":
                    select_name = "drink";
                    break;
            }
            var select = document.getElementsByName(select_name)[0];

            if (select_name != "") {
                imageUrl = (node.imageUrl == null)
                            ? "../../../static/assets/images/240px-No_image_available.svg.png"
                            : node.imageUrl;

                var option = document.createElement("option");
                option.setAttribute("data-img-src", imageUrl);
                option.value=node.itemAddonId;
                option.innerHTML = node.itemAddonName + " $" + node.itemAddonPrice.toFixed(2);
                select.appendChild(option);
            }
        }
    })
    .catch(function(error) {
        console.log('Request failed', error)
    });
};
