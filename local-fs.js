var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')

var NETWORK = 'local-fs'

module.exports = function (root) {

  mkdirp.sync(root)

  var registryFilename = path.join(root, 'registry.json')
  var registry = readRegistry(registryFilename)

  // Ask for package, get its metadata
  this.fetchMetadata = function (pkg, done) {
    if (registry.packages[pkg]) {
      done(null, registry.packages[pkg])
    } else {
      done({notFound:true})
    }
  }

  // Recv package name, version, and metadata
  this.writeMetadata = function (pkg, version, data, done) {
    if (!registry.packages[pkg]) {
      registry.packages[pkg] = {
        _id: pkg,
        name: pkg,
        'dist-tags': {
          latest: version
        },
        versions: {}
      }
    }
    registry.packages[pkg].versions[version] = data
    registry.packages[pkg]['dist-tags'].latest = version

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
