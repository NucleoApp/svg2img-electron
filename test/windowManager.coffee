expect = require('chai').expect
instance = require '../windowManager.js'

describe 'windowManager', ->
  it 'should be a function', ->
    expect(instance).to.be.a('object')
  it 'should at least work', (done)->
    @.timeout(5000)
    instance.getWindow().then (window)->
      done()
