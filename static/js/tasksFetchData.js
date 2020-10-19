resolveGraphql = (host, graphql_query, user_id, csrf_name) => {
    fetch(host , {
        mode: 'cors',
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf_name},
        body: JSON.stringify({query: graphql_query })
    })
    .then(response => { return response.json(); })
    .then(data => {
        nodes = data["data"]["allValidTasks"]["edges"];
        var tbody = document.getElementById("demo-foo-row-toggler");

        let nestedRequest = function(taskId) {
            let promiseArray = [];
            for (var i = 0; i < nodes.length; i++) {
                node = nodes[i]["node"];
                promiseArray.push(
                    fetch(host , {
                        mode: 'cors',
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf_name},
                        body: JSON.stringify({query: "{ userTask(userId: "+ user_id
                                                +", taskId: "+ node.taskId +") { taskId    userId    numberTimesCompleted } }"})
                    }).then(response => { return response.json(); })
                );
            }

            return Promise.all(promiseArray);
        };

        nestedRequest().then(response => {
            var modUserTaskData = {};
            for(var i=0; i < response.length; i++) {
                if (typeof response[i].data.userTask[0] !== 'undefined') {
                    taskId = response[i].data.userTask[0].taskId;
                    modUserTaskData[taskId] = response[i].data.userTask[0];
                }
            }
            for (var i = 0; i < nodes.length; i++) {
                node = nodes[i]["node"];
                userTaskNode = modUserTaskData[node.taskId];
                tr = tbody.insertRow(tbody.rows.length);
                tr2 = tbody.insertRow(tbody.rows.length);
                var percentageCompleted = 0;


                
                //Task name
                td = tr.insertCell(tr.cells.length);
                td.innerHTML = "<b>"+node.taskName + "</b><br/><small>" + node.taskAction+ " by "+node.taskEnd.split("T")[0]+"</small>";
                td.style.textAlign = "center";
                
                
                //Progress bar
                numberTimesCompleted = (typeof userTaskNode !== 'undefined')
                                        ? userTaskNode.numberTimesCompleted
                                        : 0;
                percentageCompleted = 0.0;
                timesToDo = node.timesToDo;
                percentageCompleted = numberTimesCompleted / node.timesToDo * 100;

                var divContainer = document.createElement('div');
                divContainer.className = "progress";

                var progressBar = document.createElement('div');
                progressBar.className = "progress-bar progress-bar-striped progress-bar-animated ";
                progressBar.setAttribute("role", "progressbar");
                progressBar.setAttribute("aria-valuenow", "4");
                progressBar.setAttribute("aria-valuemin", "0");
                progressBar.setAttribute("aaria-valuemax", "20");
                progressBar.setAttribute("style", "width: " + percentageCompleted + "%");
                if (percentageCompleted >= 100) {
                    progressBar.classList.add("bg-success");
                }
                else{
                	progressBar.classList.add("bg-warning");
                }

                //task summary
                var taskSummary = document.createElement('span');
                taskSummary.className = percentageCompleted < 100 ? "badge badge-warning" : "badge badge-success";
                taskSummary.innerHTML = "" + numberTimesCompleted + "/" + timesToDo + " completed";
                divContainer.appendChild(progressBar);

                //td.className = "hidden-xs-down";
                td.appendChild(divContainer);
                td.appendChild(taskSummary);
                td.style.textAlign = "left";
                td.style.borderRight = "none";

                //Claim button
                td = tr.insertCell(tr.cells.length);
                td.style.borderLeft= "none";
                radio = document.createElement("input");
                radio.setAttribute("type", "radio");
                radio.setAttribute("name", "claim");
                radio.setAttribute("style", "display:none; visibility: hidden; opacity: 0");
                radio.setAttribute("value", node.taskId);

                label = document.createElement("label");
                label.setAttribute("data-toggle", "modal");
                if (percentageCompleted >= 100) {
                    label.setAttribute("class", "btn btn-success m-t-30");
                    label.setAttribute("data-target", "#claimPopup1");
                    label.innerHTML = "+"+node.pointsToGive;
                } else {
                    label.setAttribute("class", "btn btn-danger m-t-30");
                    label.setAttribute("data-target", "#claimPopup2");
                    label.innerHTML = "+"+node.pointsToGive;
                }
                label.appendChild(radio);

                td.appendChild(label);
                
                


                
                
                //period
            //    td = tr2.insertCell(tr2.cells.length);
            //    td.innerHTML = "From " + node.taskStart.split("T")[0] +  " to " + node.taskEnd.split("T")[0]
            //                    + "<br/>Between " + node.validityPeriodStart + " to " + node.validityPeriodEnd;

                
               
            }
        });
    })
    .catch(function(error) {
        console.log('Request failed', error)
    });
}