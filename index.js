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
    const fs = require('graceful-fs');
    const path = require('path');
    const BrowserWindow = electron.BrowserWindow;

    var getAction = function(options) {
        if((typeof(options.format) === "undefined")){
            options.format = 'image/png';
            return 'rasterization';
        }else{
            if(options.format.indexOf('image') > -1){
                return 'rasterization';
            }else{
                return options.format;
            }
        }
    };
    var getWindowOne = function(options) {
        return new Promise((resolve)=>{
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
                    resolve(winOne);
                });
            }else{
                winOne.setSize(options.width, options.height);
                resolve(winOne);
            }
        });
    };
    var getWindowTwo = function(options) {
        return new Promise((resolve)=>{
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
                // winTwo.openDevTools();
                winTwo.once('closed', function () {
                    winTwo = null;
                });
                winTwo.loadURL(url.format({
                    pathname: path.resolve(__dirname,'page2.html'),
                    protocol: 'file:',
                    slashes: true
                }));
                winTwo.webContents.on('did-finish-load', function () {
                    resolve(winTwo);
                });
            }else{
                winTwo.setSize(options.width, options.height);
                resolve(winTwo);
            }
        });
    };
    var getWindow = function(options){
        return new Promise((resolve)=>{
            if(windowOneBusy == true){
                if(windowTwoBusy == false){
                    windowTwoBusy = true;
                    getWindowTwo(options).then((window)=>{
                        resolve(window)
                    });
                }else{
                }
            }else{
                if(windowOneBusy == true){
                }else{
                    windowOneBusy = true;
                    getWindowOne(options).then((window)=>{
                        resolve(window)
                    });
                }
            }
        });
    };

    var checkCode = function(input_code) {
        return new Promise((resolve)=>{
            if((input_code.toLowerCase().indexOf('<svg') > -1) || (input_code === "")){
                resolve(input_code);
            }else{
                fs.lstat(input_code, function (err, stats){
                    if(err){
                        console.log(err);
                        resolve("");
                    }
                    if(stats){
                        if(stats.isFile()){
                            fs.readFile(input_code, function (IOerr, data) {
                                if(IOerr){
                                    resolve("");
                                }
                                resolve(input_code);
                            });
                        }else{
                            resolve(input_code);
                        }
                    }else{
                        resolve(input_code);
                    }
                });
            }
        })
    };

    return new Promise((c_resolve) => {
        var action = getAction(options);
        var code = svg;
        var invoke = function(action, code){
            var uuid = Math.round(Math.random() * 1000);
            return new Promise((resolve)=>{
                getWindow(options).then((window)=>{
                    if(action === 'svg' || action === "rasterization"){
                        checkCode(code).then((code)=>{
                            window.webContents.send('svg', code, options.width, options.height, options.format, uuid);
                            ipcMain.once('svg'+uuid, (event, string, winId)=>{
                                if(winId === 1){
                                    windowOneBusy = false;
                                }else{
                                    windowTwoBusy = false;
                                }
                                var regex = /^data:.+\/(.+);base64,(.*)$/;
                                var matches = string.match(regex);
                                var data = matches[2];
                                var buffer = new Buffer(data, 'base64');
                                resolve(buffer);
                            });
                        });
                    }
                    if(action === 'potrace'){
                        var evName = 'potrace'+uuid;
                        window.webContents.send('potrace', code, uuid);
                        ipcMain.once(evName, (event, string, winId)=>{
                            if(winId === 1){
                                windowOneBusy = false;
                            }else{
                                windowTwoBusy = false;
                            }
                            resolve(string);
                        });
                    }

                });
            })
        }
        if(action === 'full_potrace'){
            var temp = (options.tmpdir || os.tmpdir()) + path.sep + Math.round(Math.random() * 10000) + '.png';
            invoke('svg', svg).then((buffer)=>{
                fs.writeFile(temp, buffer, (err)=>{
                   invoke('potrace', temp).then((data)=>{
                       c_resolve(data);
                   })
                });
            });
        }else{
            invoke(action, svg).then((r)=>{
                c_resolve(r);
            });
        }
    });
};

exports = module.exports = svg2imgElectron;
