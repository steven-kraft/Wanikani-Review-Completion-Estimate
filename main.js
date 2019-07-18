// ==UserScript==
// @name        Wanikani Review Completion Estimate
// @namespace   wkrct
// @description Adds an estimated completion time for Wanikani Reviews, based on average time between each correct answer.
// @include     http://www.wanikani.com/review*
// @include     https://www.wanikani.com/review*
// @version     0.1
// @author      Steven Kraft
// @grant	none
// @license     GPL version 3 or later: http://www.gnu.org/copyleft/gpl.html
// ==/UserScript==

var Stopwatch = function(elem, options) {

  var timer       = createTimer(),
      startButton = createButton("start", start),
      stopButton  = createButton("stop", stop),
      resetButton = createButton("reset", reset),
      offset,
      clock,
      interval;

  // default options
  options = options || {};
  options.delay = options.delay || 1;

  // append elements
  elem.appendChild(timer);
  elem.appendChild(startButton);
  elem.appendChild(stopButton);
  elem.appendChild(resetButton);

  // initialize
  reset();

  // private functions
  function createTimer() {
    return document.createElement("span");
  }

  function createButton(action, handler) {
    var a = document.createElement("a");
    a.href = "#" + action;
    a.innerHTML = action;
    a.addEventListener("click", function(event) {
      handler();
      event.preventDefault();
    });
    return a;
  }

  function start() {
    if (!interval) {
      offset   = Date.now();
      interval = setInterval(update, options.delay);
    }
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function reset() {
    clock = 0;
    render();
  }

  function update() {
    clock += delta();
    render();
  }

  function render() {
    timer.innerHTML = clock/1000;
  }

  function delta() {
    var now = Date.now(),
        d   = now - offset;

    offset = now;
    return d;
  }

  function current_time() {
    return clock/1000;
  }

  // public API
  this.start  = start;
  this.stop   = stop;
  this.reset  = reset;
  this.current_time  = current_time;
};

function get_average() {
  var count = parseInt($("#completed-count").text());
  if(count == 0){
    return 60;
  } else {
    return timer.current_time() / count;
  }
}

function get_estimated_completion() {
  var avg = get_average() * 1000;
  var d = Date.now();
  var completion_time = new Date(d + avg * parseInt($("#available-count").text()));
  return completion_time;
}

var elem;
var est_elem;
var timer;
function init() {
  elem = document.createElement('div');
  timer = new Stopwatch(elem);
  est_elem = document.createElement('div');
  est_elem.style.color = "white";
  document.getElementById('summary-button').appendChild(est_elem);
  timer.start();
}

$.jStorage.listenKeyChange('currentItem', function (key, action) {
    var message = "Completion Time: ";
    message += get_estimated_completion().toString().split(" ")[4];
    est_elem.innerHTML = message;
});

// Pause Timer when Window is Out of Focus
document.addEventListener("visibilitychange", function() {
  if(document.visibilityState == "hidden"){
    timer.stop();
  } else {
    timer.start();
  }
});

window.onload = init();
