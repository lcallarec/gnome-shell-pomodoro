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

  let row1 = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, border_width: 10});

	let focusLabel = new Gtk.Label({label: "Focus duration (minutes)"});
	let focusSpin  = Gtk.SpinButton.new_with_range(0, 60, 1);
  focusSpin.value = _settings.get_int('focus-duration') / 60;
  focusSpin.connect("value-changed", Lang.bind (this, () => {
    setSetting("focus-duration", focusSpin.value)
  }));

	let sep = new Gtk.Separator({orientation: Gtk.Orientation.HORIZONTAL});

  let row2 = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, border_width: 10});

	let shortBreakLabel = new Gtk.Label({label: "Short break duration (minutes)"});
	let shortBreakSpin  = Gtk.SpinButton.new_with_range(0, 60, 1);
  shortBreakSpin.value = _settings.get_int('short-break-duration') / 60
  shortBreakSpin.connect("value-changed", Lang.bind (this, () => {
    setSetting("short-break-duration", shortBreakSpin.value)
  }));

  let row3 = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, border_width: 10});

	let longBreakLabel = new Gtk.Label({label: "Long break duration (minutes)"});
	let longBreakSpin  = Gtk.SpinButton.new_with_range(0, 60, 1);
  longBreakSpin.value = _settings.get_int('long-break-duration') / 60;
  longBreakSpin.connect("value-changed", Lang.bind (this, () => {
    setSetting("long-break-duration", longBreakSpin.value)
  }));

	row1.pack_start(focusLabel, false, false, 5);
	row1.pack_start(focusSpin, false, false, 5);
	row2.pack_start(shortBreakLabel, false, false, 5);
	row2.pack_start(shortBreakSpin, false, false, 5);
  row3.pack_start(longBreakLabel, false, false, 5);
	row3.pack_start(longBreakSpin, false, false, 5);

	frame.pack_start(row1, true, true, 0);
	frame.pack_start(sep, true, true, 0);
	frame.pack_start(row2, true, true, 0);
  frame.pack_start(row3, true, true, 0);

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
