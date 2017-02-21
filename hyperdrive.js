var level = require('level')
var hyperdrive = require('hyperdrive')
var config = require('application-config-path')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var hypercore = require('hypercore')
var collect = require('collect-stream')
var Swarm = require('discovery-swarm')

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

  function host () {
    var link = archive.key.toString('hex')

    // the archive is now ready for sharing.
    // we can use swarm to replicate it to other peers
    console.log('hosting archive on swarm for', link)
    var swarm = Swarm()
    swarm.listen()
    swarm.join(link)
    swarm.on('connection', function (connection) {
      console.log('found a peer to share', link, 'with')
      var r = archive.replicate()
      connection.pipe(r).pipe(connection)
      r.on('end', function () {
        console.log('replicated with peer to share', key)
        done(null, archive)
      })
      r.on('error', function (err) {
        console.log('ERROR REPLICATION:', err)
      })
    })
    return swarm
  }

  // TODO: clean up archive when done
  function getArchive (key, done) {
    console.log('getting archive', key)
    var archive = drive.createArchive(key)
    done(null, archive)

    var swarm = Swarm()
    swarm.listen()
    swarm.join(key)
    swarm.on('connection', function (connection) {
      console.log('found a peer to get', key)
      var r = archive.replicate()
      connection.pipe(r).pipe(connection)
    })
  }

  var swarm = host()

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
    var outname = pkg + '_' + keys.pub

    data._id = outname
    data.name = outname
    Object.keys(data.versions).forEach(function (version) {
      var v = data.versions[version]
      v.name = outname
      var r = new RegExp(pkg, 'g')
      v.dist.tarball = v.dist.tarball.replace(r, outname)
    })

    var ws = archive.createFileWriteStream(outname + '.json')
    ws.on('finish', done)
    ws.on('error', done)
    ws.on('close', done)
    ws.write(JSON.stringify(data))
    ws.end()
    console.log('writing', outname + '.json')
  }

  this.fetchMetadata = function (pkg, done) {
    var key = pkg.substring(pkg.length - 64)
    getArchive(key, function (err, archive) {
      if (err) return done(err)
      console.log('got metadata archive!', pkg)
      var filename = pkg + '.json'
      collect(archive.createFileReadStream(filename), function (err, data) {
        if (err) return done(err)
        var json = JSON.parse(data.toString())
        done(null, json)
      })
    })
  }

  this.fetchTarball = function (filename, done) {
    var idx = filename.lastIndexOf('_')
    if (idx === -1) return done(new Error('not a peer-npm package'))

    var pkg = filename.substring(idx+1, idx+64+1)

    getArchive(pkg, function (err, archive) {
      if (err) return done(err)
      var rs = archive.createFileReadStream(filename)
      done(null, rs)
    })
  }

  this.addUser = function (user, done) {
    // TODO: generate + write keypair
    done()
  }

  return this
}

