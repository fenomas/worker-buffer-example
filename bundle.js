(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';


var tester = require('./tester')



document.body.style.padding = '10px'
document.write('<div style="position:relative;">')
document.write('<button id="testbut" style="padding:10px;margin:10px;">Test</button>')
document.write('<div id="anim" style="position:absolute; width:300px; height:15px; background-color:#ccc; top:20px; left:100px;"></div>')
document.write('</div>')
document.write('<div id="output" style="font:16px monospace;"></div>')

var but = document.getElementById('testbut')
testbut.addEventListener('click', function() {
  var div = document.getElementById('output')
  tester.runTest(div)
})



var anim = document.getElementById('anim')
var animwidth = 30
var dir = 1
var maxts = 0
var lastts = 0
function animate() {
  animwidth += dir*5
  if (animwidth>400 || animwidth<30) dir *= -1
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



},{"./worker":4,"webworkify":2}],4:[function(require,module,exports){



module.exports = function (self) {
  self.addEventListener('message',function (ev){
    var msg = ev && ev.data && ev.data.msg
    if (!msg) return

    // always send a reply so we can see how long the message took
    var t = performance.now()
    self.postMessage({
      msg: 'ack',
      status: 'got array',
      t: performance.now()
    })

    if (msg=='test') {
      runTest(ev.data.arr, ev.data.lookup)
    }

  })
}


function runTest(arr, lookup) {
  var t1 = performance.now(),
      ct = 0

  // do some arbitrary work on array
  for (var i=0, len=arr.length; i<len; ++i) {
    var a = lookup[i%lookup.length]
    var b = Math.sqrt(a*i)
    var c = Math.sin(b)%a
    arr[i] = c * lookup[Math.round(b*i)%lookup.length]
    ++ct
  }

  var t2 = performance.now()
  var dt = t2-t1
  self.postMessage({
    msg: 'done',
    status: 'did '+ct+' operations in '+ dt.toFixed(2) + 'ms',
    arr: arr,
    t: t2
  })
}






},{}]},{},[1]);
