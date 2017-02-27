var http = require('http')
var fs = require('fs')
var routes = require('routes')
var url = require('url')
var body = require('body')
var request = require('request')

module.exports = function (done) {
  var router = routes()
  router.addRoute('/:tarball\.tgz', onTarball)
  router.addRoute('/:pkg', onPackage)
  router.addRoute('/-/user/org.couchdb.user\::user', onAddUser)

  // var driver = require('./hyperdrive')()
  var driver = require('./local-fs')('.')
  var store = require('fs-blob-store')('./packages')

  var server = http.createServer(function (req, res) {
    console.log(req.method.toUpperCase() + ' ' + req.url)

    var path = url.parse(req.url).pathname
    var match = router.match(path)
    if (match) {
      match.fn(req, res, match)
    } else {
      res.statusCode = 404
      res.end()
    }
  })

  server.listen(9000, function () {
    done(null, server)
  })

  function onPackage (req, res, match) {
    if (req.method === 'GET') {
      var pkg = match.params.pkg
      driver.fetchHashes(pkg, function (err, hashes) {
        if (err) {
          res.statusCode = 404
        } else {
          console.log(err, hashes)
          var packages = mapHashesToMetadata(pkg, hashes)
          res.write(JSON.stringify(packages))
          process.stdout.write(JSON.stringify(packages, null, 2) + '\n')
          res.statusCode = 201
        }
        res.end()
      })
    } else if (req.method === 'PUT') {
      console.log('wants to publish', match.params.pkg)
      body(req, function (err, data) {
        if (err) {
          res.statusCode = 500
          res.end()
          return
        }
        data = JSON.parse(data)
        publishPackage(data, function (err) {
          if (err) {
            res.statusCode = 500
          } else {
            res.statusCode = 201
          }
          res.end()
        })

      })
    } else {
      res.statusCode = 404
      res.end()
    }
  }

  function publishPackage (data, done) {
    var attachments = data._attachments
    delete data._attachments

    var pending = 2
    var pkg = data.name
    driver.writeMetadata(pkg, data, function (err) {
      console.log('wrote meta')
      if (--pending === 0) done(err)
    })
    writeAttachments(pkg, attachments, function (err) {
      console.log('wrote tarball')
      if (--pending === 0) done(err)
    })
  }

  function writeAttachments (pkg, attachments, done) {
    var pending = Object.keys(attachments).length

    Object.keys(attachments).forEach(function (filename) {
      var data = new Buffer(attachments[filename].data, 'base64')
      driver.writeTarball(pkg, filename, data, function (err) {
        if (--pending === 0) done()
      })
    })
  }

  function fetchPackage (pkg, out, done) {
    console.log('fetch pkg', pkg)
    driver.fetchMetadata(pkg, done)
  }

  function onAddUser (req, res, match) {
    body(req, function (err, data) {
      driver.addUser({
        name: data.name,
        email: data.email
      }, function (err) {
        if (err) {
          res.statusCode = 404
        } else {
          res.statusCode = 201
        }
        res.end()
      })
    })
  }

  function onTarball (req, res, match) {
    var tarball = match.params.tarball + '.tgz'
    console.log('getting tarball', tarball)
    var rs = store.createReadStream(tarball)
    rs.on('error', function (err) {
      console.log('unable to get tarball', tarball, err)
      res.statusCode = 404
      rs.unpipe(res)
      res.write(err.toString() + '\n')
      res.end()
    })
    rs.pipe(res)
  }

  return server
}

function mapHashesToMetadata (pkg, hashes) {
  var meta = {
    _id: pkg,
    name: pkg,
    versions: {}
  }

  Object.keys(hashes).forEach(function (version) {
    meta.versions[version] = {
      name: pkg,
      version: version,
      dist: {
        shasum: hashes[version],
        tarball: 'http://localhost:9000/' + hashes[version] + '.tgz'
      },
    }
  })

  // TODO: figure out actual latest version
  meta['dist-tags'] = {
    latest: Object.keys(hashes)[Object.keys(hashes).length - 1]
  }

  return meta
}
