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

var Stopwatch = function() {

  var offset,
      clock,
      interval;

  // initialize
  reset();

  function start() {
    if (!interval) {
      offset   = Date.now();
      interval = setInterval(update);
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
  }

  function update() {
    clock += delta();
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
  // Retrieves average from previous session if one isn't available
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

function updateTippy() {
  var tip_message = `Average Time Per Item: ${current_average} seconds`
  var time = millisToMinutesAndSeconds(timer.current_time() * 1000);
  tip_message += `</br>Total Time: ${time}`
  est_tippy.setContent(tip_message);
}

var est_elem;
var timer;
var est_tippy;
var current_average;
function init() {
  timer = new Stopwatch();
  est_elem = document.createElement('div');
  est_elem.style.color = "white";
  est_elem.style.textShadow = "hsla(0, 0%, 0%, 0.4) 1px 1px 0px"
  est_tippy = tippy(est_elem, {
    content: `Average Time Per Item: ${get_average()} seconds`,
    placement: 'bottom',
    arrow: true,
    arrowType: 'round',
    animation: 'fade',
    onShow: updateTippy,
  })
  document.getElementById('summary-button').appendChild(est_elem);
  timer.start();
}

$.jStorage.listenKeyChange('currentItem', function (key, action) {
    var message = `Est. Completion Time: ${formatAMPM(get_estimated_completion())}`;
    est_elem.innerHTML = message;
    current_average = get_average();
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
