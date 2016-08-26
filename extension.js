const GLib = imports.gi.GLib;
const St   = imports.gi.St;
const Gio  = imports.gi.Gio;
const Main = imports.ui.main;
const Lang = imports.lang;
const Gst  = imports.gi.Gst;
const Signals   = imports.signals;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter   = imports.gi.Clutter;
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

    this._timer.connect('nextTransitionStarted', Lang.bind(this, function(emitter, currentTransition) {
      this._notifySend("Cycle is ended", HumanTransition.getSentence(currentTransition.transition, currentTransition.duration), "emblem-important-symbolic");
      this._bell();
    }));

    let hbox = new St.BoxLayout({
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

  destroy: function() {



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
    this.player.set_property('uri', Settings.soundFile);
    this.player.set_state(Gst.State.PLAYING);
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
    print(seconds);
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


let _settings = Convenience.getSettings('org.gnome.shell.extensions.pomodoro');

let Settings = {
    cycles: [
		{type: Timer.Transitions.FOCUS, duration: 25 * 60},
		{type: Timer.Transitions.SHORT_BREAK, duration: 5 * 60},
		{type: Timer.Transitions.FOCUS, duration: 25 * 60},
		{type: Timer.Transitions.SHORT_BREAK, duration: 5 * 60},
		{type: Timer.Transitions.FOCUS, duration: 25 * 60},
		{type: Timer.Transitions.SHORT_BREAK, duration: 5 * 60},
		{type: Timer.Transitions.FOCUS, duration: 25 * 60},
		{type: Timer.Transitions.LONG_BREAK, duration: 10 * 60},
	],
	soundFile: _settings.get_string('sound-endcycle')
};

let transitions;
let pomodoro;
let timerCycle;
let timer;

function enable() {

  transitions = new Timer.TransitionHandler();
  for (let cycle of Settings.cycles) {
    transitions.add(cycle.type, cycle.duration);
  }

  timerCycle  = new Timer.Cycle(transitions);
  pomodoro    = new Pomodoro(timerCycle);
}

function disable() {
  timer.stop();
  pomodoro.destroy();
}
