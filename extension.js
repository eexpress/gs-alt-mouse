const { Clutter, Meta, Gdk, Shell } = imports.gi;
const Main = imports.ui.main;
const AltTab = imports.ui.altTab;
const _backgroundMenu = imports.ui.backgroundMenu;
//~ part fork from: panelScroll, Just Perfection

const Me = imports.misc.extensionUtils.getCurrentExtension();
function lg(s){log("==="+Me.uuid.split('@')[0]+"===>"+s)};

let panelheight = 34;
const DisableBGMenu = true;
const maxflag = Meta.MaximizeFlags.VERTICAL
//~ Meta.MaximizeFlags.BOTH
//~ Meta.MaximizeFlags.HORIZONTAL
//~ Meta.MaximizeFlags.VERTICAL

//~ TODO:
//~ 判断鼠标下面有没有窗口。window_under_pointer
//~ ‌窗口去掉装饰条。不想使用外挂的xprop。
//~ ‌窗口上，全局附加alt键。
//~ max后，面板正上方面板反正失效。
//~ 全屏后，无法点击。需要全局控制权。
//~ If a maximized window here, when use get_buffer_rect(), I got `-1,33, 1922x1048`, so large that made `button-release-event` fail? why the x is `-1` and the y is `33` not `32` ? w.get_frame_rect();	//~ get_buffer_rect include shadows

class AltMouse {
	constructor() {
		this.previousDirection = Meta.MotionDirection.UP;
		this.listPointer = 0;
		this._originals = {};
		if(DisableBGMenu) this.backgroundMenuDisable();

		this.clickEventId = global.stage.connect('button-release-event', this.clickEvent.bind(this));	//~ 鼠标三个按钮需要在桌面双击才有效。
		this.scrollEventId = global.stage.connect('scroll-event', this.scrollEvent.bind(this));
		//~ -------------------------------------
		//~ global.stage.connect('captured-event', (actor, event) => {
            //~ if (event.type() == Clutter.EventType.KEY_PRESS || event.type() == Clutter.EventType.BUTTON_PRESS){
				//~ }
			//~ }
		//~ });
		//~ -------------------------------------
	}

	clickEvent(actor, event){
		//~ 跳过扩展的图标，y座标小于面板高度，且无名字。
		let [x, y] = global.get_pointer();
		let pickedActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
		if(pickedActor.get_name() == 'panel') panelheight = pickedActor.get_height();
		if(y<panelheight && pickedActor.get_name() == null) return Clutter.EVENT_PROPAGATE;

		const altkey = event.get_state() & Clutter.ModifierType.MOD1_MASK;

		let w = global.display.get_focus_window();
		switch (event.get_button()) {
			case 1:
				if(altkey){if(w.get_maximized() != maxflag){w.maximize(maxflag);}
					else{w.unmaximize(maxflag);}
					return Clutter.EVENT_STOP;
				}
				if(w.allows_move())
				w.begin_grab_op(Meta.GrabOp.MOVING, true, event.get_time());
				return Clutter.EVENT_STOP;
				break;
			case 2:	//middle click
				if(altkey){if(w.can_close()) w.kill(); return Clutter.EVENT_STOP;}
				if(w.allows_resize())
				w.begin_grab_op(Meta.GrabOp.RESIZING_SE, true, event.get_time());	//Meta.GrabOp.RESIZING_UNKNOWN
				return Clutter.EVENT_STOP;
				break;
			case 3:
				if(altkey){if(w.can_minimize()) w.minimize(); return Clutter.EVENT_STOP;}
				w.lower();
				this.switchWindows(Meta.MotionDirection.UP);
				return Clutter.EVENT_STOP;
				break;
			default:
				return Clutter.EVENT_PROPAGATE;
		}
	};

	scrollEvent(actor, event) {
		let direction;
		switch (event.get_scroll_direction()) {
			case Clutter.ScrollDirection.UP:
			case Clutter.ScrollDirection.LEFT:
				direction = Meta.MotionDirection.UP;
				break;
			case Clutter.ScrollDirection.DOWN:
			case Clutter.ScrollDirection.RIGHT:
				direction = Meta.MotionDirection.DOWN;
				break;
			default:
				return Clutter.EVENT_PROPAGATE;
		}

		if (event.get_state() & Clutter.ModifierType.MOD1_MASK){
			let w = global.display.get_focus_window();
			if(direction == Meta.MotionDirection.UP){
				if(w.can_maximize()){
					if(w.is_fullscreen()) w.unmake_fullscreen();
					else w.make_fullscreen();
				}
			} else {
				//~ if(w.can_shade()) if(w.is_shaded()) w.unshade(event.get_time()); else w.shade(event.get_time());	//shade后，丢焦点。w is null
			}
		} else this.switchWindows(direction);

		return Clutter.EVENT_STOP;
	}

	showinfo(w){
		lg(w.get_title());
	};

	switchWindows(direction) {
		let windows = this.getWindows();
		//~ windows.forEach(w => this.showinfo(w));
		if (windows.length <= 1) return;

		if (direction != this.previousDirection) {
			this.listPointer = 1;
		} else {
			this.listPointer += 1;
			if (this.listPointer > windows.length - 1)
				this.listPointer = windows.length -1;
		}
		this.previousDirection = direction;
		windows[this.listPointer].activate(global.get_current_time());
	}

	getWindows() {
		return AltTab.getWindows(global.workspace_manager.get_active_workspace());
		//~ let windows = global.display.get_tab_list(Meta.TabList.NORMAL_ALL, cws);
	}

	backgroundMenuEnable() {
		if (this._originals['bgMenu']) _backgroundMenu.BackgroundMenu.prototype.open = this._originals['bgMenu'];
	}

	backgroundMenuDisable() {
		if (!this._originals['bgMenu']) this._originals['bgMenu'] = _backgroundMenu.BackgroundMenu.prototype.open;

		_backgroundMenu.BackgroundMenu.prototype.open = () => {};
	}

	destroy() {
		if (this.scrollEventId != null) {
			global.stage.disconnect(this.scrollEventId);
			this.scrollEventId = null;
		}
		if (this.clickEventId != null) {
			global.stage.disconnect(this.clickEventId);
			this.clickEventId = null;
		}
		if(DisableBGMenu) this.backgroundMenuEnable();
   }
}

let altmouse;

function init(metadata) {
}

function enable() {
	lg("start");
	altmouse = new AltMouse();
}

function disable() {
	lg("stop");
	altmouse.destroy();
	altmouse = null;
}
