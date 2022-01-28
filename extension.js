const { Clutter, Meta, Gdk, Shell } = imports.gi;
const Main = imports.ui.main;
//~ part fork from: panelScroll

function lg(s){log("===Alt-Mouse===>"+s)}

class AltMouse {
	constructor() {
		this.previousDirection = Meta.MotionDirection.UP;
		this.listPointer = 0;
		this.clickEventId = global.stage.connect('button-release-event', this.clickEvent.bind(this));
		this.scrollEventId = global.stage.connect('scroll-event', this.scrollEvent.bind(this));
		//~ this.getWindows().forEach((w)=>{w.decorations.hide()});
	}

	clickEvent(actor, event){
		const w = global.display.get_focus_window()
		switch (event.get_button()) {
			case 1:
				if(w.allows_move())
				w.begin_grab_op(Meta.GrabOp.MOVING, true, event.get_time());
				return Clutter.EVENT_STOP;
				break;
			case 2:	//middle click  Meta.GrabOp.KEYBOARD_RESIZING_UNKNOWN
				if(w.allows_resize())
				w.begin_grab_op(Meta.GrabOp.RESIZING_SE, true, event.get_time());
				return Clutter.EVENT_STOP;
				break;
			case 3:
				w.lower();	//focus still on this window.
				return Clutter.EVENT_STOP;
				break;
			default:
		}
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
		windows.map(w => {
			return w.is_attached_dialog() ? w.get_transient_for() : w;
		}).filter((w, i, a) => !w.skip_taskbar && a.indexOf(w) == i);

		return windows;
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
