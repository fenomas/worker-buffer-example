
var workify = require('webworkify')


module.exports = {
  runTest: runTest
}


// workify worker file and set up listeners

var worker = workify(require('./worker'))
worker.postMessage()
worker.addEventListener('message', onMsg, false)
worker.addEventListener('error', onErr, false)
worker.postMessage()

function onErr(ev) {
  status( ['Err at ', e.lineno, ': ', e.message].join('') )
}



// test function to be called from externally

var outputDiv = null,
    startTime = 0

function runTest(div) {
  outputDiv = div
  outputDiv.innerHTML = ''
  startTime = performance.now()

  status('Starting - UI thread blocked')

  var size = 4*1024*1024
  var arr = new Uint32Array(size)
  var lookup = []
  for (var i=0; i<32; ++i) { lookup[i] = i }
  
  var size = arr.buffer.byteLength/1024/1024 + 'MB'
  status('Initialized buffer ('+ size +'). Sending to worker..')

  worker.postMessage({
    msg: 'test',
    arr: arr,
    lookup: lookup,
    t: performance.now()
  })

  status('Buffer sent to worker - UI thread released')
  outputDiv.innerHTML += '<br>'
}


// worker message listener


function onMsg(ev) {
  var msg = ev && ev.data && ev.data.msg
  if (!msg) {
    status('Unknown worker message: '+ev)
    return
  }

  if (msg=='ack') {
    var s = ev.data.status
    var t = (ev.data.t - startTime).toFixed(2)
    status(' -- Worker message @'+ t +': '+ s)
  }

  if (msg=='done') {
    var arr = ev.data.arr
    var s = ev.data.status
    var t = (ev.data.t-startTime).toFixed(2)
    status(' -- Worker message @'+ t +': '+ s)
    status('got back array of byteLength '+arr.byteLength)
  }


}






// time tracking and output

function status(str) {
  var t = performance.now() - startTime
  var msg = t.toFixed(2) + ': ' + str
  outputDiv.innerHTML += msg+ '<br>'
}


