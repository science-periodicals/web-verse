
// a quick and dirty tool to know what is taking up space in a bundle
// this should be made generic
var exec = require('child_process').exec
  , chalk = require('chalk')
  , entryFile = 'src/index.js'
;
exec(`browserify --deps ${entryFile}`, function (err, stdout, stderr) {
  var files = {}
    , incBy = {}
    , deps = JSON.parse(stdout)
  ;
  deps.forEach(function (dep) {
    files[dep.file] = {
      size:   dep.source.replace(/^\/\/# sourceMap.*/m, '').length
    , entry:  !!dep.entry
    };
    for (var k in dep.deps) {
      var includes = dep.deps[k];
      if (!incBy[includes]) incBy[includes] = {};
      incBy[includes][dep.file] = true;
    }
  });
  var keys = Object.keys(files)
                  .sort(function (a, b) {
                    if (files[a].entry) return -1;
                    if (files[b].entry) return 1;
                    if (files[a].size > files[b].size) return -1;
                    if (files[a].size < files[b].size) return 1;
                    return 0;
                  })
  ;
  keys.forEach(function (k) {
    console.log(chalk.bold.red(k + (files[k].entry ? ' [entry]' : '')));
    console.log(chalk.green('  chars: ') + files[k].size);
    console.log(chalk.green('  included by:'));
    for (var inc in incBy[k]) console.log('        ' + inc);
  });
});
