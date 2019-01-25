'use strict'

var fs = require('fs');

// topology reader
let survey = function(base, path) {
    try {
        let items = fs.readdirSync(path)
        let ls = []

        for (var i=0; i<items.length; i++) {
            let name = items[i]
            let fullPath = path + '/' + name
            let basePath = base === ''? name : base + '/' + name
            let lstat = fs.lstatSync(fullPath)
            // check on directory
            if (lstat.isDirectory()) {
                ls = ls.concat(survey(basePath, fullPath))
            } else {
                ls.push(basePath) 
            }
        }
        return ls
    } catch (e) {
        return []
    }
}

module.exports = {
    survey: survey,
}
