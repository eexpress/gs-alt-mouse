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
	window.set_default_size(500, 850);
	let resource = Gio.Resource.load(Me.path + '/icon.gresource');
	Gio.resources_register(resource);

	let page = Adw.PreferencesPage.new();
	page.add(new pGroup());
	window.add(page);
}

class pGroup extends Adw.PreferencesGroup {
	static {
		GObject.registerClass(this);
	}
	constructor() {
		super();
		const _carousel = new Adw.Carousel();
		_carousel.spacing = 10;
		_carousel.append(new pSetting());
		_carousel.append(new pAction());
		this.add(_carousel);
		const cil = new Adw.CarouselIndicatorLines();
		cil.set_carousel(_carousel);
		this.add(cil);
	}
}

class pAction extends Adw.PreferencesGroup {
	static {
		GObject.registerClass(this);
	}
	constructor() {
		super();
		[
			['Above', 'window may placed in the "above" layer.'],
			['Move', 'window may be moved around the screen.'],
			['Resize', 'window may be resized.'],
			['Switch', 'Scroll Mouse to switch windows.'],
			['Vol', 'Scroll Mouse to increase/decrease volumn.'],
			['Max', 'window may be maximized.'],
			['Max-H', 'window may be maximized horizontally.'],
			['Min', 'window may be iconified.'],
			['Close', 'window may be closed.'],
			['Full', 'window may be brought to fullscreen state.'],
			['Lower', 'window may placed in the "below" layer'],
			//~ ['Shade', 'window may be shaded.'],
			//~ ['Stick', 'window may have its sticky state toggled.'],
		].forEach(e => {
			const ar = new Adw.ActionRow();
			ar.set_title(e[0]);
			ar.set_subtitle(e[1]);
			const img = new Gtk.Image({gicon: Gio.Icon.new_for_string(`resource:///img/act-${e[0].toLowerCase()}.svg`), pixel_size: 64});
			ar.add_suffix(img);
			this.add(ar);
		});
	}
}

class pSetting extends Adw.PreferencesGroup {
	static {
		GObject.registerClass(this);
	}
	constructor() {
		super();
		const ar = new Adw.ActionRow();
		ar.set_title('Mouse Setting');
		ar.set_subtitle('Scroll to next page to see All Actions.');
		this.add(ar);

		[
			[ 'mouse,scroll', 'act-switch', 'separator', 'mouse,scroll,alt', 'act-vol' ],
			[ 'mouse,button1', 'act-move', 'separator', 'mouse,button1,alt', 'act-max-h' ],
			[ 'mouse,button2', 'act-resize', 'separator', 'mouse,button2,alt', 'act-close' ],
			[ 'mouse,button3', 'act-min', 'separator', 'mouse,button3,alt', 'act-above' ],
		//~ ].forEach(e => this.add(new MyRow(...e)));
		].forEach(e => {
			const ar = new Adw.ActionRow();
			for (let i of e) {
				const da = new Gtk.DrawingArea({ content_height : size, content_width : size });
				da.set_draw_func((drawArea, cr, width, height) => {
					draw(cr, i);
				});
				ar.add_suffix(da);
			}
			this.add(ar);
		});
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
	}
}
