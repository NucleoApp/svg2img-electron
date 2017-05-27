/*
 * svg2img-electron
 * https://github.com/sharpfuryz/svg2img-electron
 * Licensed under the MIT license.
 */

/*global require:true*/
/*global __dirname:true*/
/*global console:true*/
// ctx.svg2img(tempPath, {'width':rect.width, 'height':rect.height}, (error, buffer) => {

var svg2imgElectron = function (svg, options, callback){
    "use strict";

    var os = require('os');
    var fs = require('fs');
    var path = require('path');

    var fallback = false;
    try{
        var canvas = require('canvas');
        var svg2img = require('svg2img');
        fallback = false;
    }catch (e) {
        console.log('Fallback to slow processing method, cairo not found');
        var electron = require('electron');
        fallback = true;
    }

    var electronFallback = function (svg, options, callback) {
        var BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;
        var url = require('url');
        var win = new BrowserWindow({
            x: 0,
            y: 0,
            width: options.width,
            height: options.height,
            show: false,
            frame: false,
            enableLargerThanScreen: true,
            webPreferences: {
                nodeIntegration: false
            }
        });
        win.once('closed', function () {
           win = null;
        });
        win.loadURL(url.format({
            pathname: svg,
            protocol: 'file:',
            slashes: true
        }));
        win.webContents.once('did-finish-load', function () {
           win.webContents.insertCSS('img { width: '+options.width+'px; height:'+options.height+'px;}');
           setTimeout(function () {
               win.capturePage(function (image) {
                   callback(null, image);
               });
           }, 500);
        });
    };

    if(fallback){
        electronFallback(svg, options, callback);
    }else{
        svg2img(svg, options, callback);
    }
};

exports = module.exports = svg2imgElectron;
