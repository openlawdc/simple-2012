var fs = require('fs'),
    glob = require('glob');

glob.sync('dc-code-prototype/*/*/*.xml').forEach(function(s) {
    console.log(s);
});
