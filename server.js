var hyperdrive = require('./hyperdrive')
var registry = require('./registry')

module.exports = function (done) {
  var driver = hyperdrive()
  registry(driver, done)
}
