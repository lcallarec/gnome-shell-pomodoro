const GLib = imports.gi.GLib;
const St   = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter   = imports.gi.Clutter;

const PomodoroTimer = new Lang.Class({
  Name: 'PomodoroTimer',

  _init : function(duration) {
    this._duration  = duration;
    this._elapsed   = 0;
    this._timerId   = null;
  },

  start : function(callback) {
    this.reset();
    this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, Lang.bind(this, () => {
      this._elapsed++;
      callback();
      return true;
    }));
  },

  stop : function() {
    if (this._timerId != null) {
       GLib.source_remove(this._timerId);
       this._timerId = null;
    }
  },

  reset: function() {
    this._elapsed  = 0;
    this.stop();
  },

  isStarted: function() {
    return null != this._timerId;
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
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    let minutes = Math.floor((this.remaining / 60) % 60);

    return minutes + ':' + seconds;
  }

});

const Pomodoro = new Lang.Class({
  Name: 'Pomodoro',
  Extends: PanelMenu.Button,

  _init: function(timer) {
    PanelMenu.Button.prototype._init.call(this, 0.0);

    this._timer = timer;

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

    this.actor.connect('button-press-event', Lang.bind(this, function() {

      this.menu.removeAll();

      let item = new PopupMenu.PopupSwitchMenuItem("Play", this._timer.isStarted());
      item.connect('toggled', Lang.bind(this, function() {

        if (this._timer.isStarted()) {
          this._timer.stop();
        } else {
          this._timer.start(Lang.bind(this, function() {
            this._label.set_text(this._timer.time)
          }));
        }

 	    }));

      this.menu.addMenuItem(item);

    }));

    Main.panel.addToStatusArea('Pomodoro', this);
  },
});

let pomodoro;
let timer;

function enable() {
  timer    = new PomodoroTimer(25 * 60);
  pomodoro = new Pomodoro(timer);
}

function disable() {
  timer.stop();
  pomodoro.destroy();
}
