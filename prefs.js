/* eslint no-unused-vars: ["error", { "vars": "local" }] */
/* global buildPrefsWidget:true, init:true */

/**
* Prefs.js
*
* Thanks for the tomatoes !
*
* @author Laurent Callarec l.callarec@gmail.com
*/

const Lang           = imports.lang;
const Gtk            = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me             = ExtensionUtils.getCurrentExtension();
const Convenience    = Me.imports.convenience;

function init() {
  return null;
}

const Settings = {
  all: function() {
    return Convenience.getSettings('org.gnome.shell.extensions.pomodoro');
  },
  set: function (setting, value) {
    Settings.all().set_int(setting, value * 60);
  }
}

function buildPrefsWidget() {

  let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, border_width: 10});

  let grid = new Gtk.Grid();

  grid.set_row_spacing(10);
  grid.set_column_spacing(10);

	frame.pack_start(grid, true, true, 0);

	let focusSpin  = Gtk.SpinButton.new_with_range(0, 60, 1);
  focusSpin.value = Settings.all().get_int('focus-duration') / 60;
  focusSpin.connect("value-changed", Lang.bind (this, () => {
    Settings.set("focus-duration", focusSpin.value)
  }));

  let fdLabel = new Gtk.Label({label: "Focus duration (minutes)"});
  fdLabel.set_hexpand(true);
  fdLabel.set_halign(Gtk.Align.END);


  grid.attach(fdLabel, 0, 0, 1, 1)
  grid.attach(focusSpin, 1, 0, 1, 1);

  grid.attach(new Gtk.Separator({orientation: Gtk.Orientation.HORIZONTAL}), 0, 1, 2, 1);

  let shortBreakSpin  = Gtk.SpinButton.new_with_range(0, 60, 1);
  shortBreakSpin.value = Settings.all().get_int('short-break-duration') / 60
  shortBreakSpin.connect("value-changed", Lang.bind (this, () => {
    Settings.set("short-break-duration", shortBreakSpin.value)
  }));

  let sdLabel = new Gtk.Label({label: "Short break duration (minutes)"});
  sdLabel.set_hexpand(true);
  sdLabel.set_halign(Gtk.Align.END);

  grid.attach(sdLabel, 0, 2, 1, 1)
  grid.attach(shortBreakSpin, 1, 2, 1, 1);

  let longBreakSpin  = Gtk.SpinButton.new_with_range(0, 60, 1);
  longBreakSpin.value = Settings.all().get_int('long-break-duration') / 60;
  longBreakSpin.connect("value-changed", Lang.bind (this, () => {
    Settings.set("long-break-duration", longBreakSpin.value)
  }));

  let ldLabel = new Gtk.Label({label: "Long break duration (minutes)"});
  ldLabel.set_hexpand(true);
  ldLabel.set_halign(Gtk.Align.END);

  grid.attach(ldLabel, 0, 3, 1, 1);
  grid.attach(longBreakSpin, 1, 3, 1, 1);

  frame.show_all();

  return frame;
}
