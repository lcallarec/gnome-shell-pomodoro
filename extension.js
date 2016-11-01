/* eslint no-unused-vars: ["error", { "vars": "local" }] */
/* global enable:true, disable: true */

const St   = imports.gi.St;
const Gio  = imports.gi.Gio;
const Main = imports.ui.main;
const Lang = imports.lang;
const Gst  = imports.gi.Gst;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter   = imports.gi.Clutter;
const Util      = imports.misc.util;
const MessageTray = imports.ui.messageTray;

const ExtensionUtils = imports.misc.extensionUtils;
const Me             = ExtensionUtils.getCurrentExtension();
const Convenience    = Me.imports.convenience;
const Timer          = Me.imports.timer;

/**
* Gnome shell extension adding Pomodoro timer feature to the shell.
*
* Thanks for the tomatoes !
*
* @author Laurent Callarec l.callarec@gmail.com
*/
const Pomodoro = new Lang.Class({
  Name: 'Pomodoro',
  Extends: PanelMenu.Button,

  _init: function() {
    PanelMenu.Button.prototype._init.call(this, 0.0);

    this._initTimer();

    this.hbox = new St.BoxLayout({
      style_class: 'panel-status-menu-box'}
    );

    this._label = new St.Label({
      text: this._timer.time,
      y_align: Clutter.ActorAlign.CENTER
    });

    this._icon = new St.Icon({
      gicon: Gio.icon_new_for_string(Me.path + "/assets/pomodoro-symbolic.svg"),
      icon_size: 12
    });

    this.hbox.add_actor(this._label);
    this.hbox.add_actor(this._icon);

    this.actor.add_actor(this.hbox);
    this.actor.add_style_class_name('panel-status-button');

    Main.panel.addToStatusArea('Pomodoro', this);

    this._buildPopupMenu();
  },

  _initTimer: function() {

    if (this._timer != undefined) {
      this._timer.stop();
    }

    this._settings = this._getApplicationSettings();
    this._timer = this._getTimerFromSettings(this._settings);

    this._timer.connect('increment', Lang.bind(this, function() {
      this._label.set_text(this._timer.time);
    }));

    this._timer.connect('start', Lang.bind(this, function() {
      this._label.set_text(this._timer.time);
    }));

    this._timer.connect('nextTransitionStarted', Lang.bind(this, function(emitter, currentTransition) {
      this._notifySend("Cycle is ended", HumanTransition.getSentence(currentTransition.transition, currentTransition.duration), "emblem-important-symbolic");
      this._bell();
    }));
  },

  _buildPopupMenu: function() {

    this.menu.removeAll();

    this._menuActionRowTop = new PopupMenu.PopupBaseMenuItem({
      reactive: false
    });

    this._menuActionRowBoxTop = new St.BoxLayout({
      style_class: 'pomodoro-button-box'
    });

    this._playPauseButton = this._createPlayPauseShellButton();
    this._resetButton     = this._createResetShellButton();

    this._menuActionRowBoxTop.add(this._playPauseButton);
    this._menuActionRowBoxTop.add(this._resetButton);

    this._menuActionRowTop.actor.add_actor(this._menuActionRowBoxTop);

    this.menu.addMenuItem(this._menuActionRowTop);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    this.menu.addMenuItem(this._createPrefsPopupMenuItem());
  },

  getPlayPauseIconName: function() {
    return this._timer.isStarted() ? "media-playback-pause-symbolic" : "media-playback-start-symbolic";
  },

  destroy: function() {

    delete this.hbox;

    this.parent.destroy();
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

      this._initTimer();

      this._label.set_text(this._timer.time);
      this._setPlayPauseShellButtonIcon();

    }));

    return button;
  },

  _createPrefsPopupMenuItem: function() {

      let menu = new PopupMenu.PopupMenuItem("Open settings...");

      menu.connect('activate', Lang.bind(this, () => {
        Util.spawn(["gnome-shell-extension-prefs", Me.metadata.uuid]);
      }));

      return menu;
  },

  _createShellButton: function(iconName, accessibleName) {

      const config = {
          reactive: true,
          can_focus: true,
          track_hover: true,
          accessible_name: accessibleName,
          style_class: 'system-menu-action',
          label: accessibleName
      };

      let button = new St.Button(config);

      if (iconName) {
        button.child = new St.Icon({
            icon_name: iconName
        });
      }

      return button;
    },

  _setPlayPauseShellButtonIcon: function() {
    this._playPauseButton.child = new St.Icon({
      icon_name: this.getPlayPauseIconName()
    });
  },

  _notifySend: function(summary, body, iconName) {

    let source = new MessageTray.Source("Pomodoro applet", iconName);

    Main.messageTray.add(source);

    let notification = new MessageTray.Notification(source, summary, body, {
      gicon: Gio.icon_new_for_string(Me.path + "/assets/pomodoro-symbolic.svg")
    });

    notification.setTransient(true);

    source.notify(notification);
  },

  _bell: function() {
    if (typeof this.player == 'undefined') {
        Gst.init(null, 0);
        this.player  = Gst.ElementFactory.make("playbin", "player");
        this.playBus = this.player.get_bus();
        this.playBus.add_signal_watch();
        this.playBus.connect("message", Lang.bind(this,
        function(playBus, message) {
            if (message != null) {
                // IMPORTANT: to reuse the player, set state to READY
                let t = message.type;
                if ( t == Gst.MessageType.EOS || t == Gst.MessageType.ERROR) {
                    this.player.set_state(Gst.State.READY);
                }
            }
        }));
    } // if undefined
    this.player.set_property('uri', this._settings.soundFile);
    this.player.set_state(Gst.State.PLAYING);
  },

  _getApplicationSettings: function() {

    let _gsettings = Convenience.getSettings('org.gnome.shell.extensions.pomodoro');

    var settings = {
        cycles: [
          {type: Timer.Transitions.FOCUS, duration: _gsettings.get_int('focus-duration')},
          {type: Timer.Transitions.SHORT_BREAK, duration: _gsettings.get_int('short-break-duration')},
          {type: Timer.Transitions.FOCUS, duration: _gsettings.get_int('focus-duration')},
          {type: Timer.Transitions.SHORT_BREAK, duration: _gsettings.get_int('short-break-duration')},
          {type: Timer.Transitions.FOCUS, duration: _gsettings.get_int('focus-duration')},
          {type: Timer.Transitions.SHORT_BREAK, duration: _gsettings.get_int('short-break-duration')},
          {type: Timer.Transitions.FOCUS, duration: _gsettings.get_int('focus-duration')},
          {type: Timer.Transitions.LONG_BREAK, duration: _gsettings.get_int('long-break-duration')},
        ],
        soundFile: _gsettings.get_string('sound-endcycle')
    };

    return settings;
  },

  _getTimerFromSettings: function(settings) {
    let transitions = new Timer.TransitionHandler();
    for (let cycle of settings.cycles) {
      transitions.add(cycle.type, cycle.duration);
    }

    return new Timer.Cycle(transitions);
  }
});

const HumanTransition = {

  getSentence: function(transition, seconds) {
    let duration  = this.prettifyDuration(seconds);
    let sentences = {
      0 : "Enjoy the incomming " + duration + " Pomodoro working time !",
      1 : duration + " Pomodoro short break !",
      2 : duration + " Pomodoro long break !"
    };

    return sentences[transition];
  },

  prettifyDuration: function(seconds) {

    let MINUTE_S  = 60;
    let HOUR_S    = 60 * MINUTE_S;
    let DAY_S     = 24 * HOUR_S;
    let WEEK_S    = 7  * DAY_S;
    let MONTH_S   = 30 * DAY_S;

    let lookup = ["months", "weeks", "days", "hours", "minutes", "seconds"];
    let values = [];

    values.push(seconds / MONTH_S);   seconds %= MONTH_S;
    values.push(seconds / WEEK_S);    seconds %= WEEK_S;
    values.push(seconds / DAY_S);     seconds %= DAY_S;
    values.push(seconds / HOUR_S);    seconds %= HOUR_S;
    values.push(seconds / MINUTE_S);  seconds %= MINUTE_S;
    values.push(seconds);             seconds %= 1;

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

let pomodoro;

function enable() {
  pomodoro = new Pomodoro();
}

function disable() {
  pomodoro.destroy();
}
