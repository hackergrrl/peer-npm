var level = require('level')
var hyperdrive = require('hyperdrive')
var config = require('application-config-path')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var hypercore = require('hypercore')
// var swarm = require('discovery-swarm')()

module.exports = function () {
  var root = config('peer-npm')
  mkdirp.sync(root)
  var drive = hyperdrive(level(path.join(root, 'packages.db')))

  var keys
  var archive
  if (fs.existsSync(path.join(root, 'keys.json'))) {
    keys = JSON.parse(fs.readFileSync(path.join(root, 'keys.json'), 'utf-8'))
    archive = drive.createArchive(keys.pub, {
      live: true,
      // metadata: core.createFeed(key),
      // content: core.createFeed(contentKey)
    })
    console.log('found existing keypair + archive: ' + keys.pub)
  } else {
    archive = drive.createArchive({live: true})
    keys = {
      pub: archive.key.toString('hex'),
      prv: archive.metadata.secretKey.toString('hex')
    }
    fs.writeFileSync(path.join(root, 'keys.json'), JSON.stringify(keys))
    console.log('created brand new keypair + archive: ' + keys.pub)
  }

  this.isPeerPackage = function (pkg) {
    return true
    return fs.existsSync(path.join(root, pkg + '.json'))
  }

  this.writeTarball = function (filename, buffer, done) {
    var ws = archive.createFileWriteStream(filename)
    ws.write(buffer)
    ws.end()
    ws.on('end', done)
    ws.on('finish', done)
  }

  this.writeMetadata = function (data, done) {
    var ws = archive.createFileWriteStream(data.name + '.json')
    ws.write(JSON.stringify(data))
    ws.end()
    ws.on('finish', done)
    ws.on('error', done)
  }

  this.fetchTarball = function (pkg, done) {
    var rs = archive.createFileReadStream(pkg + '.json')
    done(null, rs)
    // var fn = path.join(root, pkg + '.json')
    // if (fs.existsSync(fn)) {
    //   done(null, fs.createReadStream(fn))
    // } else {
    //   done(null, null)
    // }
  }

  this.addUser = function (user, done) {
    // TODO: generate + write keypair
    done()
  }

  return this
}

