
function drawChart(rowIdx) {
    // var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    const chartHTMLCanvas = "<canvas id='myChart' width='400' height='400'></canvas>";
    var myWindow = window.open("", "MsgWindow", "width=400,height=400");
    myWindow.document.write(chartHTMLCanvas); 
    var chart = myWindow.document.getElementById("myChart");
    console.log(chart);
    const ctx = chart.getContext('2d');

    var rows = document.getElementById("tagSummaryTable").rows;
    var columnArray = [];
    const labelCounts = {};
    for (const rowIndex in rows) {
        if (Object.hasOwnProperty.call(rows, rowIndex) && rowIndex !== "0") {
            const rowChildren = rows[rowIndex].childNodes;
            const label = rowChildren[0].innerText;
            if(typeof labelCounts[label] === "undefined") {
                labelCounts[label] = 0
            }
            labelCounts[label]++
        }
    }
    console.log({labels: labelCounts});
            
    const CHART_COLORS = {
        "RED": "255, 99, 132",
        "BLUE": "54, 162, 235",
        "YELLOW": "255, 206, 86",
        "GREEN": "75, 192, 192",
        "PURPLE":"153, 102, 255",
        "ORANGE": "255, 159, 64"
    };

    const CHART_OPACITIES = {
        "BORDER": 1,
        "BACKGROUND": 0.2
    }
    

    const myChart = new Chart(ctx, {
        type: 'pie',
        // title: '# of Votes',
        data: {
            labels: Object.keys(labelCounts),
            datasets: [
                {
                    data: Object.values(labelCounts),
                    backgroundColor: [
                        'rgba(' + CHART_COLORS.RED + ', ' + CHART_OPACITIES.BACKGROUND +')',
                        'rgba(' + CHART_COLORS.BLUE + ', ' + CHART_OPACITIES.BACKGROUND +')',
                        'rgba(' + CHART_COLORS.YELLOW + ', ' + CHART_OPACITIES.BACKGROUND +')',
                        'rgba(' + CHART_COLORS.GREEN + ', ' + CHART_OPACITIES.BACKGROUND +')',
                        'rgba(' + CHART_COLORS.PURPLE + ', ' + CHART_OPACITIES.BACKGROUND +')',
                        'rgba(' + CHART_COLORS.ORANGE + ', ' + CHART_OPACITIES.BACKGROUND +')'
                    ],
                    borderColor: [
                        'rgba(' + CHART_COLORS.RED + ', ' + CHART_OPACITIES.BORDER +')',
                        'rgba(' + CHART_COLORS.BLUE + ', ' + CHART_OPACITIES.BORDER +')',
                        'rgba(' + CHART_COLORS.YELLOW + ', ' + CHART_OPACITIES.BORDER +')',
                        'rgba(' + CHART_COLORS.GREEN + ', ' + CHART_OPACITIES.BORDER +')',
                        'rgba(' + CHART_COLORS.PURPLE + ', ' + CHART_OPACITIES.BORDER +')',
                        'rgba(' + CHART_COLORS.ORANGE + ', ' + CHART_OPACITIES.BORDER +')'
                    ],
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}