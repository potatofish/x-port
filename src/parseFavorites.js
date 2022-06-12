const fs = require('fs');
const axios = require('axios');
const util = require('util');

const delay = ms => new Promise(res => setTimeout(res, ms));
const favouritesFile = './data/favorites.txt';
// const favouritesFile = './data/favoritesCopy.txt';

const postURL = 'https://api.e-hentai.org/api.php';
const tagURLPrefix = 'https://e-hentai.org/tag/'

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
    // console.log({data});

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
        if ( entryQueryJSON.gidlist.length == 25 || i == (array.length - 1)) {
            console.log("galleries Queued for Lookup: ", entryQueryJSON.gidlist.length);
            
            // TODO Make sure 5 seconds has passed since last API call
            if(completeAPICalls > 0) {
                now = Date.now();
                while(now - entryStartTime < 100) {
                    now = Date.now();
                }
                console.log({entryStartTime, now: new Date(now)});
            }
            
            // TODO Make POST query call to API
            //console.log("POST#%d the following json: ",completeAPICalls,  entryQueryJSON);
            var result = await axios.post(postURL, JSON.stringify(entryQueryJSON))
            //console.log({data: result.data.gmetadata});
            
            // Restart the API cooldown timer immediately after returning
            entryStartTime = new Date(); 
            var galleryMetaDataResult = result.data.gmetadata;
            
            
            galleryMetaDataResult.forEach(element => {
                //console.log({gid: element.gid});
                favouritesData.push(element);
                //console.log(key, galleryMetaDataResult[key]);
            });
            
            completeAPICalls++;
            entryQueryJSON.gidlist = [];
        }
    }

    // Parse API Results

    // Build Tag Index Map
    var galleryTags = {};
    for (const key in favouritesData) {
        if (Object.hasOwnProperty.call(favouritesData, key)) {
            const tags = favouritesData[key].tags;
            for (let tagIndex = 0; tagIndex < tags.length; tagIndex++) {
                var tag = tags[tagIndex];
                var categoryKey = tag.split(":")[0]
                var subCategoryKey = tag.split(":")[1];
                
                // temporary tags have no preceeding colon in the metadata, only on the site
                // hardcoded to fix
                if (typeof subCategoryKey === 'undefined') {
                    subCategoryKey = categoryKey;
                    categoryKey = 'temp';
                }
                

                // create the category object if it does not exist
                if (typeof galleryTags[categoryKey] === 'undefined') {
                    galleryTags[categoryKey] = {};
                    //console.log("NO EXIST");
                } 

                // set the subcategory count if it does not exist
                if (typeof galleryTags[categoryKey][subCategoryKey] === 'undefined') {
                    galleryTags[categoryKey][subCategoryKey] = [];
                    //console.log("NO EXIST");
                } 

                //console.log({tagCount: galleryTags[categoryKey][subCategoryKey]});
                galleryTags[categoryKey][subCategoryKey].push([favouritesData[key].gid, favouritesData[key].token]);

                
            }

        }
    }

    var tagArray= [];
    for (const category in galleryTags) {
        if (Object.hasOwnProperty.call( galleryTags, category)) {
            for (const subcategory in galleryTags[category]) {
                if (Object.hasOwnProperty.call(galleryTags[category], subcategory)) {
                    tagArray.push({
                        category, 
                        subcategory, 
                        galleries: galleryTags[category][subcategory],
                        size: galleryTags[category][subcategory].length,
                        url: tagURLPrefix + category.replace(/\s/g, '+') + ":" + subcategory.replace(/\s/g, '+')
                    });
                }
            }
        }
    }
    tagArray.sort((a, b) => {
        //console.log({a,b});
        if (parseInt(a.size) > parseInt(b.size)) {
          return -1;
        }
        if (parseInt(a.size) < parseInt(b.size)) {
          return 1;
        }
        // a must be equal to b
        return 0;
    });
    tagArray.forEach(tag => {
        console.log(tag);
    });
}

(async function Main() {
    fs.readFile(favouritesFile, 'utf8', processFavourites);
})();