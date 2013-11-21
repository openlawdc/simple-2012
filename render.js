var fs = require('fs'),
    _ = require('lodash'),
    sm = require('sitemap'),
    cited = require('./lib/cited'),
    glob = require('glob');

var section_tmpl = _.template(fs.readFileSync('templates/section._', 'utf8'));
var index_tmpl = _.template(fs.readFileSync('templates/index._', 'utf8'));
var title_tmpl = _.template(fs.readFileSync('templates/title._', 'utf8'));

function cited2(x) { return x; }

var urls = [];

glob.sync('dc-code-prototype/*/*.xml').forEach(function(s) {
    var section = JSON.parse(fs.readFileSync(s));
    fs.writeFileSync('sections/' + section.heading.identifier + '.html',
        section_tmpl({ section: section, cited: cited }));
    urls.push({
        url: '/simple/sections/' + section.heading.identifier + '.html'
    });
    console.log('done with ', section.heading.identifier);
});

var index = JSON.parse(fs.readFileSync('index.json'));
fs.writeFileSync('index.html', index_tmpl({ index: index }));

index.titles.forEach(function(i) {
    var all_sections = index.sections.filter(function(s) {
        return s[0].split('-')[0] == i[0];
    });
    fs.writeFileSync(i[0] + '.html', title_tmpl({ all_sections: all_sections, title: i }));
    console.log('done with ', i[0]);
    urls.push({
        url: '/simple/' + i[0] + '.html'
    });
});

console.log('generating sitemap');

sitemap = sm.createSitemap({
  hostname: 'http://dccode.org',
  cacheTime: 600000,        // 600 sec - cache purge period
  urls: urls
});

sitemap.toXML(function(xml) {
    fs.writeFileSync('sitemap.xml', xml);
});
