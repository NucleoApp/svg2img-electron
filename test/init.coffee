expect = require('chai').expect
instance = require '../index.js'
svgCode = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="#fff"><g class="nc-icon-wrapper" fill="#444444"> <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm-4 29V15l12 9-12 9z"></path> </g> </svg>';

describe 'svg2img-electron', ->
  it 'should be a function', ->
    expect(instance).to.be.a('function')
  it 'should at least work', (done)->
    @.timeout(5000)
    instance(svgCode, {width: 64, height: 64}).then (result)->
      console.log 'AAAA'
      console.log result
      done()
