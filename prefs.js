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
			//~ const img = new Gtk.Image({ gicon : Gio.Icon.new_for_string(`resource:///img/${i}.svg`), pixel_size : 128 });
			//~ this.add_prefix(img);
			const bin = new Adw.Bin();
			const img = new Gtk.DrawingArea();
			img.set_draw_func( (drawArea, cr, width, height) => {
				draw(cr, i);
			});
			bin.set_child(img);
			this.add_suffix(bin);
			//~ https://gnome.pages.gitlab.gnome.org/libadwaita/doc/main/visual-index.html#boxed-lists
		}
	}
}

function draw(cr, str) {
	if (str.indexOf(',') > 0) {
		const hd = Rsvg.Handle.new_from_file(Me.path + '/img/mouse.svg');
		//~ const hd = Rsvg.Handle.new_from_file('/home/eexpss/alt-mouse-button.svg');
		for (let p of str.split(',')) {
			log(p);
			hd.render_cairo_sub(cr, `#${p}`);
		}
	} else {
		const hd = Rsvg.Handle.new_from_file(Me.path + `/img/${str}.svg`);
		log(str);
		hd.render_cairo(cr);
	}
	//~ cr.paint();
	//~ const vp = new Rsvg.Rectangle({ x : 0, y : 0, width : size, height : size });
	//~ hd.render_layer(cr, "#Device", vp);
	//~ hd.render_document(cr, vp);
}
