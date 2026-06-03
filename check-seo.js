const fs = require('fs');
const path = require('path');

function getHtml(dir, acc) {
  acc = acc || [];
  fs.readdirSync(dir).forEach(function(f) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) getHtml(p, acc);
    else if (f === 'index.html') acc.push(p);
  });
  return acc;
}

const all = getHtml('dist');
console.log('Total pages:', all.length);

const titles = {};
const descs = {};
let miss = 0, short = 0, dupT = 0, dupD = 0;
const dupTL = [], dupDL = [], missL = [], shortL = [];

all.forEach(function(f) {
  const html = fs.readFileSync(f, 'utf8');
  const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
  const desc = (html.match(/name="description" content="([^"]+)"/) || [])[1] || '';
  const pg = f.replace('dist' + path.sep, '').replace(/\\/g, '/');

  if (!desc) { miss++; missL.push(pg); }
  else if (desc.length < 50) { short++; shortL.push(pg + ' (' + desc.length + ')'); }

  if (title) {
    if (titles[title]) { dupT++; dupTL.push(pg + '\n    == ' + titles[title]); }
    else titles[title] = pg;
  }
  if (desc) {
    if (descs[desc]) { dupD++; dupDL.push(pg + '\n    == ' + descs[desc]); }
    else descs[desc] = pg;
  }
});

console.log('\nMissing descriptions:', miss);
if (missL.length) missL.forEach(p => console.log('  MISS:', p));

console.log('\nShort descriptions (<50 chars):', short);
if (shortL.length) shortL.forEach(p => console.log('  SHORT:', p));

console.log('\nDuplicate titles:', dupT);
dupTL.slice(0, 10).forEach(p => console.log('  DUP TITLE:', p));

console.log('\nDuplicate descriptions:', dupD);
dupDL.slice(0, 10).forEach(p => console.log('  DUP DESC:', p));
