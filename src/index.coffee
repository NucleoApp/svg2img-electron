###
# svg2img-electron
# https://github.com/sharpfuryz/svg2img-electron
# Licensed under the MIT license.
###

###global require:true###
###global __dirname:true###
###global console:true###

global.winOne = null
global.winTwo = null
global.windowOneBusy = false
global.windowTwoBusy = false
url = require('url')
path = require('path')
electron = require('electron')
BrowserWindow = electron.BrowserWindow

windowManager =
  getWindowOne: (options, log) ->
    new Promise((resolve) ->
      if global.winOne == null
        global.winOne = new BrowserWindow(
          x: 0
          y: 0
          width: options.width
          height: options.height
          show: false
          frame: false
          enableLargerThanScreen: true)
        global.winOne.once 'closed', ->
          global.winOne = null
          return
        global.winOne.loadURL url.format(
          pathname: path.resolve(__dirname, 'page.html')
          protocol: 'file:'
          slashes: true)
        global.winOne.webContents.on 'did-finish-load', ->
          resolve winOne
        global.winOne.webContents.on 'did-fail-load', (event, errorCode, errorDescription) ->
          resolve winOne
          log.error errorDescription
        return
      else
        global.winOne.setSize options.width, options.height
        resolve winOne
      return
    )

  getWindowTwo: (options, log) ->
    new Promise((resolve) ->
      if global.winTwo == null
        global.winTwo = new BrowserWindow(
          x: 0
          y: 0
          width: options.width
          height: options.height
          show: false
          frame: false
          enableLargerThanScreen: true)
        global.winTwo.once 'closed', ->
          global.winTwo = null
          return
        global.winTwo.loadURL url.format(
          pathname: path.resolve(__dirname, 'page2.html')
          protocol: 'file:'
          slashes: true)
        global.winTwo.webContents.on 'did-finish-load', ->
          resolve winTwo
        global.winTwo.webContents.on 'did-fail-load', (event, errorCode, errorDescription) ->
          resolve winTwo
          log.error errorDescription
        return
      else
        global.winTwo.setSize options.width, options.height
        resolve winTwo
      return
    )
  killWindow: (winId)->
    if winId is global.winOne.id
      global.winOne.close()
      global.windowOneBusy = false
    else
      global.winTwo.close()
      global.windowTwoBusy = false

  killAllWindows: ->
    global.winOne.close()
    global.windowOneBusy = false
    global.winTwo.close()
    global.windowTwoBusy = false

  getWindow: (options, log) ->
    ctx = @
    return new Promise((resolve, reject) ->
      if global.windowOneBusy
#        unless global.windowTwoBusy
          global.windowTwoBusy = true
          ctx.getWindowTwo(options, log).then (window) ->
            resolve window
          return
      else
        global.windowOneBusy = true
        ctx.getWindowOne(options, log).then (window) ->
          resolve window
        return
      return
    )

  releaseWindow: (winId) ->
    if winId == 1
      global.windowOneBusy = false
    else
      global.windowTwoBusy = false

roundWidthHeight = (options) ->
  if options.width
    options.width = Math.round(options.width)
  if options.height
    options.height = Math.round(options.height)
  options
  
defaultLog =
  warn = (str) ->
    console.log str

svg2imgElectron = (svg, options, log = defaultLog) ->
  electron = require('electron')
  ipcMain = electron.ipcMain
  os = require('os')
  fs = require('graceful-fs')
  checkCode = require './checkCode'
  options = roundWidthHeight(options)

  formBase64 = (string) ->
    regex = /^data:.+\/(.+);base64,(.*)$/
    matches = string.match(regex)
    data = matches[2]
    buffer = new Buffer(data, 'base64')
    return buffer

  getAction = (options) ->
    if typeof options.format == 'undefined'
      options.format = 'image/png'
      'rasterization'
    else
      if options.format.indexOf('image') > -1
        'rasterization'
      else
        options.format
  #
  getUUID = ->
    charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    len = 10
    randomString = ''
    i = 0
    while i < len
      randomPoz = Math.floor(Math.random() * charSet.length)
      randomString += charSet.substring(randomPoz, randomPoz + 1)
      i++
    return randomString
  #
  invokeSVG = (svg, options) ->
    new Promise((resolve) ->
      windowManager.getWindow(options, log).then (window) ->
        checkCode(svg).then (code) ->
          uuid = getUUID()
          window.webContents.send 'svg', code, options.width, options.height, options.format, uuid
          ipcMain.once "svg#{uuid}", (event, string, winId) ->
            windowManager.releaseWindow(winId)
            resolve formBase64(string)
    )

  invokePotrace = (code, options, step = 1) ->
    new Promise((resolve) ->
      if step > 3
        log.warn 'Icon' + code + 'broken, exiting upon 3 attemps'
        resolve('')
      windowManager.getWindow(options, log).then (window) ->
        uuid = getUUID()
        evName = "potrace#{uuid}"
        window.webContents.send 'potrace', code, uuid
        timer = setTimeout ( ->
          clearTimeout(timer)
          windowManager.killWindow(window.id)
          step += 1
          invokePotrace(code, options, step).then (string) ->
            resolve(string)
        ), 3000
        ipcMain.once evName, (event, string, winId) ->
          windowManager.releaseWindow(winId)
          clearTimeout(timer)
          resolve(string)
    )

  return new Promise((c_resolve) ->
    action = getAction(options)
    if action == 'full_potrace'
      temp = (options.tmpdir or os.tmpdir()) + path.sep + Math.round(Math.random() * 10000) + '.png'
      invokeSVG(svg, options).then (buffer) ->
        fs.writeFile temp, buffer, (err) ->
          invokePotrace(temp, options).then (data) ->
            c_resolve data
          return
        return
    else
      if action is 'kill_windows'
        windowManager.killAllWindows()
        c_resolve null
      else
        invokeSVG(svg, options).then (r) ->
          c_resolve r
    return
  )

exports = module.exports = svg2imgElectron