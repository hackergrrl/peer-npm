#!/usr/bin/env node

var comandante = require('comandante')
var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn
var config = require('application-config-path')
var createServer = require('../server')
var homedir = require('os').homedir

if (process.argv.length === 2) {
  printUsage()
  return
}

switch (process.argv[2]) {
  case 'install':
  case 'i':
  case 'remove':
    var args = ['--registry', 'http://localhost:9000']
    args = args.concat(process.argv.slice(2))
    spawn('npm', args, {stdio:'inherit'})
    break
  case 'publish':
    if (!isNpmrcReady()) {
      process.stdout.write('Creating a new keypair..')
      initNpmrc()
      console.log('..done!\n')
    }

    var args = ['--registry', 'http://localhost:9000']
    args = args.concat(process.argv.slice(2))
    spawn('npm', args, {stdio:'inherit'})
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
