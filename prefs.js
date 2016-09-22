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

function buildPrefsWidget() {

  let _settings = getSettings();

  let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, border_width: 10});

  let grid = new Gtk.Grid();

  grid.set_row_spacing(10);
  grid.set_column_spacing(10);

	frame.pack_start(grid, true, true, 0);

	let focusSpin  = Gtk.SpinButton.new_with_range(0, 60, 1);
  focusSpin.value = _settings.get_int('focus-duration') / 60;
  focusSpin.connect("value-changed", Lang.bind (this, () => {
    setSetting("focus-duration", focusSpin.value)
  }));

  grid.attach(new Gtk.Label({label: "Focus duration (minutes)"}), 0, 0, 1, 1)
  grid.attach(focusSpin, 1, 0, 1, 1);

  grid.attach(new Gtk.Separator({orientation: Gtk.Orientation.HORIZONTAL}), 0, 1, 2, 1);

  let shortBreakSpin  = Gtk.SpinButton.new_with_range(0, 60, 1);
  shortBreakSpin.value = _settings.get_int('short-break-duration') / 60
  shortBreakSpin.connect("value-changed", Lang.bind (this, () => {
    setSetting("short-break-duration", shortBreakSpin.value)
  }));

  grid.attach(new Gtk.Label({label: "Short break duration (minutes)"}), 0, 2, 1, 1)
  grid.attach(shortBreakSpin, 1, 2, 1, 1);

  let longBreakSpin  = Gtk.SpinButton.new_with_range(0, 60, 1);
  longBreakSpin.value = _settings.get_int('long-break-duration') / 60;
  longBreakSpin.connect("value-changed", Lang.bind (this, () => {
    setSetting("long-break-duration", longBreakSpin.value)
  }));

  grid.attach(new Gtk.Label({label: "Long break duration (minutes)"}), 0, 3, 1, 1);
  grid.attach(longBreakSpin, 1, 3, 1, 1);

  frame.show_all();

  return frame;
}

function setSetting(setting, value) {
  getSettings().set_int(setting, value * 60);
}

function init() {
  return null;
}

function getSettings() {
  return Convenience.getSettings('org.gnome.shell.extensions.pomodoro');
}
