/*
 * svg2img-electron
 * https://github.com/sharpfuryz/svg2img-electron
 * Licensed under the MIT license.
 */
const url = require('url');
const electron = require('electron');
const ipcMain = electron.ipcMain;
var BrowserWindow = electron.BrowserWindow;// || electron.remote.BrowserWindow;
/*global require:true*/
/*global __dirname:true*/
/*global console:true*/
var svg2imgElectron = function (svg, options) {
    return new Promise(function (resolve) {
        var os = require('os');
        var fs = require('fs');
        var path = require('path');

        "use strict";

        var electronProcess = function (code, options) {
            var win = new BrowserWindow({
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
            win.webContents.once('did-finish-load', function () {
                win.webContents.send('svg', code, options.width, options.height);
            });
            ipcMain.once('svg', function(event, string) {
                var regex = /^data:.+\/(.+);base64,(.*)$/;
                var matches = string.match(regex);
                var data = matches[2];
                var buffer = new Buffer(data, 'base64');
                win.close();
                resolve(buffer);
            });
        };

        if(svg.toLowerCase().indexOf('<svg') > -1){
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
