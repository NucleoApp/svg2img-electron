(function() {
  var checkCode, exports;

  checkCode = function(input_code) {
    var fs;
    fs = require('graceful-fs');
    return new Promise(function(resolve) {
      if (input_code.toLowerCase().indexOf('<svg') > -1 || input_code === '') {
        resolve(input_code);
      } else {
        fs.lstat(input_code, function(err, stats) {
          if (err) {
            console.log(err);
            resolve('');
          }
          if (stats) {
            if (stats.isFile()) {
              fs.readFile(input_code, function(IOerr, data) {
                if (IOerr) {
                  resolve('');
                }
                resolve(input_code);
              });
            } else {
              resolve(input_code);
            }
          } else {
            resolve(input_code);
          }
        });
      }
    });
  };

  exports = module.exports = checkCode;

}).call(this);
