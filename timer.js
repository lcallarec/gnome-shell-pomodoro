const Lang    = imports.lang;
const Signals = imports.signals;
const GLib    = imports.gi.GLib;

const Timer = new Lang.Class({
  Name: 'Timer',

  _init: function(duration) {
    this._duration  = duration;
    this._elapsed   = 0;
    this._callback  = null;
    this._isPaused  = false;
    this._timerId   = null;
  },

  start: function() {
    this.emit('start');
    this._isPaused = false;
    this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, Lang.bind(this, () => {
      this._elapsed++;
      this.emit('increment');
      if (this.remaining == -1) {
        this.stop();
        this.emit('ended');
        return false;
      }
      return true;
    }));
  },

  stop: function() {
    if (this._timerId != null) {
       GLib.source_remove(this._timerId);
       this._timerId = null;
    }
  },

  pause: function() {
    this.stop();
    this._isPaused = true;
  },

  unpause: function() {
    this.start();
    this._isPaused = false;
  },

  reset: function() {
    this._elapsed  = 0;
    this._isPaused = false;
    this.stop();
  },

  isStarted: function() {
    return null != this._timerId;
  },

  isPaused: function() {
    return this._isPaused;
  },

  get duration() {
    return this._duration;
  },

  get elapsed() {
    return this._elapsed;
  },

  get remaining() {
    return this._duration - this._elapsed;
  },

  get time() {
    let seconds = this.remaining % 60;
    seconds = seconds <= 0 ? "00" : seconds;
    seconds = (seconds < 10 && seconds != "00") ? "0" + seconds : seconds;

    let minutes = Math.floor((this.remaining / 60) % 60);

    minutes = minutes < 0 ? "0" : minutes;

    return minutes + ':' + seconds;
  }

});

const Transitions = {
  FOCUS       : 0,
  SHORT_BREAK : 1,
  LONG_BREAK  : 2
};

const TransitionHandler = new Lang.Class({
  Name: 'TransitionHandler',

  _init: function() {
    this._transitions = [];
    this._i = 0;
  },

  add: function (transition, duration) {
    this._transitions.push({transition: transition, duration: duration});
  },

  next: function() {
    this._i++;

    if (this._i >= this._transitions.length) {
      this._i = 0;
    }
  },

  get current() {
    return this._transitions[this._i];
  }

});

const Cycle = new Lang.Class({
  Name: 'Cycle',

  _init: function(transitions) {
    this._transitions = transitions;
    this._invokeTimer();
  },

  _invokeTimer: function() {
    this._timer = new Timer(this._transitions.current.duration);

    this._timer.connect('increment', Lang.bind(this, () => {
      this.emit('increment');
    }));

    this._timer.connect('start', Lang.bind(this, () => {
      this.emit('start');
    }));

    this._timer.connect('ended', Lang.bind(this, () => {
      this.emit('ended');
    }));
  },

  start: function() {
      this._timer.start();
      print("started in Cycle");
      this._timer.connect('ended', Lang.bind(this, () => {
        this._transitions.next();
        this.emit('nextTransitionStarted', this._transitions.current);
      print("ended in Cycle");
        this._invokeTimer();
        this.start();
      }));
  },

  stop: function() {
    return this._timer.stop();
  },

  pause: function() {
    return this._timer.pause();
  },

  unpause: function() {
    return this._timer.unpause();
  },

  reset: function() {
    return this._timer.reset();
  },

  isStarted: function() {
    return this._timer.isStarted();
  },

  isPaused: function() {
    return this._timer.isPaused();
  },

  get duration() {
    return this._timer.duration;
  },

  get elapsed() {
    return this._timer.elapsed;
  },

  get remaining() {
    return this._timer.remaining;
  },

  get time() {
    return this._timer.time;
  },

  get timer() {
    return this._timer;
  }
});

Signals.addSignalMethods(Cycle.prototype);
Signals.addSignalMethods(Timer.prototype);
