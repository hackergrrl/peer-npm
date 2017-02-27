var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')

var NETWORK = 'local-fs'

module.exports = function (root) {

  mkdirp.sync(root)

  var registryFilename = path.join(root, 'registry.json')
  var registry = readRegistry(registryFilename)

  // Ask for package, get its known shasums
  this.fetchHashes = function (pkg, done) {
    console.log(registry)
    if (registry.packages[pkg]) {
      done(null, registry.packages[pkg].shasums)
    } else {
      done({notFound:true})
    }
  }

  // Recv package name, version, and shasum
  this.writeHash = function (pkg, version, shasum, done) {
    if (!registry.packages[pkg]) {
      registry.packages[pkg] = {
        shasums: {}
      }
    }
    registry.packages[pkg].shasums[version] = shasum

    writeRegistry(registryFilename, registry)

    done()
  }

  return this
}

function writeRegistry (filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8')
}

function readRegistry (filename) {
  if (fs.existsSync(filename)) {
    return JSON.parse(fs.readFileSync(filename, 'utf-8'))
  } else {
    return {
      packages: {}
    }
  }
}
