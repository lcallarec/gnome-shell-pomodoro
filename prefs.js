/**
* Prefs.js
*
* Thanks for the tomatoes !
*
* @author Laurent Callarec l.callarec@gmail.com
*/

const Gtk = imports.gi.Gtk;

function buildPrefsWidget() {
	
    let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, border_width: 10});
	
    frame.show_all();

    return frame;
	
}

function init() {
    return null;
}
