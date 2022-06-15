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
            // TODO make this async
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
    var galleryTags = {};
    for (const key in galleryMetaDataArray) {
        if (Object.hasOwnProperty.call(galleryMetaDataArray, key)) {
            const tags = galleryMetaDataArray[key].tags;
            // logProcessing({gallery: favouritesData[key]});
            for (let tagIndex = 0; tagIndex < tags.length; tagIndex++) {
                var tag = tags[tagIndex];
                var categoryKey = tag.split(":")[0];
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

                const DOMparsedDocument = parser.parseFromString(galleryMetaDataArray[key].title, "text/html");
                // const doubleDOMparsedTitle = parser.parseFromString(DOMparsedTitle, "text/html").body.innerHTML;
                //console.log({tagCount: galleryTags[categoryKey][subCategoryKey]});
                // var encodedTitle = decodeURIComponent(favouritesData[key].title)+"[ ]";
                
                function decodeEntity(inputStr) {
                    var textarea = DOMparsedDocument.createElement("textarea");
                    textarea.innerHTML = inputStr;
                    return textarea.value;
                }
                const HMTLparsedTitle = decodeEntity(DOMparsedDocument.body.innerHTML);
                
                // if (favouritesData[key].gid === 2180213) {
                //     console.log(favouritesData[key].title);
                //     console.log(decodeEntity(favouritesData[key].title));
                //     console.log(HMTLparsedTitle);
                // }
                //console.log(doubleDOMparsedTitle);
                galleryTags[categoryKey][subCategoryKey].push([galleryMetaDataArray[key].gid, galleryMetaDataArray[key].token, HMTLparsedTitle]);

                // if (encodedTitle !== favouritesData[key].title ) {
                //     console.log({encodedTitle, title:favouritesData[key].title});
                // }
                
            }

        }
    }
    

    for (const category in galleryTags) {
        if (Object.hasOwnProperty.call(galleryTags, category)) {
            for (const subcategory in galleryTags[category]) {
                if (Object.hasOwnProperty.call(galleryTags[category], subcategory)) {
                    galleryTags[category][subcategory].sort((a, b) => {
                        // console.log({cat:category + ":" + subcategory, a,b});
                        if (a[2] < b[2]) {
                          return -1;
                        }
                        if (a[2] > b[2]) {
                          return 1;
                        }
                        // a must be equal to b
                        return 0;
                    });
                }
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
                        url: eHentaiTagURLPrefix + category.replace(/\s/g, '+') + ":" + subcategory.replace(/\s/g, '+')
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

    // processingLog.forEach(element => {
    //     try {
    //         fs.writeFileSync(favoritesHTML, element, fsAppendFlag);
    //         // file written successfully
    //     } catch (err) {
    //         console.error(err);
    //     }
    // });

    
    // const tagsHTMLTable = summarizeToHTML(tagArray);
    // const dom = new JSDOM(tagsHTMLTable);
    // const parser = new dom.window.DOMParser();
    // const parsedTagsHTMLTable = parser.parseFromString(tagsHTMLTable,"text/html")
    // var lineToWrite = util.inspect(parsedTagsHTMLTable, {showHidden: false, depth: null, colors: false}) +"\n";

    // var encodedtagsHTMLTable = parsedTagsHTMLTable.querySelector("table").outerHTML
    // console.log(parsedTagsHTMLTable.body.textContent);
    
    var encodedtagsHTMLTable = renderTagTableHTML(tagArray);

    // var serializedString = virtualDocument.childNodes[0].innerHTML

    // console.log({innerHTML: virtualDocument.getElementById("tag_table").innerHTML});
    virtualDocument.getElementById("tag_table").innerHTML = encodedtagsHTMLTable;
    var serializedString2 = virtualDocument.childNodes[0].innerHTML
    fs.writeFileSync(tagSummaryHTML, serializedString2);

    // console.log({innerHTML: virtualDocument.getElementById("tag_table").innerHTML});

    // var bodyStrings = [
    //     // ...processingLog,
    //     "</textarea>",
    //     "</div>", // closes footer
    //     // "<div style='position: fixed; left: 5%; right: 5%; top:0; height: -60px; text-align: center' class='content'>",
    //     "<div id='tag_table' class='xport_info_box' style='position: relative; z-index: 99; vertical-align: top; top:0; bottom:60px; left:0; right: 0;display:inline-block'>",
    //     //  summarizeToHTML(tagArray),
    //     encodedtagsHTMLTable,
    //     "</div>",
    //     "</div>",
    //     "</div>",
    //     "</body>"
    // ];

    // bodyStrings.forEach(element => {
    //     try {
    //         fs.writeFileSync(favoritesHTML, element, fsAppendFlag);
    //         // console.log({element});
    //         // file written successfully
    //     } catch (err) {
    //         console.error(err);
    //     }
    // });

    // console.log({result: virtualDocument.getElementById("log").innerHTML});

    

    // TODO Add logic to serve a website with the results
}

(async function Main() {
    fs.readFile(favouritesFile, 'utf8', processFavourites);
})();