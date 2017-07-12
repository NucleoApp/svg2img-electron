/*
 * svg2img-electron
 * https://github.com/sharpfuryz/svg2img-electron
 * Licensed under the MIT license.
 */
/*global require:true*/
/*global __dirname:true*/
/*global console:true*/
var winOne = null;
var winTwo = null;
var windowOneBusy = false;
var windowTwoBusy = false;

var svg2imgElectron = function (svg, options) {
    const url = require('url');
    const electron = require('electron');
    const ipcMain = electron.ipcMain;
    const os = require('os');
    const fs = require('fs');
    const path = require('path');
    const BrowserWindow = electron.BrowserWindow;
    return new Promise(function (resolve) {

        "use strict";

        var putWindowTwo = function(code, options){
            if(winTwo === null){
                winTwo = new BrowserWindow({
                    x: 0,
                    y: 0,
                    width: options.width,
                    height: options.height,
                    show: false,
                    frame: false,
                    enableLargerThanScreen: true
                });
                winTwo.once('closed', function () {
                    winTwo = null;
                });
                winTwo.loadURL(url.format({
                    pathname: path.resolve(__dirname,'page.html'),
                    protocol: 'file:',
                    slashes: true
                }));
                winTwo.webContents.on('did-finish-load', function () {
                    if(options.format === "potrace"){
                        winTwo.webContents.send('potrace', code, 2);
                    }else{
                        winTwo.webContents.send('svg', code, options.width, options.height, options.format, 2);
                    }
                });
            }else{
                winTwo.setSize(options.width, options.height);
                if(options.format === "potrace"){
                    winTwo.webContents.send('potrace', code, 2);
                }else{
                    winTwo.webContents.send('svg', code, options.width, options.height, options.format, 2);
                }
            }
        };
        var putWindowOne = function(code, options) {
            if(winOne === null){
                winOne = new BrowserWindow({
                    x: 0,
                    y: 0,
                    width: options.width,
                    height: options.height,
                    show: false,
                    frame: false,
                    enableLargerThanScreen: true
                });
                winOne.once('closed', function () {
                    winOne = null;
                });
                winOne.loadURL(url.format({
                    pathname: path.resolve(__dirname,'page.html'),
                    protocol: 'file:',
                    slashes: true
                }));
                winOne.webContents.on('did-finish-load', function () {
                    if(options.format === "potrace"){
                        winOne.webContents.send('potrace', code, 1);
                    }else{
                        winOne.webContents.send('svg', code, options.width, options.height, options.format, 1);
                    }
                });
            }else{
                winOne.setSize(options.width, options.height);
                if(options.format === "potrace"){
                    winOne.webContents.send('potrace', code, 1);
                }else{
                    winOne.webContents.send('svg', code, options.width, options.height, options.format, 1);
                }
            }
        };

        var electronProcess = function (code, options) {
            if(typeof(options.format) === "undefined"){
                options.format = 'image/png';
            }
            if(windowOneBusy){
                windowTwoBusy = true;
                putWindowTwo(code,options);
            }else{
                windowOneBusy = true;
                putWindowOne(code, options);
            }
            ipcMain.once('potrace', function(event, string, winId){
                if(winId == 1){
                    windowOneBusy = false;
                }else{
                    windowTwoBusy = false;
                }
                resolve(string);
            });
            ipcMain.once('svg', function(event, string, winId) {
                var regex = /^data:.+\/(.+);base64,(.*)$/;
                var matches = string.match(regex);
                var data = matches[2];
                var buffer = new Buffer(data, 'base64');
                if(winId == 1){
                    windowOneBusy = false;
                }else{
                    windowTwoBusy = false;
                }
                resolve(buffer);
            });

        };

        if((svg.toLowerCase().indexOf('<svg') > -1) || (svg === "") || (options.format === "potrace")){
            electronProcess(svg, options);
        }else{
            fs.lstat(svg, function (err, stats){
                if(err){
                    console.log(err);
                }
                if(stats){
                    if(stats.isFile()){
                        fs.readFile(svg, function (IOerr, data) {
                            if(IOerr){
                                resolve(null);
                            }
                            electronProcess(data, options);
                        });
                    }else{
                        electronProcess(svg, options);
                    }
                }else{
                    electronProcess(svg, options);
                }
            });
        }
    });
};

exports = module.exports = svg2imgElectron;
