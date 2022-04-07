'use strict';

const { Adw, Gio, Gtk, GObject, Soup, GLib, Rsvg } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const _ = ExtensionUtils.gettext;
const size = 128;
let _carousel;
let p0;
let p1;
let last_DA;
let settings;

function init() {
	ExtensionUtils.initTranslations();
}

function fillPreferencesWindow(window) {
	window.set_default_size(500, 800);
	let resource = Gio.Resource.load(Me.path + '/icon.gresource');
	Gio.resources_register(resource);
	settings = ExtensionUtils.getSettings();

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
		_carousel = new Adw.Carousel({ spacing : 10 });	 // nedd space
		p0 = new pSetting();
		_carousel.append(p0);
		p1 = new pAction();
		_carousel.append(p1);
		const cil = new Adw.CarouselIndicatorLines({ carousel : _carousel });
		this.add(cil);
		this.add(_carousel);
	}
}

class pAction extends Adw.PreferencesGroup {
	static {
		GObject.registerClass(this);
	}
	constructor() {
		super();
		[
			[ 'None', _('No Action.') ],
			[ 'Above', _('window may placed in the "above" layer.') ],
			[ 'Move', _('window may be moved around the screen.') ],
			[ 'Resize', _('window may be resized.') ],
			//~ [ 'Switch', 'Scroll Mouse to switch windows.' ],
			//~ [ 'Vol', 'Scroll Mouse to increase/decrease volumn.' ],
			[ 'Max', _('window may be maximized.') ],
			[ 'Max-H', _('window may be maximized vertically.') ],
			[ 'Min', _('window may be iconified.') ],
			[ 'Close', _('window may be closed.') ],
			//~ [ 'Full', 'window may be brought to fullscreen state.' ],
			[ 'Lower', _('window may placed in the "below" layer') ],
			//~ [ 'Shade', 'window may be shaded.' ],
			//~ [ 'Stick', 'window may have its sticky state toggled.' ],
		].forEach(e => {  // no space at end of string, justperfection
			const ar = new Adw.ActionRow();
			ar.set_title(e[0]);
			ar.set_subtitle(e[1]);
			const img = new Gtk.Image({ gicon : Gio.Icon.new_for_string(`resource:///img/act-${e[0].toLowerCase()}.svg`), pixel_size : 64 });
			ar.add_suffix(img);
			ar.set_activatable_widget(img);
			ar.connect('activated', (i) => {
				last_DA.act = i.title.toLowerCase();
				last_DA.queue_draw();
				//~ log('=== Alt Mouse ===> ' + last_DA.key + ' = ' + last_DA.act);
				settings.set_string(last_DA.key, last_DA.act);
				_carousel.scroll_to(p0, true);
			});
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
		let ar = new Adw.ActionRow();
		ar.set_title(_('Mouse Setting'));
		ar.set_subtitle(_('Click the picture below to modify the corresponding action. \nThe scroll function cannot be modified.\nThe next page lists all Actions. You can drag/2 fingers swip/scroll to show it.'));
		this.add(ar);

		[
			[ 'key-s', 'key-a-s' ],
			[ 'key-1', 'key-a-1' ],
			[ 'key-2', 'key-a-2' ],
			[ 'key-3', 'key-a-3' ],
		].forEach(e => {
			ar = new Adw.ActionRow();
			for (let i of e) {
				const da = new Gtk.DrawingArea({ content_height : size, content_width : size * 2.2 });
				da.key = i.trim();
				da.act = settings.get_string(da.key);
				//~ append = add; obj[${append}] === obj.add	//GdH
				settings.connect(`changed::${da.key}`, () => {	// Romain
					da.act = settings.get_string(da.key);
					da.queue_draw();
				});
				let gesture = new Gtk.GestureClick();
				gesture.connect('released', (n_press, x, y) => {  // andyholmes
					if (da.key.indexOf('-s') > 0) return;  // modify scroll not allow.
					last_DA = da;
					_carousel.scroll_to(p1, true);
				});
				da.add_controller(gesture);
				da.set_draw_func((drawArea, cr, width, height) => {
					draw(cr, da.key, da.act);
				});
				ar.add_suffix(da);
			}
			this.add(ar);
		});
		ar = new Adw.ActionRow();
		ar.set_title(_('Restore Default Setting'));
		const but = Gtk.Button.new_with_label('RESET');
		but.valign = Gtk.Align.CENTER;
		ar.add_suffix(but);
		ar.set_activatable_widget(but);
		but.connect('clicked', () => {
			['key-s', 'key-a-s', 'key-1', 'key-a-1', 'key-2', 'key-a-2', 'key-3', 'key-a-3'].forEach(k => { settings.reset(k); });
		});
		this.add(ar);
	}
}

function draw(cr, key, act) {
	const icon = { 'key' : 'mouse', '1' : 'button1', '2' : 'button2', '3' : 'button3', 's' : 'scroll', 'a' : 'alt' };
	let f = Gio.File.new_for_uri('resource:///img/mouse.svg');
	let hd = Rsvg.Handle.new_from_gfile_sync(f, Rsvg.HandleFlags.FLAGS_NONE, null);
	for (let i of key.split('-')) {
		hd.render_cairo_sub(cr, `#${icon[i]}`);
	}

	f = Gio.File.new_for_uri(`resource:///img/act-${act}.svg`);
	hd = Rsvg.Handle.new_from_gfile_sync(f, Rsvg.HandleFlags.FLAGS_NONE, null);
	const vp = new Rsvg.Rectangle({ x : size, y : 0, width : size, height : size });
	hd.render_document(cr, vp);
}
