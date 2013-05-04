var fs = require('fs'),
    _ = require('underscore'),
    Citation = require('citation'),
    glob = require('glob');

var section_tmpl = _.template(fs.readFileSync('templates/section._', 'utf8'));
var index_tmpl = _.template(fs.readFileSync('templates/index._', 'utf8'));
var title_tmpl = _.template(fs.readFileSync('templates/title._', 'utf8'));

function cited(x) { return x; }
function cited2(text) {
    var c = Citation.find(text, {
        context: {
            dc_code: {
                source: 'dc_code'
            }
        },
        excerpt: 40,
        types: ['dc_code', 'dc_register', 'law', 'stat'],
        replace: {
            dc_code: codeCited,
            law: lawCited,
            dc_register: dcrCited,
            stat: statCited
        }
    }).text;

    console.log(c);

    return c;

    function linked(url, text) {
        return "<a href='" + url + "'>" + text + "</a>";
    }

    function statCited(cite) {
        if (parseInt(cite.stat.volume, 10) < 65)
            return;

        return linked('http://api.fdsys.gov/link?collection=statute&volume=' + cite.stat.volume + '&page=' + cite.stat.page,
            cite.match);
    }

    // is this a current DC Code cite (something we should cross-link),
    // or is it to a prior version of the DC Code?
    function codeCited(cite) {
        var index = cite.excerpt.search(/ior\s+codifications\s+1981\s+Ed\.?\,?/i);
        if (index > 0 && index < 40) // found, and to the left of the cite
            return;

        return linked("" + cite.dc_code.title + "/" + cite.dc_code.title + "-" + cite.dc_code.section,
            cite.match);
    }

    function lawCited(cite) {
        var lawName = cite.law.type + " law " + cite.law.congress + "-" + cite.law.number;
        var url = 'http://www.govtrack.us/search?q=' + encodeURIComponent(lawName);
        return linked(url, cite.match);
    }

    // just link to that year's copy on the DC Register website
    function dcrCited(cite) {
        if (parseInt(cite.dc_register.volume, 10) < 57)
            return;

        var year = parseInt(cite.dc_register.volume, 10) + 1953;
        return linked('http://www.dcregs.dc.gov/Gateway/IssueList.aspx?IssueYear=' + year,
            cite.match);
    }
}


glob.sync('sections/*.json').forEach(function(s) {
    var section = JSON.parse(fs.readFileSync(s));
    fs.writeFileSync('sections/' + section.heading.identifier + '.html',
        section_tmpl({ section: section, cited: cited }));
});

var index = JSON.parse(fs.readFileSync('index.json'));
fs.writeFileSync('index.html', index_tmpl({ index: index }));

index.titles.forEach(function(i) {
    var all_sections = index.sections.filter(function(s) {
        return s[0].split('-')[0] == i[0];
    });
    fs.writeFileSync(i[0] + '.html', title_tmpl({ all_sections: all_sections, title: i }));
});
