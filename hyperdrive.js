var level = require('level')
var hyperdrive = require('hyperdrive')
var config = require('application-config-path')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var hypercore = require('hypercore')
var traverse = require('traverse')
// var swarm = require('discovery-swarm')()

module.exports = function () {
  var root = config('peer-npm')
  mkdirp.sync(root)
  var drive = hyperdrive(level(path.join(root, 'packages.db')))

  var keys
  var archive
  if (fs.existsSync(path.join(root, 'keys.json'))) {
    keys = JSON.parse(fs.readFileSync(path.join(root, 'keys.json'), 'utf-8'))
    archive = drive.createArchive(keys.pub, { live: true })
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

  archive.list(function (err, entries) {
    console.log('--- current entries ---')
    entries.forEach(function (e) {
      console.log(e.name)
    })
    console.log('---')
  })

  // TODO: this could be more robust (check that it's a hexstring, etc)
  this.isPeerPackage = function (pkg) {
    var ending = pkg.lastIndexOf('_')
    if (ending === -1) return false

    var key = pkg.substring(ending + 1)
    return key.length === 64
  }

  this.writeTarball = function (pkg, filename, buffer, done) {
    filename = filename.replace(pkg, pkg + '_' + keys.pub)
    var ws = archive.createFileWriteStream(filename)
    ws.on('end', done)
    ws.on('finish', done)
    ws.on('close', done)
    ws.write(buffer)
    ws.end()
    console.log('writing', filename)
  }

  this.writeMetadata = function (pkg, data, done) {
    var name = data.name
    var outname = name + '_' + keys.pub

    // TODO: explicitly set all relevant sites; this way could have unintended
    // consequences
    traverse(data).forEach(function (v) {
      if (v === name) {
        this.update(outname)
      }
    })

    var ws = archive.createFileWriteStream(outname + '.json')
    ws.on('finish', done)
    ws.on('error', done)
    ws.on('close', done)
    ws.write(JSON.stringify(data))
    ws.end()
    console.log('writing', outname + '.json')
  }

  this.fetchTarball = function (pkg, done) {
    var rs = archive.createFileReadStream(pkg + '.json')
    done(null, rs)
  }

  this.addUser = function (user, done) {
    // TODO: generate + write keypair
    done()
  }

  return this
}

