const fs = require('fs');
const axios = require('axios');
const util = require('util');
const pug = require('pug');
const jsdom = require("jsdom");
const Chart = require('chart.js');
const { JSDOM } = jsdom;
const dom = new JSDOM();
const parser = new dom.window.DOMParser();

// const fsAppendFlag = { flag: 'a+' };


const favouritesFile = './data/favorites.txt';
// const favouritesFile = './data/favoritesCopy.txt';
const tagSummaryHTML = './tagSummary.html';

const tagMainConfigFile = './resources/pugSource/tagSummaryMain.pug';
const renderMainTableHTML = pug.compileFile(tagMainConfigFile);

const tagTableConfigFile = './resources/pugSource/tagSummaryTable.pug';
const renderTagTableHTML = pug.compileFile(tagTableConfigFile);


const eHentaiAPIURL = 'https://api.e-hentai.org/api.php';
const eHentaiTagURLPrefix = 'https://e-hentai.org/tag/'
const eHentaiGalleryURLPrefix = 'https://e-hentai.org/g/';

var apiQueryJSON = {
    "method": "gdata",
    "gidlist": [],
    "namespace": 1
};
const apiGidlistMax = 25;
const apiIntervalMS = 100;

const virtualDocument = parser.parseFromString(renderMainTableHTML(),"text/html");

function logProcessing(aStringToLog) {
    try {
        var lineToWrite = util.inspect(aStringToLog, {showHidden: false, depth: null, colors: false}) +"\n";
        virtualDocument.getElementById("log").innerHTML += lineToWrite;
        var serializedString = virtualDocument.childNodes[0].innerHTML
        fs.writeFileSync(tagSummaryHTML, serializedString);
        // file written successfully
    } catch (err) {
        console.error(err);
    }
}

function decodeEntity(inputStr) {
    // console.log(inputStr);
    var textarea = virtualDocument.createElement("textarea");
    textarea.innerHTML = inputStr;
    return textarea.value;
}

const CATEGORY_TEMP = 'temp';
async function processFavourites(err, data) {
    if (err) {
        console.error(err);
        return;
    }

    var apiCallStartTime = undefined;
    var galleryMetaDataArray = [];
    var lines = data.split("\r\n")

    for(i in lines) {
        var galleryURL = lines[i];
        var galleryURLSuffix = galleryURL.replace(eHentaiGalleryURLPrefix, '');

        var gallery = {
            id: parseInt(galleryURLSuffix.split("/")[0]),
            token: galleryURLSuffix.split("/")[1]
        }
       
        var entryGalleryID = parseInt(galleryURLSuffix.split("/")[0]);
        var entryGalleryToken = galleryURLSuffix.split("/")[1];

        var gidlistEntry = [gallery.id, gallery.token]
        apiQueryJSON.gidlist.push([...gidlistEntry]);
        
        // Make API calls when the limit of gallery-ids is met or 
        // when no lines are live
        if (apiQueryJSON.gidlist.length == apiGidlistMax || i == (lines.length - 1)) {
            
            // Ensure interval mseconds have passed since the last API call (if any)
            // looping until otherwise
            if (typeof apiCallStartTime === "undefined") {
                apiCallStartTime = Date.now();
            }
            else {
                var now = Date.now();
                while(now - apiCallStartTime < apiIntervalMS) {
                    now = Date.now();
                }
                apiCallStartTime = now;
            }
            var apiCallStartTimeReadable = new Date(apiCallStartTime)
            logProcessing(apiQueryJSON.gidlist.length + " Galleries Queued for Lookup @ " + apiCallStartTimeReadable);
            
            // Wait for url to return results, then push the contained metadata onto the array
            var result = await axios.post(eHentaiAPIURL, JSON.stringify(apiQueryJSON))
            var galleryMetaDataResult = result.data.gmetadata;

            for (const key in galleryMetaDataResult) {
                if (Object.hasOwnProperty.call(galleryMetaDataResult, key)) {
                    const galleryData = galleryMetaDataResult[key];
                    galleryMetaDataArray.push(galleryData);
                }
            }
            
            // clear the list of galleries to look up for next loop
            apiQueryJSON.gidlist = [];
        }
    }

    // Parse API Results

    // Build Tag Index Map
    var galleriesByTags = {};
    for (const key in galleryMetaDataArray) {
        if (Object.hasOwnProperty.call(galleryMetaDataArray, key)) {
            const tags = galleryMetaDataArray[key].tags;
            // logProcessing({gallery: favouritesData[key]});
            for (let tagIndex = 0; tagIndex < tags.length; tagIndex++) {
                var tag = tags[tagIndex];
                var category = tag.split(":")[0];
                var subcategory = tag.split(":")[1];
                
                // temporary tags are rendered as "temp:<tag>" but 
                // have no preceeding colon in the metadata and
                // require hardcoding to fix
                if (typeof subcategory === 'undefined') {
                    subcategory = category;
                    category = CATEGORY_TEMP;
                }
                

                // initialize gallery arrays if thier indexes have
                // yet to be defined
                switch ('undefined') {
                    case typeof galleriesByTags[category]:
                        galleriesByTags[category] = {};
                    case  typeof galleriesByTags[category][subcategory]:
                        galleriesByTags[category][subcategory] = [];
                }

                const HMTLparsedTitle = decodeEntity(galleryMetaDataArray[key].title);
                galleriesByTags[category][subcategory].push([galleryMetaDataArray[key].gid, galleryMetaDataArray[key].token, HMTLparsedTitle]);
            }

        }
    }
    
    
    const titleIdx = 2;
    var tagSummaryTableData= [];
    for (const category in galleriesByTags) {
        if (Object.hasOwnProperty.call(galleriesByTags, category)) {
            for (const subcategory in galleriesByTags[category]) {
                if (Object.hasOwnProperty.call(galleriesByTags[category], subcategory)) {

                    // sort each array of galleries stored for each category/subcategory combination based on Title
                    galleriesByTags[category][subcategory].sort((a, b) => {
                        // console.log({category, subcategory, titleIdx, titles: {a: a[titleIdx], b: b[titleIdx]}});
                        switch (true) {
                            case (a[titleIdx] < b[titleIdx]):
                                return -1;
                            case (a[titleIdx] > b[titleIdx]):
                                return 1;
                            default: // a must be equal to b
                                return 0;
                        }
                    });

                    // put each combination & their galleries into an array for HTML rendering input
                    tagSummaryTableData.push({
                        category, 
                        subcategory, 
                        galleries: galleriesByTags[category][subcategory],
                        count: galleriesByTags[category][subcategory].length,
                        url: eHentaiTagURLPrefix + category.replace(/\s/g, '+') + ":" + subcategory.replace(/\s/g, '+')
                    });
                }
            }
        }
    }

    // Sort Data on category/subcategory combination with the largest count descending
    tagSummaryTableData.sort((a, b) => {
        // console.log({count:{a: a.count, b: b.count}});
        switch (true) {
            case (parseInt(a.count) > parseInt(b.count)):
                return -1;
            case (parseInt(a.count) < parseInt(b.count)):
                return 1;
            default: // a must be equal to b
                return 0;
        }
    });
    
    var tagSummaryTableHTML = renderTagTableHTML(tagSummaryTableData);
    // console.log({tagSummaryTableHTML});
    const tagSummaryTableId = "tag_table";
    virtualDocument.getElementById(tagSummaryTableId).innerHTML = tagSummaryTableHTML;

    fs.writeFileSync(tagSummaryHTML, virtualDocument.childNodes[0].innerHTML);


    // TODO Add logic to serve a website with the results
}

(async function Main() {
    fs.readFile(favouritesFile, 'utf8', processFavourites);
})();