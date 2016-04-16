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





