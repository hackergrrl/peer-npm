var SEP = '_'

function parse (str) {
  var key = str.substring(str.lastIndexOf(SEP) + 1)
  str = str.substring(0, str.lastIndexOf(SEP))
  var net = str.substring(str.lastIndexOf(SEP) + 1)
  var pkg = str.substring(0, str.lastIndexOf(SEP))
  return {
    pkg: pkg,
    net: net,
    key: key
  }
}

function build (pkg, net, key) {
  return pkg + SEP + net + SEP + key
}

// TODO: this is wrong; what about packages with SEP in them?
function is (str) {
  var p = str.split(SEP)
  return p.length === 3
}

module.exports = {
  parse: parse,
  build: build,
  is: is,
  SEP: SEP
}
