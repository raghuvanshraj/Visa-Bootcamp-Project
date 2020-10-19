resolveGraphqlRewards = (host, graphql_query, point, csrf_name) => {
    return fetch(host , {
        mode: 'cors',
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf_name},
        body: JSON.stringify({query: graphql_query })
    })
    .then(response => { return response.json(); })
    .then(data => {
        nodes = data["data"]["validRewards"]["edges"];
        var div = document.getElementsByName("reward-data")[0];

        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i].node;
            imageUrl = (node.imageUrl == null)
                        ? "../../../static/assets/images/240px-No_image_available.svg.png"
                        : node.imageUrl;

            var img = document.createElement('img');
            img.setAttribute("src", imageUrl);
            img.setAttribute("class", "rounded-circle");
            img.setAttribute("alt", "profile-image");

            var divImageHolder = document.createElement('div');
            divImageHolder.setAttribute("class", "thumb-xl member-thumb m-b-10 mx-auto");
            divImageHolder.appendChild(img);

            var h4RewardName = document.createElement('h4');
            h4RewardName.setAttribute("class", "m-b-5");
            h4RewardName.innerHTML = node.rewardName;

            var pDeductPoints = document.createElement('p');
            pDeductPoints.setAttribute("class", "text-muted");
            pDeductPoints.innerHTML = node.deductPoints + " points";

            var divRewardPoints = document.createElement('div');
            divRewardPoints.appendChild(h4RewardName);
            divRewardPoints.appendChild(pDeductPoints);

            var radioClaimReward = document.createElement("input");
            radioClaimReward.setAttribute("value", node.rewardId);
            radioClaimReward.setAttribute("name", "redeem");
            radioClaimReward.setAttribute("type", "radio");
            radioClaimReward.setAttribute("style", "display:none; visibility: hidden; opacity: 0");

            var labelClaimReward = document.createElement('label');
            labelClaimReward.setAttribute("class", "btn btn-primary m-t-20 w-md");
            labelClaimReward.setAttribute("data-toggle", "modal");
            labelClaimReward.innerHTML = "Redeem";
            labelClaimReward.appendChild(radioClaimReward);
            if (point >= node.deductPoints) {
                dataTarget = (node.addKredits > 0) ? "#claimKreditPopup" : "#claimPopup1";
                labelClaimReward.setAttribute("class", "btn btn-primary m-t-20 w-md");
                labelClaimReward.setAttribute("data-target", dataTarget);
            } else {
                labelClaimReward.setAttribute("class", "btn btn-primary m-t-20 w-md disabled");
                labelClaimReward.setAttribute("data-target", "#");
            }

            var divMemberCard = document.createElement('div');
            divMemberCard.appendChild(divImageHolder);
            divMemberCard.appendChild(divRewardPoints);
            divMemberCard.appendChild(labelClaimReward);

            var divClearFix = document.createElement("div");
            divClearFix.setAttribute("class", "clearfix");
            var divCardBox = document.createElement("div");
            divCardBox.setAttribute("class", "text-center card-box");
            divCardBox.appendChild(divClearFix);
            divCardBox.appendChild(divMemberCard);

            var divParentContainer = document.createElement("div");
            divParentContainer.setAttribute("class", "col-md-6");
            divParentContainer.appendChild(divCardBox);
            div.appendChild(divParentContainer);
        }
    })
    .catch(function(error) {
        console.log('Request failed', error)
    });
};