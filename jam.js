'use strict'

var express = require('express');
var app = express();

var lib = require('./lib')

// settings
var port = 8000
var staticPath = './static' 
var sysPath = './node_modules/jam.fs/core/'
var basePath = './mod' 
var dynamic = true

var mount = {
    '/jam': './node_modules/jam.fs/core',
    '/ext': './node_modules/jam.fs/core',
    '/mod': '.',
}

console.log('jam core staring...')

const args = process.argv;
for (let i = 2; i < args.length; i++) {
    if (args[i] === 'static') dynamic = false
}

// static http
app.use(express.static(staticPath))
app.use(express.static(sysPath))
app.use('/mod', express.static(basePath))

if (dynamic) {
    app.get('*/topology', function(req, res) {
        let path = req.url.substr(0, req.url.lastIndexOf('topology'))
        let basepath = ''

        for (let m in mount) {
            if (path.startsWith(m)) {
                basepath = mount[m]
            }
        }
        let ls = lib.survey('', basepath + path)

        if (ls.length > 0) {
            console.log('topology for ' + basepath + path)
            console.log(ls)
        } else {
            console.log('No topology for ' + basepath + path)
        }
        res.json(ls)
    });

} else {
    console.log('serving only static topology!')
}

app.get('/stat', function(req, res) {
    res.json(hub.state());
});

app.listen(port);
console.log('[http-server] Listening @' + port + '...');

