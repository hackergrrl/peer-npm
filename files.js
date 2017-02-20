var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')

module.exports = function (root) {
  mkdirp.sync(root)

  this.isPeerPackage = function (pkg) {
    return fs.existsSync(path.join(root, pkg + '.json'))
  }

  this.writeTarball = function (filename, buffer, done) {
    fs.writeFile(path.join(root, filename), buffer, done)
  }

  this.writeMetadata = function (data, done) {
    fs.writeFile(path.join(root, data.name + '.json'), JSON.stringify(data), done)
  }

  this.fetchTarball = function (pkg, done) {
    var fn = path.join(root, pkg + '.json')
    if (fs.existsSync(fn)) {
      done(null, fs.createReadStream(fn))
    } else {
      done(null, null)
    }
  }

  return this
}

