'use strict';

const { Adw, Gio, Gtk, GObject, Soup, GLib, Rsvg, Gdk } = imports.gi;

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
	window.set_default_size(500, 700);
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
		_carousel = new Adw.Carousel({spacing: 10});
		p0 = new pSetting();
		_carousel.append(p0);
		p1 = new pAction();
		_carousel.append(p1);
		const cil = new Adw.CarouselIndicatorLines({carousel: _carousel});
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
			['None', 'No Action.'],
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
			['Shade', 'window may be shaded.'],
			['Stick', 'window may have its sticky state toggled.'],
		].forEach(e => {
			const ar = new Adw.ActionRow();
			ar.set_title(e[0]);
			ar.set_subtitle(e[1]);
			const img = new Gtk.Image({gicon: Gio.Icon.new_for_string(`resource:///img/act-${e[0].toLowerCase()}.svg`), pixel_size: 64});
			ar.add_suffix(img);
			ar.set_activatable_widget(img);
			ar.connect('activated', (i) => {
				last_DA.act = i.title.toLowerCase();
				last_DA.icon = `act-${last_DA.act}`;
				last_DA.queue_draw();
				log('click: '+ last_DA.key +' = '+ last_DA.act);
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
		const ar = new Adw.ActionRow();
		ar.set_title('Mouse Setting');
		ar.set_subtitle('Click the act icon to setup. All Actions list in next page.');
		this.add(ar);

		[
			[ 'mouse,scroll', 'key-45', 'separator', 'mouse,scroll,alt', 'key-a-45' ],
			[ 'mouse,button1', 'key-1', 'separator', 'mouse,button1,alt', 'key-a-1' ],
			[ 'mouse,button2', 'key-2', 'separator', 'mouse,button2,alt', 'key-a-2' ],
			[ 'mouse,button3', 'key-3', 'separator', 'mouse,button3,alt', 'key-a-3' ],
		].forEach(e => {
			const ar = new Adw.ActionRow();
			for (let i of e) {
				i = i.trim();
				const da = new Gtk.DrawingArea({ content_height : size, content_width : size });
				da.icon = i;
				if (i.indexOf('key-') == 0){	//key定义字段，获取动作，转换成图标名。
					da.key = i;
					da.act = settings.get_string(i);
					//~ this.settings.bind(i, da, 'act', Gio.SettingsBindFlags.DEFAULT);
					da.icon = `act-${da.act}`;
					let gesture = new Gtk.GestureClick();
					gesture.connect('released', (n_press, x, y) => {
						last_DA = da;
						_carousel.scroll_to(p1, true);
					});
					da.add_controller(gesture);
				}
				da.set_draw_func((drawArea, cr, width, height) => {
					draw(cr, da.icon);
				});
				ar.add_suffix(da);
			}
			this.add(ar);
		});
	}
}

function draw(cr, str) {
	if (str.indexOf(',') > 0) {
		const f = Gio.File.new_for_uri('resource:///img/mouse.svg');
		const hd = Rsvg.Handle.new_from_gfile_sync(f, Rsvg.HandleFlags.FLAGS_NONE, null);
		for (let p of str.split(',')) {
			hd.render_cairo_sub(cr, `#${p}`);
		}
		hd.close();	 // need close manually?
	} else {
		const f = Gio.File.new_for_uri(`resource:///img/${str}.svg`);
		const hd = Rsvg.Handle.new_from_gfile_sync(f, Rsvg.HandleFlags.FLAGS_NONE, null);
		//~ hd.render_cairo(cr);
		//~ cr.scale(0.5, 0.5);
		const vp = new Rsvg.Rectangle({ x : 0, y : 0, width : size, height : size });
		//~ hd.render_layer(cr, "#Device", vp);
		hd.render_document(cr, vp);
		hd.close();
	}
}
