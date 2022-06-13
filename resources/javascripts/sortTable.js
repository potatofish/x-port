// https://www.w3schools.com/howto/howto_js_sort_table.asp
// TBS - To Be Sorted
function sortTable(columnIdx) {
    // var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    var table = document.getElementById("tagSummaryTable");
    
    // console.log({rows: table.rows});
    // console.log({rows_type: typeof table.rows});
    console.log(table.rows);
    
    // Copy all non-header rows out of the table into an array
    rowArray = [];
    for (const rowIndex in table.rows) {
      if (Object.hasOwnProperty.call(table.rows, rowIndex)) {
        const row = table.rows[rowIndex];
        // console.log(row.cells[0].tagName);
        if(row.cells[0].tagName === "TD")
          rowArray.push(row)
      }
    }
    
    const labelAsc = "▲"
    const labelDesc = "▼"
    const headerRowIdx = 0;
    const rowsParentNode = table.rows[headerRowIdx].parentNode;
    
    // get sorting label from end of the header being sorted
    const lastHeaderLineIdx = table.rows[headerRowIdx].cells[columnIdx].childNodes.length - 1;
    const lastLineInHeaderTBS= table.rows[headerRowIdx].cells[columnIdx].childNodes[lastHeaderLineIdx].data


    const currentSortingLabel = lastLineInHeaderTBS.substr(-1);
    console.log(table.rows[headerRowIdx].cells[columnIdx].textContent);
    console.log({currentSortingLabel, labelAsc, labelDesc, isAsc: (currentSortingLabel === labelAsc)});

    var sortReturn = 1;
    var nextlabel = labelAsc;
    if (currentSortingLabel === labelAsc) {
      nextlabel = labelDesc; 
      sortReturn = -1;
    }

    const sortDataType = table.rows[headerRowIdx].cells[columnIdx].id;
    console.log({sortDataType});
    //https://stackoverflow.com/questions/282670/easiest-way-to-sort-dom-nodes
    rowArray.sort((rowA, rowB) => {
      // console.log({aid: a.cells[n].id, bid: b.cells[n].id});

      // TODO split id field into a format of "type"
      // TODO revisit and make this sort off of content
      var rowAValue, rowBValue = undefined;
      switch (sortDataType) {
        case "string":
          rowAValue = rowA.cells[columnIdx].id;
          rowBValue = rowB.cells[columnIdx].id;
          break;
        case "number":
          //rowA.cells[columnIdx].childNodes[lastHeaderLineIdx].data
          rowAValue = parseInt(rowA.cells[columnIdx].childNodes[1].childNodes[0].innerText);
          rowBValue = parseInt(rowB.cells[columnIdx].childNodes[1].childNodes[0].innerText);
          // console.log({rowA: rowA.cells[columnIdx].childNodes[1].childNodes[0].innerText, rowB: rowB.cells[columnIdx].childNodes[1].childNodes[0].innerText});
          break;
        default:
          rowAValue = rowA.cells[columnIdx].id;
          rowBValue = rowB.cells[columnIdx].id;
          break;
      }

      if (rowAValue > rowBValue) {
        // console.log("Move:", {aid: a.cells[n].id, bid: b.cells[n].id});
        return sortReturn*1;
      }
      if (rowAValue < rowBValue) {
        return sortReturn*-1;
      }
      // a must be equal to b
      return 0;
    });
    
    console.log({rowArray});
    console.log(table.rows);

    // reorder the nodes on screen by appending the contents of the sorted 
    // array to the node's parent in thier new order
    for (let rowArrayIdx = 0; rowArrayIdx < rowArray.length; rowArrayIdx++) {
      rowsParentNode.appendChild(rowArray[rowArrayIdx]);
    }

    console.log(table.rows[headerRowIdx].cells[columnIdx].childNodes[0].data);
    // var updatedCell

    var newHeaderData = "";
    if (currentSortingLabel === labelAsc || currentSortingLabel === labelDesc ) {
      newHeaderData = lastLineInHeaderTBS.replace(currentSortingLabel, nextlabel);
    }
    else {
      newHeaderData =  lastLineInHeaderTBS + nextlabel
    }
    table.rows[0].cells[columnIdx].childNodes[lastHeaderLineIdx].data = newHeaderData;
    
    console.log({data: table.rows[headerRowIdx].cells[columnIdx].childNodes[lastHeaderLineIdx].data,lastLineInHeaderTBS});
    // console.log({});

    return;

    // switching = true;
    // // Set the sorting direction to ascending:
    // dir = "asc";
    // /* Make a loop that will continue until
    // no switching has been done: */
    // while (switching) {
    //   // Start by saying: no switching is done:
    //   switching = false;
    //   rows = table.rows;
    //   /* Loop through all table rows (except the
    //   first, which contains table headers): */
    //   for (i = 1; i < (rows.length - 1); i++) {
    //     // Start by saying there should be no switching:
    //     shouldSwitch = false;
    //     /* Get the two elements you want to compare,
    //     one from current row and one from the next: */
    //     x = rows[i].getElementsByTagName("TD")[n];
    //     y = rows[i + 1].getElementsByTagName("TD")[n];
    //     /* Check if the two rows should switch place,
    //     based on the direction, asc or desc: */
    //     if (dir == "asc") {
    //       if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
    //         // If so, mark as a switch and break the loop:
    //         shouldSwitch = true;
    //         break;
    //       }
    //     } else if (dir == "desc") {
    //       if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
    //         // If so, mark as a switch and break the loop:
    //         shouldSwitch = true;
    //         break;
    //       }
    //     }
    //   }
    //   if (shouldSwitch) {
    //     /* If a switch has been marked, make the switch
    //     and mark that a switch has been done: */
    //     rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
    //     switching = true;
    //     // Each time a switch is done, increase this count by 1:
    //     switchcount ++;
    //   } else {
    //     /* If no switching has been done AND the direction is "asc",
    //     set the direction to "desc" and run the while loop again. */
    //     if (switchcount == 0 && dir == "asc") {
    //       dir = "desc";
    //       switching = true;
    //     }
    //   }
    // }
}