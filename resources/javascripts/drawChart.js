var myChart = undefined;

function drawChart(rowClickedIdx) {
    // var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    const chartWidth = 1000;
    // var myWindow = window.open("", "MsgWindow", "width="+chartWidth+",height="+chartWidth+"");
    // const chartHTMLCanvas = "<canvas id='myChart' width='"+chartWidth+"' height='"+chartWidth+"'></canvas>";
    // myWindow.document.write(chartHTMLCanvas);

    if(typeof myChart === "undefined") {
        console.log("No Chart drawn");
    }
    else {
        console.log({myChart, typeof: typeof myChart});
        myChart.destroy();
    }

    // var chart = myWindow.document.getElementById("myChart");
    const categoryClicked = document.getSelection().focusNode.textContent
    var chartCanvas = document.getElementById("myChart");
    var divSize = { 
        height: chartCanvas.parentNode.clientHeight,
        width:  chartCanvas.parentNode.clientHeight,
        style: ""
    };



    const ctx = chartCanvas.getContext('2d');
    // console.log({ctx});

    var rows = document.getElementById("tagSummaryTable").rows;
    console.log({rows});
    var columnArray = [];
    const labelCounts = {};
    for (const rowIndex in rows) {
        if (Object.hasOwnProperty.call(rows, rowIndex) && rowIndex !== "0") {
            const rowChildren = rows[rowIndex].childNodes;
            // console.log({category: rowChildren[0], subcategory: rowChildren[1]});
            const category = rowChildren[0].childNodes[0].childNodes[0].innerText;
            const subcategory = rowChildren[1].childNodes[1].childNodes[0].innerText;
            const count = rowChildren[2].childNodes[1].childNodes[0].innerText;
            var label = category + ":" + subcategory;
            // console.log({category, subcategory});
            // console.log({labelObj: rowChildren[columnIdx].childNodes[1].childNodes[0]});
            if(typeof labelCounts[category] === "undefined") {
                labelCounts[category] = {};
            }
            labelCounts[category][subcategory] = count;
            // console.log({category, subcategory, count: labelCounts[category][subcategory]});
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
    // const categoryClicked = rows[rowClickedIdx+1].childNodes[0].childNodes[0].childNodes[0].innerText;
    console.log({rowClickedIdx, categoryClicked});

    myChart = new Chart(ctx, {
        type: 'pie',
        // title: '# of Votes',
        data: {
            labels: Object.keys(labelCounts[categoryClicked]),
            datasets: [
                {
                    data: Object.values(labelCounts[categoryClicked]),
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
            // scales: {
            //     y: {
            //         beginAtZero: true
            //     }
            // }
        }
    });
    // myChart.canvas.parentNode.style.height = myChart.canvas.parentNode.style.width;
    // myChart.resize()

    // var chartCanvasPrintableBefore = { 
    //     height: chartCanvas.width,
    //     width:  chartCanvas.height,
    //     style:  chartCanvas.attributes["style"]
    // }

    //  chartCanvas.parentNode.width = divSize.width;
    //  chartCanvas.parentNode.height = divSize.height;
    //  chartCanvas.attributes["style"].value= "";
    // // chartCanvas.attributes[widthIdx]
    // // chartCanvas.attributes[heightIdx]

    console.log(chartCanvas.parentNode);
    console.log(chartCanvas);
    // myChart.resize()
}