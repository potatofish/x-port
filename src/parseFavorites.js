const fs = require('fs');
const axios = require('axios');
const util = require('util');
const pug = require('pug');

const delay = ms => new Promise(res => setTimeout(res, ms));
// const favouritesFile = './data/favorites.txt';
const favouritesFile = './data/favoritesCopy.txt';
const favoritesHTML = './results.html';


// write a newline to file to clear it
try {
    fs.writeFileSync(favoritesHTML, "\n");
    // file written successfully
} catch (err) {
    console.error(err);
}

var headerStrings = [
    "<head>", 
    "<link rel='stylesheet' href='./resources/stylesheets/style.css'>",
    "</head>",
    "<body style='font-size:8pt;font-family:arial,helvetica,sans-serif;color:#5C0D11;background:#E3E0D1;padding:2px;margin:0;text-align:center'>",
    "<div style='width:100%;text-align:center'>",
    "<textarea class='xport_info_textarea' style='width:80%;display:inline-block'>"
];
const fsAppendFlag = { flag: 'a+' };


headerStrings.forEach(element => {
    try {
        fs.writeFileSync(favoritesHTML, element, fsAppendFlag);
        console.log({element:element});
        // file written successfully
    } catch (err) {
        console.error(err);
    }
});

/*
<div class="xport_info_box">
    <div class="xport_info_header">
        <div class="xport_info_progress_container1">
            <div class="xport_info_progress_container2"><div class="xport_info_progress" style="width: 100%;"></div></div></div><div class="xport_info_header_content"><span class="xport_info_header_title">Exported</span><span class="xport_info_header_status xport_info_header_status_hidden">100%</span></div></div><div class="xport_info_content"><div class="xport_info_content_links"><a class="xport_info_content_link">Hide List</a> | <a class="xport_info_content_link">Copy</a> | <a class="xport_info_content_link">Download</a> | <a class="xport_info_content_link">Omit Titles</a> | <span class="xport_info_content_text">Total: 548</span></div></div><div class="xport_info_textarea_container"><div class="xport_info_textarea_line_container"><div class="xport_info_textarea_line"></div></div><textarea class="xport_info_textarea" spellcheck="false" placeholder=""></textarea></div><textarea class="xport_hidden_textarea" style="display: none;"></textarea></div>
*/



const pugSourceFile = './resources/pugSource/parseFavorites.pug';
const summarizeToHTML = pug.compileFile(pugSourceFile);

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
    var processingLog = [];

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
            processingLog.push("galleries Queued for Lookup: " + entryQueryJSON.gidlist.length);
            
            // TODO Make sure 5 seconds has passed since last API call
            if(completeAPICalls > 0) {
                now = Date.now();
                while(now - entryStartTime < 100) {
                    now = Date.now();
                }
                processingLog.push({entryStartTime, now: new Date(now)});
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
            // processingLog.push({RAW: favouritesData[key]});
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

                //console.log({tagCount: galleryTags[categoryKey][subCategoryKey]});
                galleryTags[categoryKey][subCategoryKey].push([favouritesData[key].gid, favouritesData[key].token, favouritesData[key].title]);

                
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
    // tagArray.forEach(tag => {
    //     //table(style='width:100%', border='1')
    //     //console.log(pug.render("table(style='width:100%', border='1')"));
    //     console.log(summarizeToHTML(tag));
    // });
    // https://codepen.io/yoanmarchal/pen/qXojEM
    // console.log({processingLog});
    processingLog.forEach(element => {
        try {
            fs.writeFileSync(favoritesHTML, element, fsAppendFlag);
            // file written successfully
        } catch (err) {
            console.error(err);
        }
    });

    
    var bodyStrings = [
        // ...processingLog,
        "</textarea>",
        "<div id='tag_table' class='xport_info_box' style='width:1005'>",
         summarizeToHTML(tagArray),
        "</div>",
        "</div>",
        "</body>"
    ];
    // console.log({bodyStrings});

    bodyStrings.forEach(element => {
        try {
            fs.writeFileSync(favoritesHTML, element, fsAppendFlag);
            // console.log({element});
            // file written successfully
        } catch (err) {
            console.error(err);
        }
    });
    

    // TODO Add logic to serve a website with the results
}

(async function Main() {
    fs.readFile(favouritesFile, 'utf8', processFavourites);
})();