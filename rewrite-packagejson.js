var fs = require('fs')
var swarmAddr = require('./swarm-addr')

// TODO: async + error checking + graceful atomic failure
function rewrite (filename, rewriteDoneCb, cleanupDoneCb) {
  cleanupDoneCb = cleanupDoneCb || function () {}

  // 1. Make a copy of the file in the same dir with '.orig' ext
  var contents = fs.readFileSync(filename, 'utf-8')
  fs.writeFileSync(filename + '.orig', contents)

  // 2. open + JSON parse package.json
  var pkgJson = JSON.parse(contents)

  // 3. pull out all regular deps that are also swarmdeps; hold on to them
  var dupes = extractNpmDupes(pkgJson)

  // 4. move all swarm deps into regular deps
  Object.keys(pkgJson['swarmDependencies'] || {}).forEach(function (key) {
    pkgJson['dependencies'][key] = pkgJson['swarmDependencies'][key]
  })
  delete pkgJson['swarmDependencies']

  // 5. shell out to npm
  rewriteDoneCb(cleanup)

  function cleanup () {
    // 6. reread package.json
    pkgJson = JSON.parse(fs.readFileSync(filename, 'utf-8'))

    // 7. move all swarm deps in regular deps back into swarm deps
    pkgJson['swarmDependencies'] = pkgJson['swarmDependencies'] || {}
    for (var key in pkgJson['dependencies']) {
      if (swarmAddr.is(key)) {
        pkgJson['swarmDependencies'][key] = pkgJson['dependencies'][key]
        delete pkgJson['dependencies'][key]
      }
    }

    // 8. move all held npm dupes back into deps
    for (var key in dupes) {
      pkgJson['dependencies'][key] = dupes[key]
    }

    // 9. write new package.json
    fs.writeFileSync(filename, JSON.stringify(pkgJson, null, 2))

    // 9. remove '.orig'backup file
    fs.unlinkSync(filename + '.orig')

    // 10. done!
    cleanupDoneCb()
  }
}

function extractNpmDupes (pkgJson) {
  var dupes = {}
  for (var key in pkgJson['swarmDependencies']) {
    var pkg = swarmAddr.parse(key).pkg
    if (pkgJson['dependencies'][pkg]) {
      dupes[pkg] = pkgJson['dependencies'][pkg]
      delete pkgJson['dependencies'][pkg]
    }
  }
  return dupes
}

module.exports = rewrite
