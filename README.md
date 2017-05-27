# svg2img-electron
I used fine module https://github.com/fuzhenn/node-svg2img/ for a long time,
but for some systems it has too heavy dependence in the form of cairo, pixman, so I made a wrapper with fallback to
electron image resize technique, which is slower, but work on all platforms.