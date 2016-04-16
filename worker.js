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





