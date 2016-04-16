'use strict';

var workify = require('webworkify')


module.exports = function (logFn, doneFn) {
  return new Tester(logFn, doneFn)
}


function Tester(logFn, doneFn) {
  // workify worker file and set up listeners

  var worker = workify(require('./worker'))
  // worker.postMessage('')
  worker.addEventListener('message', onMsg, false)
  worker.addEventListener('error', onErr, false)
  // worker.postMessage()

  function onErr(ev) {
    status(['Err at ', ev.lineno, ': ', ev.message].join(''))
  }


  // test functions to be called from externally

  var startTime = 0
  var copyTime = 0
  var blockTime = 0
  this.resetTime = function() {
    startTime = performance.now()
  }

  this.runTest = function (size) {
    
    status('Starting - UI thread blocked')
    copyTime = blockTime = 0

    // var size = 64 * 64 * 64
    var arr = new Uint32Array(size)
    var lookup = []
    for (var i = 0; i < 32; ++i) { lookup[i] = i }

    var s = (arr.buffer.byteLength / 1024 / 1024).toFixed(2)
    status('Initialized buffer (' + s + 'MB). Sending to worker..')
    var t = performance.now()

    worker.postMessage({
      msg: 'test',
      arr: arr,
      lookup: lookup,
      t: t
    })
    
    blockTime += performance.now() - t
    status('Buffer sent to worker - UI thread released')
    status('')
  }


  // worker message listener


  function onMsg(ev) {
    var msg = ev && ev.data && ev.data.msg
    if (!msg) {
      status('Unknown worker message: ' + ev)
      return
    }
    var now = performance.now()
    var s = ev.data.status
    var t = (ev.data.t - startTime).toFixed(2)

    if (msg == 'ack') {
      status(' -- Worker message @' + t + ': ' + s)
      copyTime += ev.data.dt
    }

    if (msg == 'done') {
      var arr = ev.data.arr
      status(' -- Worker message @' + t + ': ' + s)
      status('got back array of byteLength ' + arr.byteLength)
      copyTime += now - ev.data.t
      doneFn(ev.data.dt, copyTime, blockTime)
    }
  }



  // time tracking and output

  function status(str) {
    var msg = ''
    if (str) {
      var t = performance.now() - startTime
      msg += t.toFixed(2) + ': ' + str
    }
    logFn(msg)
  }

}

