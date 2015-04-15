

var ndarray = require('ndarray');

module.exports = function (self) {
  self.addEventListener('message',function (ev){
    var msg = ev && ev.data && ev.data.msg
    if (!msg) return

    var t = performance.now()
    var s = ''
    for (var n in self) s += n+','
    self.postMessage({
      msg: 'ack',
      status: msg+' received.. self stuff:'+s,
      t: t,
      dt: t-ev.data.t
    })
    
    
    if (msg=='test') doTest(ev.data.arr, ev.data.lookup);

  })
}


function doTest(arr, lookup) {
  var t = performance.now()

  var nda = new ndarray(arr.data, arr.shape, arr.stride, arr.offset)
  var is = nda.shape[0]
  var js = nda.shape[1]
  var ks = nda.shape[2]
  for (var i=0; i<is; ++i) {
    for (var j=0; j<js; ++j) {
      for (var k=0; k<ks; ++k) {
        nda.set(i,j,k, lookup[i] + Math.sqrt(i*i + j*j + k*k) )
      }
    }
  }
  
  var t2 = performance.now()
  self.postMessage({
    msg: 'done',
    status: 'worker done in '+(t2-t).toFixed(2)+'ms',
    data: nda.data,
    t: t2
  })

}


