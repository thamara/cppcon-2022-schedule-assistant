'use strict';

chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    console.log(details.url);
    if (details.url.match(/https:\/\/boardgamearena.com\/gamepanel\?game=*/)) {
        chrome.tabs.insertCSS(null, { file: "styles.css" });
        chrome.tabs.executeScript(null, { file: "content.js" });
    }
});