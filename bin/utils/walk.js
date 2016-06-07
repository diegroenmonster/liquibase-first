var fs = require('fs'),
    path = require('path');

YAML = require('yamljs');
JSONFILE = require('jsonfile')
_ = require('underscore');

var handlebars = require("handlebars");

module.exports = function walk(dir, fileMatch, list) {

    if (!fs.existsSync(dir)) {
        return [];
    }

    var items = fs.readdirSync(dir).filter(function (f) {
        return f && f[0] != '.'; // Ignore hidden files
    });
    
    // Checks if we haven't reached a sub project
    if (dir != '.') {
        var fruitJs = items.filter(p => {
            return p.toLowerCase() == 'changelog.xml'; 
        }).length > 0;
        if (fruitJs){
            return [];
        }
    }
    for (var key in items) {
        var f = items[key];
        var p = path.join(dir, f),
            stat = fs.statSync(p);

        if (stat.isDirectory()) {

            walk(p, fileMatch, list);
        } else {
            if (f.match(fileMatch)) {
                list.push({
                    name: f,
                    type: 'file',
                    path: p,
                    size: stat.size
                });
            }
        }
    }

};