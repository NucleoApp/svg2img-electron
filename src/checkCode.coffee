checkCode = (input_code) ->
  fs = require('graceful-fs')
  new Promise((resolve) ->
    if input_code.toLowerCase().indexOf('<svg') > -1 or input_code is ''
      resolve input_code
    else
      fs.lstat input_code, (err, stats) ->
        if err
          console.log err
          resolve ''
        if stats
          if stats.isFile()
            fs.readFile input_code, (IOerr, data) ->
              if IOerr
                resolve ''
              resolve input_code
              return
          else
            resolve input_code
        else
          resolve input_code
        return
    return
  )

exports = module.exports = checkCode