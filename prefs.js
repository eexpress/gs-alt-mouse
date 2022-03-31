'use strict';

const { Adw, Gio, Gtk, GObject, Soup, GLib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const _ = ExtensionUtils.gettext;

function init() {
	//~ ExtensionUtils.initTranslations();
}

function fillPreferencesWindow(window) {
	let page = Adw.PreferencesPage.new();
	let resource = Gio.Resource.load(Me.path + '/icon.gresource');
	Gio.resources_register(resource);
	page.add(new MyPrefs());
	window.set_default_size(500, 550);
	window.add(page);
}

class MyPrefs extends Adw.PreferencesGroup {
	static {
		GObject.registerClass(this);
	}
	constructor() {
		super();

		[
			[ 'm45', 'act-switch', 's-symbolic', 'am45', 'act-vol' ],
			[ 'm1', 'act-move', 's-symbolic', 'am1', 'act-max-h' ],
			[ 'm2', 'act-resize', 's-symbolic', 'am2', 'act-close' ],
			[ 'm3', 'act-min', 's-symbolic', 'am3', 'act-above' ],
		].forEach(e => this.add(new MyRow(...e)));
	}

}

class MyRow extends Adw.ActionRow {
	static {
		GObject.registerClass(this);
	}
	constructor(...args) {
		super();
		for(let i of args){
			const img = new Gtk.Image({gicon: Gio.Icon.new_for_string(`resource:///img/${i}.svg`), pixel_size: 128});
			//~ this.add_prefix(img);
			this.add_suffix(img);
		}
	}
}
