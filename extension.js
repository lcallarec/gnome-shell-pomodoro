const GLib = imports.gi.GLib;
const St   = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Signals   = imports.signals;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter   = imports.gi.Clutter;
const MessageTray = imports.ui.messageTray;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Timer = Me.imports.timer;

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

    this._timer.connect('start', Lang.bind(this, function() {
      this._label.set_text(this._timer.time);
      print("start");
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


const HumanTime = {

  prettify: function(seconds) {

    let MINUTE_S = 60;
    let HOUR_S   = 60 * MINUTE_S;
    let DAY_S    = 24 * HOUR_S;
    let WEEK_S   = 7 * DAY_S;
    let MONTH_S  = 30 * DAY_S;

    let lookup = ["months", "weeks", "days", "hours", "minutes"];
    let values = [];

    values.push(seconds / MONTH_S);  seconds %= MONTH_S;
    values.push(seconds / WEEK_S);   seconds %= WEEK_S;
    values.push(seconds / DAY_S);    seconds %= DAY_S;
    values.push(seconds / HOUR_S);   seconds %= HOUR_S;
    values.push(seconds / MINUTE_S); seconds %= MINUTE_S;

    var pretty = "";
    for(let i=0 ; i < values.length; i++) {
      let val = Math.round(values[i]);
      if(val <= 0) continue;

      pretty += val + " " + lookup[i];
        break;
      }

    return pretty;
  },
};

let transitions;
let pomodoro;
let timer;

function enable() {
  transitions = new Timer.TransitionHandler();
  transitions.add(Timer.Transitions.FOCUS, 10);
  transitions.add(Timer.Transitions.SHORT_BREAK, 5);
  transitions.add(Timer.Transitions.FOCUS, 7);

  timerCycle  = new Timer.Cycle(transitions);
  pomodoro    = new Pomodoro(timerCycle);
}

function disable() {
  timer.stop();
  pomodoro.destroy();
}
