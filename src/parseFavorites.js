const fs = require('fs');
const axios = require('axios');

const delay = ms => new Promise(res => setTimeout(res, ms));

const favouritesFile = './data/favorites.txt';
const postURL = 'https://api.e-hentai.org/api.php';

async function processFavourites(err, data) {
    if (err) {
        console.error(err);
        return;
    }

    var entryQueryJSON = {
        "method": "gdata",
        "gidlist": [],
        "namespace": 1
    }

    //    var startTime = new Date();
    //    console.log({startTime});

    var completeAPICalls = 0;
    var entryStartTime = new Date();
    var now = entryStartTime;
    var favouritesData = [];

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
            //console.log("galleries Queued for Lookup: ", entryQueryJSON.gidlist.length);
            
            // TODO Make sure 5 seconds has passed since last API call
            if(completeAPICalls > 0) {
                now = Date.now();
                while(now - entryStartTime < 500) {
                    now = Date.now();
                }
                console.log({entryStartTime, now: new Date(now)});
            }
            
            // TODO Make POST query call to API
            //console.log("POST#%d the following json: ",completeAPICalls,  entryQueryJSON);
            var result = await axios.post(postURL, JSON.stringify(entryQueryJSON))
            //console.log({data: result.data.gmetadata});
            var galleryMetaDataResult = result.data.gmetadata;
            
            // TODO Parse API Results
            
            galleryMetaDataResult.forEach(element => {
                //console.log({gid: element.gid});
                favouritesData.push(element);
                //console.log(key, galleryMetaDataResult[key]);
              });
            
            completeAPICalls++;
            entryQueryJSON.gidlist = [];
            entryStartTime = new Date();
        }
    }
    console.log({favouritesData});

}

(async function Main() {
    fs.readFile(favouritesFile, 'utf8', processFavourites);
})();