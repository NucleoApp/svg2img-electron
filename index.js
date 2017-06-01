/*
 * svg2img-electron
 * https://github.com/sharpfuryz/svg2img-electron
 * Licensed under the MIT license.
 */
const url = require('url');
const electron = require('electron');
var BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;
/*global require:true*/
/*global __dirname:true*/
/*global console:true*/
var svg2imgElectron = function (svg, options) {
    var os = require('os');
    var fs = require('fs');
    var path = require('path');

    "use strict";

    var electronProcess = function (code, options) {
        return new Promise(function (resolve) {
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
                pathname: path.resolve(__dirname,'page.html'),
                protocol: 'file:',
                slashes: true
            }));
            win.webContents.once('did-finish-load', function () {
                win.webContents.executeJavaScript('convert("'+code+'")').then(function(string){
                    var regex = /^data:.+\/(.+);base64,(.*)$/;
                    var matches = string.match(regex);
                    var data = matches[2];
                    var buffer = new Buffer(data, 'base64');
                    resolve(buffer);
                    win.close();
                });
            });
        });
    };

    return new Promise(function (resolve) {
        if((svg.length < 10) || (typeof(svg) === 'undefined') || (svg === null)){
            resolve(null,void 0);
        }else{
            fs.lstat(svg, function (err, stats){
                if(err){
                    resolve(null, void 0);
                }
                if(stats){
                    if(stats.isFile()){
                        fs.readFile(svg, function (err, data) {
                            if(err){
                                resolve(null);
                            }
                            electronProcess(data, options).then(function (res) {
                                resolve(res);
                            });
                        });
                    }else{
                        electronProcess(svg, options).then(function (data) {
                            resolve(data);
                        });
                    }
                }else{
                    electronProcess(svg, options).then(function (data) {
                        resolve(data);
                    });
                }
            });
        }
    });

};

exports = module.exports = svg2imgElectron;
