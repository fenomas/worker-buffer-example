


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





