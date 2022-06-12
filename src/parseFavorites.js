const fs = require('fs');

const favouritesFile = './data/favorites.txt';
fs.readFile(favouritesFile, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    var entryQueryJSON = {
        "method": "gdata",
        "gidlist": [],
        "namespace": 1
    }

    var countAPICalls = 0;

    var array = data.split("\r\n")
    for(i in array) {
        var entry = array[i];
        var entryVariables = entry.replace('https://e-hentai.org/g/', '');
        var entryVariableArray =  entryVariables.split("/");
        var entryGalleryID = parseInt(entryVariables.split("/")[0]);
        var entryGalleryToken = entryVariables.split("/")[1];
        var gidlistArrayElement = [entryGalleryID, entryGalleryToken]
        entryQueryJSON.gidlist.push([...gidlistArrayElement]);
        if ( entryQueryJSON.gidlist.length == 25) {
            countAPICalls++;
            //console.log("galleries Queued for Lookup: ", entryQueryJSON.gidlist.length);
            console.log("POST#%d the following json: ",countAPICalls,  entryQueryJSON);

            // TODO Make sure 5 seconds has passed since last API call

            // TODO Make POST query call to API

            // TODO Store API Results in a larger data struture for future parsing

            // Clear list of gallery ids for next query
            entryQueryJSON.gidlist = [];
        }
    }

    // TODO Parse API Results
});