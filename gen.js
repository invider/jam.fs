'use strict'

var fs = require('fs')
var lib = require('./hub/lib')

var syspath = 'pub/jam'
var basepath = 'pub'

function generate(path) {
    let top = JSON.stringify(lib.survey('', path))
    console.log(top)

    fs.writeFile(path + '/topology', top, err => {
        if (err) console.log('[ERROR]' + err)
        else console.log('[OK] Saved ' + path)
    })
}

generate(syspath)
generate(basepath)

