
/*
 * svg2img-electron
 * https://github.com/sharpfuryz/svg2img-electron
 * Licensed under the MIT license.
 */


/*global require:true */


/*global __dirname:true */


/*global console:true */

(function() {
  var BrowserWindow, electron, exports, path, svg2imgElectron, url, windowManager;

  global.winOne = null;

  global.winTwo = null;

  global.windowOneBusy = false;

  global.windowTwoBusy = false;

  url = require('url');

  path = require('path');

  electron = require('electron');

  BrowserWindow = electron.BrowserWindow;

  windowManager = {
    getWindowOne: function(options) {
      return new Promise(function(resolve) {
        if (global.winOne === null) {
          global.winOne = new BrowserWindow({
            x: 0,
            y: 0,
            width: options.width,
            height: options.height,
            show: false,
            frame: false,
            enableLargerThanScreen: true
          });
          global.winOne.once('closed', function() {
            global.winOne = null;
          });
          global.winOne.loadURL(url.format({
            pathname: path.resolve(__dirname, 'page.html'),
            protocol: 'file:',
            slashes: true
          }));
          global.winOne.webContents.on('did-finish-load', function() {
            resolve(winOne);
          });
        } else {
          global.winOne.setSize(options.width, options.height);
          resolve(winOne);
        }
      });
    },
    getWindowTwo: function(options) {
      return new Promise(function(resolve) {
        if (global.winTwo === null) {
          global.winTwo = new BrowserWindow({
            x: 0,
            y: 0,
            width: options.width,
            height: options.height,
            show: false,
            frame: false,
            enableLargerThanScreen: true
          });
          global.winTwo.once('closed', function() {
            global.winTwo = null;
          });
          global.winTwo.loadURL(url.format({
            pathname: path.resolve(__dirname, 'page2.html'),
            protocol: 'file:',
            slashes: true
          }));
          global.winTwo.webContents.on('did-finish-load', function() {
            resolve(winTwo);
          });
        } else {
          global.winTwo.setSize(options.width, options.height);
          resolve(winTwo);
        }
      });
    },
    killWindow: function(winId) {
      if (winId === global.winOne.id) {
        global.winOne.close();
        return global.windowOneBusy = false;
      } else {
        global.winTwo.close();
        return global.windowTwoBusy = false;
      }
    },
    killAllWindows: function() {
      global.winOne.close();
      global.windowOneBusy = false;
      global.winTwo.close();
      return global.windowTwoBusy = false;
    },
    getWindow: function(options) {
      var ctx;
      ctx = this;
      return new Promise(function(resolve) {
        if (global.windowOneBusy) {
          global.windowTwoBusy = true;
          ctx.getWindowTwo(options).then(function(window) {
            resolve(window);
          });
        } else {
          global.windowOneBusy = true;
          ctx.getWindowOne(options).then(function(window) {
            resolve(window);
          });
        }
      });
    },
    releaseWindow: function(winId) {
      if (winId === 1) {
        return global.windowOneBusy = false;
      } else {
        return global.windowTwoBusy = false;
      }
    }
  };

  svg2imgElectron = function(svg, options) {
    var checkCode, formBase64, fs, getAction, getUUID, invokePotrace, invokeSVG, ipcMain, os;
    electron = require('electron');
    ipcMain = electron.ipcMain;
    os = require('os');
    fs = require('graceful-fs');
    checkCode = require('./checkCode');
    formBase64 = function(string) {
      var buffer, data, matches, regex;
      regex = /^data:.+\/(.+);base64,(.*)$/;
      matches = string.match(regex);
      data = matches[2];
      buffer = new Buffer(data, 'base64');
      return buffer;
    };
    getAction = function(options) {
      if (typeof options.format === 'undefined') {
        options.format = 'image/png';
        return 'rasterization';
      } else {
        if (options.format.indexOf('image') > -1) {
          return 'rasterization';
        } else {
          return options.format;
        }
      }
    };
    getUUID = function() {
      return Math.round(Math.random() * 1000);
    };
    invokeSVG = function(svg, options) {
      return new Promise(function(resolve) {
        return windowManager.getWindow(options).then(function(window) {
          return checkCode(svg).then(function(code) {
            var uuid;
            uuid = getUUID();
            window.webContents.send('svg', code, options.width, options.height, options.format, uuid);
            return ipcMain.once('svg' + uuid, function(event, string, winId) {
              windowManager.releaseWindow(winId);
              return resolve(formBase64(string));
            });
          });
        });
      });
    };
    invokePotrace = function(code, options, step) {
      if (step == null) {
        step = 1;
      }
      return new Promise(function(resolve) {
        if (step > 3) {
          console.log('Icon' + code + 'broken, exiting upon 3 attemps');
          resolve('');
        }
        return windowManager.getWindow(options).then(function(window) {
          var evName, timer, uuid;
          uuid = getUUID();
          evName = 'potrace' + uuid;
          window.webContents.send('potrace', code, uuid);
          timer = setTimeout((function() {
            clearTimeout(timer);
            windowManager.killWindow(window.id);
            step += 1;
            return invokePotrace(code, options, step).then(function(string) {
              return resolve(string);
            });
          }), 8000);
          return ipcMain.once(evName, function(event, string, winId) {
            windowManager.releaseWindow(winId);
            clearTimeout(timer);
            return resolve(string);
          });
        });
      });
    };
    return new Promise(function(c_resolve) {
      var action, temp;
      action = getAction(options);
      if (action === 'full_potrace') {
        temp = (options.tmpdir || os.tmpdir()) + path.sep + Math.round(Math.random() * 10000) + '.png';
        invokeSVG(svg, options).then(function(buffer) {
          fs.writeFile(temp, buffer, function(err) {
            invokePotrace(temp, options).then(function(data) {
              return c_resolve(data);
            });
          });
        });
      } else {
        if (action === 'kill_windows') {
          windowManager.killAllWindows();
          c_resolve(null);
        } else {
          invokeSVG(svg, options).then(function(r) {
            return c_resolve(r);
          });
        }
      }
    });
  };

  exports = module.exports = svg2imgElectron;

}).call(this);
