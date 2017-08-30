module.exports = (grunt) ->
  grunt.initConfig
    coffee:
      compile:
        files:
          'index.js': ['src/index.coffee']
          'checkCode.js': ['src/checkCode.coffee']
          'windowManager.js': ['src/windowManager.coffee']
    mochaTest:
      options:
        reporter: 'nyan'
      src: ['test/*.coffee']

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-mocha-test'

  grunt.registerTask 'default', ['coffee', 'mochaTest']
