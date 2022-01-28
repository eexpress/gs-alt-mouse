const { Clutter, Meta, Gdk, Shell } = imports.gi;
const Main = imports.ui.main;
const BackgroundMenu = imports.ui.backgroundMenu;
//~ part fork from: panelScroll

function lg(s){log("===Alt-Mouse===>"+s)}

class AltMouse {
	constructor() {
		this.previousDirection = Meta.MotionDirection.UP;
		this.listPointer = 0;
		this.clickEventId = global.stage.connect('button-release-event', this.clickEvent.bind(this));
//~ If a maximized window here, when use get_buffer_rect(), I got `-1,33, 1922x1048`, so large that made `button-release-event` fail. why the x is `-1` and the y is `33` not `32` ?
		this.scrollEventId = global.stage.connect('scroll-event', this.scrollEvent.bind(this));

		this._originals = {};
		this._backgroundMenu = dependecies['BackgroundMenu'] || null;
		this.backgroundMenuDisable();
		//~ this.getWindows().forEach((w)=>{w.decorations.hide()});
	}

//~ 判断鼠标下面有没有窗口。window_under_pointer
//~ ‌桌面的按键事件要去掉。
//~ ‌窗口去掉装饰条。不想使用外挂的xprop。
//~ ‌窗口上，全局附加alt键。

	clickEvent(actor, event){
		let w = global.display.get_focus_window();
		//~ this.getWindows().forEach((w)=>{this.showinfo(w)});
		switch (event.get_button()) {
			case 1:
				if(w.allows_move())
				w.begin_grab_op(Meta.GrabOp.MOVING, true, event.get_time());
				return Clutter.EVENT_STOP;
				break;

			case 2:	//middle click  //Meta.GrabOp.KEYBOARD_RESIZING_UNKNOWN
				if(w.allows_resize())
				w.begin_grab_op(Meta.GrabOp.RESIZING_SE, true, event.get_time());
				return Clutter.EVENT_STOP;
				break;
			case 3:
				w.lower();
				this.switchWindows(Meta.MotionDirection.UP);
				return Clutter.EVENT_STOP;
				break;
			default:
		}
	};

	showinfo(w){
		lg(w.get_title());
		const r = w.get_buffer_rect();
		lg(`${r.x},${r.y}, ${r.width}x${r.height}`);
	};

//event.modifier_state()
//~ BUTTON1_MASK CONTROL_MASK SHIFT_MASK META_MASK SUPER_MASK MOD1_MASK( normally it is the Alt key)
//~ 11000 alt 10100 ctrl 1010000 super 10001 shift 10000 none
//~ if(event.get_state().toString(2) != '11000') return Clutter.EVENT_STOP;

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
				return Clutter.EVENT_STOP;
		}

		let gap = event.get_time() - this._time;
		if (gap < 500 && gap >= 0)
			return Clutter.EVENT_STOP;
		this._time = event.get_time();

		this.switchWindows(direction);

		return Clutter.EVENT_STOP;
	}

	switchWindows(direction) {
		let windows = this.getWindows();
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
		let cws = global.workspace_manager.get_active_workspace();

		let windows = global.display.get_tab_list(Meta.TabList.NORMAL_ALL, cws);
		//~ windows.map(w => {
			//~ return w.is_attached_dialog() ? w.get_transient_for() : w;
		//~ }).filter((w, i, a) => !w.skip_taskbar && a.indexOf(w) == i);

		return windows;
	}

	backgroundMenuEnable()
    {
        if (!this._originals['backgroundMenu']) {
            return;
        }

        this._backgroundMenu.BackgroundMenu.prototype.open
        = this._originals['backgroundMenu'];
    }

    backgroundMenuDisable()
    {
        if (!this._originals['backgroundMenu']) {
            this._originals['backgroundMenu']
            = this._backgroundMenu.BackgroundMenu.prototype.open;
        }

        this._backgroundMenu.BackgroundMenu.prototype.open = () => {};
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
		this.backgroundMenuEnable();
		//~ this.getWindows().forEach((w)=>{w.decorations.show()});

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
