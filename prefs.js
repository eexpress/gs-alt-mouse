'use strict';

const { Adw, Gio, Gtk, GObject, Soup, GLib, Rsvg } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const _ = ExtensionUtils.gettext;
const size = 128;

function init() {
	//~ ExtensionUtils.initTranslations();
}

function fillPreferencesWindow(window) {
	let page = Adw.PreferencesPage.new();
	let resource = Gio.Resource.load(Me.path + '/icon.gresource');
	Gio.resources_register(resource);
	page.add(new MyPrefs());
	window.set_default_size(500, 650);
	window.add(page);
}

class MyPrefs extends Adw.PreferencesGroup {
	static {
		GObject.registerClass(this);
	}
	constructor() {
		super();

		[
			[ 'mouse,scroll', 'act-switch', 'separator', 'mouse,scroll,alt', 'act-vol' ],
			[ 'mouse,button1', 'act-move', 'separator', 'mouse,button1,alt', 'act-max-h' ],
			[ 'mouse,button2', 'act-resize', 'separator', 'mouse,button2,alt', 'act-close' ],
			[ 'mouse,button3', 'act-min', 'separator', 'mouse,button3,alt', 'act-above' ],
		].forEach(e => this.add(new MyRow(...e)));
	}
}

class MyRow extends Adw.ActionRow {
	static {
		GObject.registerClass(this);
	}
	constructor(...args) {
		super();
		for (let i of args) {
			const da = new Gtk.DrawingArea({ content_height : size, content_width : size });
			da.set_draw_func((drawArea, cr, width, height) => {
				draw(cr, i);
			});
			this.add_suffix(da);
			//~ https://gnome.pages.gitlab.gnome.org/libadwaita/doc/main/visual-index.html#boxed-lists
		}
	}
}

function draw(cr, str) {
	if (str.indexOf(',') > 0) {
		const f = Gio.File.new_for_uri('resource:///img/mouse.svg');
		const hd = Rsvg.Handle.new_from_gfile_sync(f, Rsvg.HandleFlags.FLAGS_NONE, null);
		//~ const hd = Rsvg.Handle.new_from_file(Me.path + '/img/mouse.svg');
		for (let p of str.split(',')) {
			hd.render_cairo_sub(cr, `#${p}`);
		}
		hd.close();	 // need close manually?
		f.close();	// need close manually?
	} else {
		const f = Gio.File.new_for_uri(`resource:///img/${str}.svg`);
		const hd = Rsvg.Handle.new_from_gfile_sync(f, Rsvg.HandleFlags.FLAGS_NONE, null);
		//~ const hd = Rsvg.Handle.new_from_file(Me.path + `/img/${str}.svg`);
		//~ hd.render_cairo(cr);
		//~ cr.scale(0.5, 0.5);
		const vp = new Rsvg.Rectangle({ x : 0, y : 0, width : size, height : size });
		//~ hd.render_layer(cr, "#Device", vp);
		hd.render_document(cr, vp);
		hd.close();
		f.close();
	}
}
