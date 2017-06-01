describe("Electron fallback", function() {
    var instance = require('../../../index.js');
    var os = require('os');
    var path = require('path');
    var filepath = os.tmpdir() + path.sep + 'temp.svg';
    var fs = require('fs');
    var svgCode = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="#fff"><g class="nc-icon-wrapper" fill="#444444"> <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm-4 29V15l12 9-12 9z"></path> </g> </svg>';

    it("Export is a function", function() {
        expect(typeof(instance)).toEqual('function');
    });
    it("Fallback with undefined code", function () {
        instance("", {width: 64, height: 64, fallback: true}, function (err, data) {
            expect(typeof(err)).toEqual("object");
            expect(typeof(data)).toEqual("object");
        });
    });
    it("Fallback with svg code", function () {
        instance(svgCode, {width: 64, height: 64, fallback: true}, function (err, data) {
            expect(typeof(err)).toEqual("object");
            expect(typeof(data)).toEqual("object");
        });
    });
    it('Fallback with saved file', function () {
       fs.writeFile(filepath, svgCode, function (fsErr) {
           instance(filepath, {width: 64, height: 64, fallback: true}, function (err, data) {
               expect(typeof(err)).toEqual("object");
               expect(typeof(data)).toEqual("object");
           });
       });
    });
});