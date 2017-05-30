/*
 * svg2img-electron
 * https://github.com/sharpfuryz/svg2img-electron
 * Licensed under the MIT license.
 */

/*global require:true*/
/*global __dirname:true*/
/*global console:true*/
var os = require('os');
var fs = require('fs');
var path = require('path');
var deepcopy = require('deepcopy');
const cheerio = require('cheerio');

var svg2imgElectron = function (svg, options, callback) {
    "use strict";
    var fallback = false;
    try {
        var canvas = require('canvas');
        //noinspection JSDuplicatedDeclaration
        var svg2img = require('svg2img');
        fallback = false;
    } catch (e) {
        fallback = true;
    }
    // Fallback for tests
    if (Object.hasOwnProperty('fallback')) {
        fallback = options.fallback;
    }

    var isSVGcode = function (svg) {
        var code = svg.toLowerCase();
        return (code.indexOf('<svg xmlns="') > -1);
    };
    var generateUUID = function () {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    };

    var patchCode = function (svg, options) {
        // <svg width = options.width height = options.height viewport = 0 0 options.width options.height
        var $ = cheerio.load(svg, {xmlMode: true});
        var viewport = "0 0 " + options.width + " " + options.height;
        $('svg').attr('width', options.width);
        $('svg').attr('height', options.height);
        $('svg').attr('viewport', viewport);
        return $.xml().toString();
    };
    var saveFileAndProcess = function (svg, options, callback) {
        var os = require('os');
        var path = require('path');

        var tempDir = os.tmpdir();
        var filename = generateUUID();
        var filepath = "" + tempDir + path.sep + filename;

        fs.writeFile(filepath, svg, {encoding: 'utf8'}, function (err) {
            if (err) {
                console.log(err);
            }
            electronProcess(filepath, options, callback);
        });
    };
    var electronProcess = function (svg, options, callback) {
        var url = require('url');
        const electron = require('electron');
        var BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;
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
            win.capturePage(function (image) {
                callback(null, image.toPNG({}));
            });
        });
    };
    var electronFallback = function (svg, options, callback) {
        if((svg.length < 10) || (typeof(svg) === 'undefined') || (svg === null)){
            callback(null,void 0);
        }else{
            var patchedCode = "";
            if (isSVGcode(svg)) {
                patchedCode = patchCode(code, options);
                saveFileAndProcess(patchedCode, options, callback);
            } else {
                fs.readFile(svg, function (err, data) {
                    patchedCode = patchCode(data, options);
                    saveFileAndProcess(patchedCode, options, callback);
                });
            }
        }
    };

    if (fallback) {
        var code = deepcopy(svg);
        electronFallback(code, options, callback);
    } else {
        var svg2img = require('svg2img');
        svg2img(svg, options, callback);
    }
};

exports = module.exports = svg2imgElectron;
