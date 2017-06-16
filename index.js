/*
 * svg2img-electron
 * https://github.com/sharpfuryz/svg2img-electron
 * Licensed under the MIT license.
 */
/*global require:true*/
/*global __dirname:true*/
/*global console:true*/
var win = null;
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

        var electronProcess = function (code, options) {
            if(typeof(options.format) === "undefined"){
                options.format = 'image/png';
            }
            if(win === null){
                win = new BrowserWindow({
                    x: 0,
                    y: 0,
                    width: options.width,
                    height: options.height,
                    show: false,
                    frame: false,
                    enableLargerThanScreen: true
                });
                win.once('closed', function () {
                    win = null;
                });
                win.loadURL(url.format({
                    pathname: path.resolve(__dirname,'page.html'),
                    protocol: 'file:',
                    slashes: true
                }));
                win.webContents.on('did-finish-load', function () {
                    if(options.format === "potrace"){
                        win.webContents.send('potrace', code);
                    }else{
                        win.webContents.send('svg', code, options.width, options.height, options.format);
                    }
                });
            }else{
                win.setSize(options.width, options.height);
                if(options.format === "potrace"){
                    win.webContents.send('potrace', code);
                }else{
                    win.webContents.send('svg', code, options.width, options.height, options.format);
                }
            }
            ipcMain.once('potrace', function(event, string){
                resolve(string);
            });
            ipcMain.once('svg', function(event, string) {
                var regex = /^data:.+\/(.+);base64,(.*)$/;
                var matches = string.match(regex);
                var data = matches[2];
                var buffer = new Buffer(data, 'base64');
                // win.close();
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
