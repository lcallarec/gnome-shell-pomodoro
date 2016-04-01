const GLib = imports.gi.GLib;
const St   = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Signals   = imports.signals;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter   = imports.gi.Clutter;
const MessageTray = imports.ui.messageTray;

const PomodoroTimer = new Lang.Class({
  Name: 'PomodoroTimer',

  _init: function(duration) {
    this._duration  = duration;
    this._elapsed   = 0;
    this._callback  = null;
    this._isPaused  = false;
    this._timerId   = null;
  },

  start: function() {
    this._isPaused = false;
    this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, Lang.bind(this, () => {
      this._elapsed++;
      this.emit('increment');
      if (this.remaining == 0) {
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

Signals.addSignalMethods(PomodoroTimer.prototype);

const Pomodoro = new Lang.Class({
  Name: 'Pomodoro',
  Extends: PanelMenu.Button,

  _init: function(timer) {
    PanelMenu.Button.prototype._init.call(this, 0.0);

    this._timer = timer;

    this._timer.connect('increment', Lang.bind(this, function() {
      this._label.set_text(this._timer.time);
      print("increment");
    }));

    this._timer.connect('ended', Lang.bind(this, function() {
      this._notifySend("Cycle is ended", "Take a 5 minutes rest !", "emblem-important-symbolic");
      print("ended in Pomodoro");
    }));

    let hbox = new St.BoxLayout({
      style_class: 'panel-status-menu-box'}
    );

    this._label = new St.Label({
      text: this._timer.time,
      y_align: Clutter.ActorAlign.CENTER
    });

    this._icon  = new St.Icon({
      style_class: 'pomodoro-status-icon'
    });

    hbox.add_actor(this._label);
    hbox.add_actor(this._icon);

    this.actor.add_actor(hbox);
    this.actor.add_style_class_name('panel-status-button');

    Main.panel.addToStatusArea('Pomodoro', this);

    this._buildPopupMenu();
  },

  _buildPopupMenu: function() {

    this.menu.removeAll();

    this._menuActionRow = new PopupMenu.PopupBaseMenuItem({
      reactive: false
    });

    this._menuActionRowBox = new St.BoxLayout({
      style_class: 'pomodoro-button-box'
    });

    this._playPauseButton = this._createPlayPauseShellButton();
    this._resetButton     = this._createResetShellButton();

    this._menuActionRowBox.add_actor(this._playPauseButton);
    this._menuActionRowBox.add_actor(this._resetButton);

    this._menuActionRow.actor.add_actor(this._menuActionRowBox);

    this.menu.addMenuItem(this._menuActionRow);
  },

  getPlayPauseIconName: function() {
    return this._timer.isStarted() ? "media-playback-pause-symbolic" : "media-playback-start-symbolic";
  },

  _createPlayPauseShellButton: function() {

    let button = this._createShellButton(
      this.getPlayPauseIconName(),
      this._timer.isStarted() ? "pause" : "start"
    );

    button.connect('clicked', Lang.bind(this, () => {

      if (this._timer.isStarted()) {
        this._timer.pause();
      } else {
        if (this._timer.isPaused()) {
          this._timer.unpause();
        } else {
          this._timer.start();
        }
      }

      this._setPlayPauseShellButtonIcon();

    }));

    return button;
  },

  _createResetShellButton: function() {
    let button = this._createShellButton(
      "view-refresh-symbolic",
      "reset timer"
    );

    button.connect('clicked', Lang.bind(this, () => {
      this._timer.reset();
      this._label.set_text(this._timer.time);
      this._setPlayPauseShellButtonIcon();
    }));

    return button;
  },

  _createShellButton: function(iconName, accessibleName) {

      let button = new St.Button({
          reactive: true,
          can_focus: true,
          track_hover: true,
          accessible_name: accessibleName,
          style_class: 'system-menu-action'
      });

      button.child = new St.Icon({
          icon_name: iconName
      });

      return button;
    },

  _setPlayPauseShellButtonIcon: function() {

    let iconName;

    if (this._timer.isStarted()) {
      iconName = "media-playback-pause-symbolic"
    } else {
      iconName = "media-playback-start-symbolic"
    }

    this._playPauseButton.child = new St.Icon({
        icon_name: iconName
    });
  },

  _notifySend: function(summary, body, iconName) {

    let source = new MessageTray.Source("Pomodoro applet", iconName);

    Main.messageTray.add(source);

    let notification = new MessageTray.Notification(source, summary, body);
    notification.setResident(true);

    source.notify(notification);
  },

});

const PomodoroTimerTransition = {
  FOCUS       : 0,
  SHORT_BREAK : 1,
  LONG_BREAK  : 2
};

const PomodoroTimerTransitions = new Lang.Class({
  Name: 'PomodoroTimerTransitions',

  _init: function() {
    this._steps = [];
    this._i     = 0;
  },

  add: function (transition, duration) {
    this._steps.push({transition: transition, duration: duration});
  },

  next: function() {
    return {transition: PomodoroTimerTransition.FOCUS, duration: 0.1 * 60};
  },

  get current() {
    return {transition: PomodoroTimerTransition.FOCUS, duration: 0.1 * 60};
  }

});

const PomodoroTimerCycle = new Lang.Class({
  Name: 'PomodoroTimerCycle',

  _init: function(transitions) {
    this._transitions = transitions;
    this._invokeTimer();
  },

  _invokeTimer: function() {
    this._timer = new PomodoroTimer(this._transitions.current.duration);

    this._timer.connect('increment', Lang.bind(this, () => {
      this.emit('increment');
    }));

    this._timer.connect('ended', Lang.bind(this, () => {
      this.emit('ended');
    }));
  },

  start: function() {
      this._timer.start();
      print("started in PomodoroTimerCycle");
      this._timer.connect('ended', Lang.bind(this, () => {
        this._transitions.next();
      print("ended in PomodoroTimerCycle");
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

Signals.addSignalMethods(PomodoroTimerCycle.prototype);

let transitions;
let pomodoro;
let timer;

function enable() {
  transitions = new PomodoroTimerTransitions();
  timerCycle  = new PomodoroTimerCycle(transitions);
  pomodoro = new Pomodoro(timerCycle);
}

function disable() {
  timer.stop();
  pomodoro.destroy();
}
