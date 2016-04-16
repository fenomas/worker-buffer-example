(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';


var Tester = require('./tester')
var outputDiv


var testers = []


function log(n, s) {
  if (s) s = 'Tester ' + n + ' - ' + s
  outputDiv.innerHTML += s + '<br>'
}

var numWorkers
var numDone, workTime, copyTime, blockedTime
function doneCB(work, copy, blocked) {
  numDone++
  workTime += work
  copyTime += copy
  var recentBlockage = Math.max(performance.now() - lastUnblockedTime - 1, 0)
  blockedTime += blocked + recentBlockage
  if (numDone == numWorkers) {
    var avg = (workTime / numWorkers).toFixed(2) + 'ms'
    var s = '<br>Time spent processing in workers: ' + workTime.toFixed(2) + 'ms  (avg. ' + avg + ')'
    avg = (copyTime / numWorkers).toFixed(2) + 'ms'
    s += '<br>Time spent copying data both ways: ' + copyTime.toFixed(2) + 'ms  (avg. ' + avg + ')'
    s += '<br>Time UI thread was blocked while sending data: ' + blockedTime.toFixed(2) + 'ms'
    outputDiv.innerHTML += s + '<br>'
  }
}

function runTest() {
  outputDiv.innerHTML = ''
  numDone = workTime = copyTime = blockedTime = 0
  numWorkers = parseInt(document.getElementById('numWorkers').value)
  var sizeInput = parseFloat(document.getElementById('size').value)
  var size = (1024 * 1024 / 4 * sizeInput) | 0
  // grow or shrink testers array
  while (testers.length > numWorkers) {
    testers.pop()
  }
  while (testers.length < numWorkers) {
    testers.push(new Tester(
      log.bind(null, testers.length + 1),
      doneCB))
  }
  // run the test
  for (var i in testers) testers[i].resetTime()
  for (i in testers) testers[i].runTest(size, doneCB)
}



// see how long events took to process by polling?
var lastUnblockedTime
setInterval(function(){ lastUnblockedTime = performance.now() }, 1)




document.body.style.padding = '10px'
document.body.style.font = '14px sans-serif'
document.write('<div style="position:relative;">')
document.write('<button id="testbut" style="font:inherit;padding:10px;margin:10px;">Test</button>')
document.write('<div style="padding-left: 10px;">Size (MB):')
document.write('<input id="size" type="number" value="4" min="0.01" max="32" style="padding:2px;margin:10px;width:80px;font:inherit;">')
document.write('&nbsp; &nbsp; &nbsp; &nbsp; Number of workers:')
document.write('<input id="numWorkers" type="number" value="1" min="1" max="32" style="padding:2px;margin:10px;width:50px;font:inherit;">')
document.write('</div>')
document.write('<div id="anim" style="position:absolute; width:300px; height:15px; background-color:#ccc; top:20px; left:100px;"></div>')
document.write('</div>')
document.write('<div id="output" style="font:16px monospace;"></div>')

outputDiv = document.getElementById('output')



// start button

var but = document.getElementById('testbut')
but.addEventListener('click', function () {
  runTest()
})



// animation bar to tell if UI is blocked

var anim = document.getElementById('anim')
var animwidth = 30
var dir = 1
var maxts = 0
var lastts = 0
function animate() {
  animwidth += dir * 5
  if (animwidth > 400 || animwidth < 30) dir *= -1
  anim.style.width = animwidth + 'px'
  requestAnimationFrame(animate)
  var ts = performance.now()
  if (lastts) {
    var dt = ts - lastts
    if (dt > maxts) maxts = dt
  }
  lastts = ts
}
animate()






},{"./tester":3}],2:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn) {
    var keys = [];
    var wkey;
    var cacheKeys = Object.keys(cache);
    
    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        if (cache[key].exports === fn) {
            wkey = key;
            break;
        }
    }
    
    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
    
    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'],'require(' + stringify(wkey) + ')(self)'),
        scache
    ];
    
    var src = '(' + bundleFn + ')({'
        + Object.keys(sources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;
    
    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    
    return new Worker(URL.createObjectURL(
        new Blob([src], { type: 'text/javascript' })
    ));
};

},{}],3:[function(require,module,exports){
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


},{"./worker":4,"webworkify":2}],4:[function(require,module,exports){
'use strict';
/* globals self */


module.exports = function (self) {
  self.addEventListener('message', function (ev) {
    var msg = ev && ev.data && ev.data.msg
    if (!msg) return

    // always send a reply so we can see how long the message took
    var t = performance.now()
    var dt = t - ev.data.t
    self.postMessage({
      msg: 'ack',
      status: 'got array after ' + dt.toFixed(2) + 'ms',
      t: performance.now(),
      dt: dt,
    })

    if (msg == 'test') {
      runTest(ev.data.arr, ev.data.lookup)
    }

  })
}


function runTest(arr, lookup) {
  var t1 = performance.now(),
    ct = 0

  // do some arbitrary work on array
  for (var i = 0, len = arr.length; i < len; ++i) {
    var a = lookup[i % lookup.length]
    var b = Math.sqrt(a * a * i * i)
    var c = (b * b * Math.sin(b)) % a
    // var d = lookup.length * Math.cos(Math.sqrt(b * b + c * a + b * a))
    // var e = lookup[ Math.abs(Math.round(d)) ]
    // arr[i] = Math.round(Math.PI / c / b)
    arr[i] = c
    ct++
  }

  var t2 = performance.now()
  var dt = t2 - t1
  self.postMessage({
    msg: 'done',
    status: 'did ' + ct + ' operations in ' + dt.toFixed(2) + 'ms',
    arr: arr,
    t: t2,
    dt: dt,
  })
}






},{}]},{},[1]);
