// ==UserScript==
// @name        Wanikani Review Completion Estimate
// @namespace   wkrct
// @description Adds an estimated completion time for Wanikani Reviews, based on average time between each correct answer.
// @include     http://www.wanikani.com/review*
// @include     https://www.wanikani.com/review*
// @require     https://unpkg.com/popper.js
// @require     https://unpkg.com/tippy.js
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
    var avg = window.localStorage.getItem('avg')
    if(avg) {
      return parseInt(avg);
    }
    return 60;
  } else {
    var avg = Math.floor(timer.current_time() / count)
    window.localStorage.setItem('avg', avg);
    return Math.floor(timer.current_time() / count);
  }
}

function get_estimated_completion() {
  var avg = get_average() * 1000;
  var d = Date.now();
  var completion_time = new Date(d + avg * parseInt($("#available-count").text()));
  return completion_time;
}

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
  return strTime;
}

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

var elem;
var est_elem;
var timer;
var avg_tippy;
function init() {
  elem = document.createElement('div');
  timer = new Stopwatch(elem);
  est_elem = document.createElement('div');
  est_elem.style.color = "white";
  est_elem.style.textShadow = "hsla(0, 0%, 0%, 0.4) 1px 1px 0px"
  avg_tippy = tippy(est_elem, {
    content: `Average Time Per Item: ${get_average()} seconds`,
    placement: 'bottom',
    arrow: true,
    arrowType: 'round',
    animation: 'fade',
  })
  document.getElementById('summary-button').appendChild(est_elem);
  timer.start();
}

$.jStorage.listenKeyChange('currentItem', function (key, action) {
    var message = `Completion Time: ${formatAMPM(get_estimated_completion())}`;
    est_elem.innerHTML = message;
    var tip_message = `Average Time Per Item: ${get_average()} seconds`
    var time = millisToMinutesAndSeconds(timer.current_time() * 1000);
    tip_message += `</br>Total Time: ${time}`
    avg_tippy.set({content: tip_message});
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
