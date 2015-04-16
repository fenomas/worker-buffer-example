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





