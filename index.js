/*
 * svg2img-electron
 * https://github.com/sharpfuryz/svg2img-electron
 * Licensed under the MIT license.
 */

/*global require:true*/
/*global __dirname:true*/
/*global console:true*/

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
        var electron = require('electron');
        fallback = true;
    }
    // Fallback for tests
    if(Object.hasOwnProperty('fallback')){
        fallback = options.fallback;
    }

    var isSVGcode = function (svg) {
      var code = svg.toLowerCase();
      return (code.indexOf('<svg xmlns="') > -1);
    };
    var generateUUID = function(){
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    };
    var saveSVGCode = function (code) {
        var os = require('os');
        var path = require('path');

        var tempDir = os.tmpdir();
        var filename = generateUUID();
        var filepath = "" + tempDir + path.sep + filename;

        fs.writeFileSync(filepath, svg, {encoding: 'utf8'}, function (err) {
            return filepath;
        });
    };
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
                   callback(null, image.toPNG({}));
               });
           }, 500);
        });
    };

    if(fallback){
        if(isSVGcode(svg)){
            var filepath = saveSVGCode(svg);
            electronFallback(filepath, options, callback);
        }else{
            electronFallback(svg, options, callback);
        }
    }else{
        svg2img(svg, options, callback);
    }
};

exports = module.exports = svg2imgElectron;
