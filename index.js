'use strict';


var ndarray = require('ndarray')
var workify = require('webworkify')

var inc = require('./inc')
var w = require('./worker')
w.inc = inc

console.log(w)
window.w = w  

var worker = workify(w)


module.exports = {}


worker.addEventListener('message', onMsg, false)
worker.addEventListener('error', onErr, false)
worker.postMessage()

function onErr(ev) {
  status( ['Err at ', e.lineno, ': ', e.message].join('') )
}



function onMsg(ev) {
  var msg = ev && ev.data && ev.data.msg
  if (!msg) {
    status('Unknown worker message: '+ev)
    return
  }

  if (msg=='ack') {
    var wt = ev.data.t - startTime
    status(' -- worker: '+ev.data.status+' @'+wt.toFixed(2) +
           ' (copy took '+ev.data.dt.toFixed(2)+'ms)')
  }

  if (msg=='done') {
    status(' -- worker: '+ev.data.status + 
           ' (copy took '+(performance.now()-ev.data.t).toFixed(2)+'ms)')
    dat.data = ev.data.data // yech
    checkData()
    status('Max timestep seen: '+maxts.toFixed(2)+'ms')
  }


}







document.body.style.padding = '10px'
document.write('<div style="position:relative;">')
document.write('<button onclick="runTest()" style="padding:10px;margin:10px;">Test</button>')
document.write('<div id="anim" style="position:absolute; width:300px; height:15px; background-color:#ccc; top:20px; left:100px;"></div>')
document.write('</div>')
document.write('<div id="output" style="font:16px monospace;"></div>')

var anim = document.getElementById('anim')
var animwidth = 30
var dir = 1
var maxts = 0
var lastts = 0
function animate() {
  animwidth += dir*5
  if (animwidth>500 || animwidth<30) dir *= -1
  anim.style.width = animwidth+'px'
  requestAnimationFrame(animate)
  var ts = performance.now()
  if (lastts) {
    var dt = ts-lastts
    if (dt>maxts) maxts = dt
  }
  lastts = ts
}
animate()




var dat


window.runTest = function() {
  clear()
  status('Starting')

  var size = 64
  var arr = new Uint32Array(size*size*size)
  var lookup = []
  for (var i=0; i<size; ++i) { lookup[i] = i }
  window.dat = dat = new ndarray(arr, [size, size, size])
//  for (var i=0; i<size; ++i) {
//    for (var j=0; j<size; ++j) {
//      for (var k=0; k<size; ++k) {
//        dat.set(i,j,k, lookup[i] + Math.sqrt(i*i + j*j + k*k) )
//      }
//    }
//  }
  status('Initialized array in main thread', true)
  checkData()

  worker.postMessage({
    msg: 'test',
    arr: dat,
    lookup: lookup,
    t: performance.now()
  })
  status('Sent worker message')

}

function checkData() {
  var s = ''
  for (var i=2; i<dat.shape[0]; i+=5) {
    s += dat.get(i,i,i)+','
  }
  status('Data check: '+s)
}


//
//
//var ab = arr.buffer
//worker.postMessage( ab, [ab] )
//status('Start: buffer size='+ab.byteLength)


function status(s, showdiff) {
  var div = document.getElementById('output')
  var t = performance.now() - startTime
  var msg = t.toFixed((t<10)?3:2) + ': ' + s
  if (showdiff) msg += ' ('+(t-lastTime).toFixed(2)+'ms)'
  div.innerHTML += msg+ '<br>'
  lastTime = t
}

var startTime, lastTime
function clear() {
  var div = document.getElementById('output')
  div.innerHTML = ''
  startTime = performance.now()
  lastTime = 0
  maxts = 0
}
