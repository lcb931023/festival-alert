"use strict";
console.log("Festivals! Oh joy!");
var fs = require("fs");
var webpage = require("webpage");
var system = require("system");

var dates = [];

var SITES = [
  { name: "Future Fires", url: "https://www.futurefires.com/" },
  { name: "OFFF Festival", url: "http://offf.barcelona" },
  { name: "Resonate", url: "http://resonate.io/2017/" },
  { name: "Gray Area Festival", url: "http://grayareafestival.io/" },
  { name: "Signal Festival", url: "https://www.signalfestival.com/en/" },
  { name: "Eyeo Festival", url: "http://eyeofestival.com/" },
  { name: "Mutek", url: "http://www.mutek.org/en/" },
  { name: "Node", url: "https://nodeforum.org/" },
  { name: "Digital Design Days", url: "http://www.ddd.it/en" },
  { name: "CODAME Art + Tech", url: "http://codame.com/" },
  { name: "NextArt Night", url: "https://nextart.tech/" },
  { name: "3D Web Fest", url: "http://www.3dwebfest.com/" },
  { name: "Technarte", url: "http://www.technarte.org/" }
];

dates = SITES.map(function(site) {
  return { name: site.name, dates: "" };
});

var MONTHS = [
  "January",
  "JANUARY",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

var getFileName = function(siteIndex, siteName) {
  return (
    "output/screenshot/" +
    siteIndex +
    "-" +
    siteName.replace(/ /g, "-") +
    ".png"
  );
};
var loadDelay = 1000;
var resourceTimeout = 5000;
var onResourceTimeout = function(e) {
  console.log("Error" + e.errorCode + ": " + e.errorString + " - " + e.url);
};

var modifySelector = function() {
  $.expr[":"].contains = $.expr.createPseudo(function(arg) {
    return function(elem) {
      return (
        $(elem)
          .text()
          .toUpperCase()
          .indexOf(arg.toUpperCase()) >= 0
      );
    };
  });
};

var searchForDates = function(month) {
  var innerTexts = [];
  var matchedElements = $(
    ":contains('" + month + "'):not(:has(:contains('" + month + "')))"
  );
  innerTexts = matchedElements.toArray().map(function(el) {
    return el.innerText;
  });
  return innerTexts;
};

var doMagic = function(sites, callbackPerSite, callbackFinal) {
  var next, page, retrieve, siteIndex, webpage;
  siteIndex = 0;
  webpage = require("webpage");
  page = null;
  next = function(status, url, name) {
    page.close();
    callbackPerSite(status, url, name);
    return retrieve();
  };
  retrieve = function() {
    var site, siteName, siteUrl;
    if (sites.length > 0) {
      site = sites.shift();
      siteName = site.name;
      siteUrl = site.url;
      siteIndex++;
      page = webpage.create();
      page.settings.resourceTimeout = resourceTimeout;
      page.onResourceTimeout = onResourceTimeout;
      page.viewportSize = {
        width: 1280,
        height: 7200
      };
      page.clipRect = { top: 0, left: 0, width: 1280, height: 720 };
      // page.settings.userAgent = "Phantom.js bot";
      return page.open(siteUrl, function(status) {
        if (status === "success") {
          page.includeJs(
            "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"
          );
          return window.setTimeout(function() {
            // do yo thing
            page.evaluate(modifySelector);
            var pageDates = "";
            for (var monthI = 0; monthI < MONTHS.length; monthI++) {
              var result = page.evaluate(searchForDates, MONTHS[monthI]);
              if (!result || result.length !== 0)
                pageDates = pageDates + "\r\n" + result.join(", ");
            }
            console.log(pageDates);
            dates[siteIndex - 1].dates = pageDates;

            // screencap
            page.render(getFileName(siteIndex, siteName));
            return next(status, siteUrl, siteName);
          }, loadDelay);
        } else {
          return next(status, siteUrl, siteName);
        }
      });
    } else {
      return callbackFinal();
    }
  };
  return retrieve();
};

var logger = function(status, url, name) {
  if (status !== "success") {
    return console.log("Unable to render '" + url + "'");
  } else {
    return console.log("Rendered " + name + " " + url);
  }
};

var onExit = function() {
  console.log("that's all! Printing dates below.");
  var justDates = dates.map(function(el) {
    return el.name + "\r\n======\r\n" + el.dates;
  });
  console.log(justDates.join("\r\n\r\n"));
  fs.write("output/scrapeDate.txt", justDates.join("\r\n\r\n"));
  return phantom.exit();
};

doMagic(SITES, logger, onExit);
