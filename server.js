var http = require('http')
var fs = require('fs')
var routes = require('routes')
var url = require('url')
var body = require('body')

var router = routes()
router.addRoute("/:pkg?", onPackage)

var driver = require('./files')('/tmp/registry')

var server = http.createServer(function (req, res) {
  console.log(req.url)

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
  console.log('listening on http://0.0.0.0:9000')
})

function onPackage (req, res, match) {
  if (req.method === 'GET') {
    console.log('wants to install', match.params.pkg)
    fetchPackage(match.params.pkg, res, function (err) {
      if (err && err.notFound) {
        res.statusCode = 404
      } else if (err) {
        res.statusCode = 500
      } else {
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
  driver.writeMetadata(data, function (err) {
    if (--pending === 0) done(err)
  })
  writeAttachments(attachments, function (err) {
    if (--pending === 0) done(err)
  })
}

function writeAttachments (attachments, done) {
  var pending = Object.keys(attachments).length

  Object.keys(attachments).forEach(function (filename) {
    var data = new Buffer(attachments[filename].data, 'base64')
    driver.writeTarball(filename, data, function (err) {
      if (--pending === 0) done()
    })
  })
}

function fetchPackage (pkg, out, done) {
  driver.fetchTarball(pkg, function (err, stream) {
    if (err) return done(err)
    if (!stream) return done({notFound:true})
    stream.on('error', done)
    stream.on('end', done)
    stream.pipe(out)
  })
}
