#!/usr/bin/env node

var comandante = require('comandante')
var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn
var config = require('application-config-path')
var createServer = require('../server')
var homedir = require('os').homedir
var swarmAddr = require('../swarm-addr')
var rewrite = require('../rewrite-packagejson')

if (process.argv.length === 2) {
  printUsage()
  return
}

switch (process.argv[2]) {
  case 'install':
  case 'i':
  case 'remove':
    rewrite('package.json', function (done) {
      var args = ['--registry', 'http://localhost:9000']
      args = args.concat(process.argv.slice(2))
      var p = spawn('npm', args, {stdio:'inherit'})
      p.on('close', done)
    })
    break
  case 'publish':  // TODO: output the package name /w public key
    if (!isNpmrcReady()) {
      process.stdout.write('Creating a new keypair..')
      initNpmrc()
      console.log('..done!\n')
    }

    var args = ['--registry', 'http://localhost:9000']
    args = args.concat(process.argv.slice(2))
    var p = spawn('npm', args)
    p.stderr.pipe(process.stderr)
    var version = ''
    p.stdout.on('data', function (line) {
      line = line.toString()
      version = line.substring(line.indexOf('@')+1)
      version = version.replace('\n', '')
    })
    p.on('close', function (code) {
      if (code === 0) {
        var root = config('peer-npm')
        var pub = JSON.parse(fs.readFileSync(path.join(root, 'keys.json'), 'utf-8')).pub
        var name = JSON.parse(fs.readFileSync('package.json')).name
        // TODO: hack! not network agnostic!
        console.log('+ ' + name + swarmAddr.SEP + 'hyperdrive' + swarmAddr.SEP + pub)
        console.log('Published ' + version)
      }
    })
    break
  case 'daemon':
    createServer(function (err, server) {
      console.log('listening on http://0.0.0.0:9000')
    })
    break
  default:
    printUsage()
    break
}

function printUsage () {
  require('fs').createReadStream(__dirname + '/usage.txt').pipe(process.stdout)
}

function isNpmrcReady () {
  var npmrc = fs.readFileSync(path.join(homedir(), '.npmrc'))
  return npmrc.indexOf('//localhost:9000/:_authToken=baz') !== -1
}

function initNpmrc () {
  fs.appendFileSync(path.join(homedir(), '.npmrc'), '//localhost:9000/:_authToken=baz')
}
