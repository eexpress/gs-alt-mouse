const { Clutter, Meta, Gdk, Shell, St } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const Me = ExtensionUtils.getCurrentExtension();
const AltTab = imports.ui.altTab;
const layoutManager = Main.layoutManager;
const monitor = layoutManager.primaryMonitor;
//~ part copy from: Just Perfection, Edge Gap
const _backgroundMenu = imports.ui.backgroundMenu;
const orig_bgMenu = _backgroundMenu.BackgroundMenu.prototype.open;
const aggregateMenu = Main.panel.statusArea.aggregateMenu;
//~ 增加热角，替换原型函数
const HotCorner = imports.ui.layout.HotCorner;
const _LayoutManager = imports.ui.layout.LayoutManager;
const orig_updateHotCorners = _LayoutManager.prototype._updateHotCorners;
//~ 最大化后，panel变成dragWindow状态，导致panel正上方点击失效。所以禁止它的拖放函数。
const _Panel = imports.ui.panel.Panel;
const orig_tryDragWindow = _Panel.prototype._tryDragWindow;

const debug = false;
//~ const debug = true;
function lg(s) {
	if (debug) log("===" + Me.uuid.split('@')[0] + "===>" + s)
};

let rightGap = null;
const gap = 8;

//~ TODO:
//~ 判断鼠标下面有没有窗口。window_under_pointer
//~ ‌窗口去掉装饰条。不想使用外挂的xprop。
//~ ‌窗口上，全局附加alt键。
//~ 全屏后，panel消失，无法点击。需要全局控制权。
//~ 桌面双击才有效

class AltMouse {
	constructor() {
		this.previousDirection = Meta.MotionDirection.UP;
		this.settings = ExtensionUtils.getSettings();
		//~ this.settings.connect('changed::latitude', () => {});

		this.clickEventId = global.stage.connect('button-release-event', this.clickEvent.bind(this));  //~ 鼠标三个按钮需要在桌面双击才有效。
		this.scrollEventId = global.stage.connect('scroll-event', this.scrollEvent.bind(this));
	}

	skip_extensions() {
		let [x, y] = global.get_pointer();
		let pickedActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
		if (pickedActor.get_name()) return false;  // panel or xFloat
		//~ if (pickedActor.get_name() == 'panel') return false;  // panel
		if (pickedActor.width == monitor.width) return false;  // desktop
		if (pickedActor.width == gap) return false;	 // gap
		return true;
	}

	clickEvent(actor, event) {
		if (this.skip_extensions()) return Clutter.EVENT_PROPAGATE;

		const altkey = event.get_state() & Clutter.ModifierType.MOD1_MASK;
		if (debug) {
			const ctrlkey = event.get_state() & Clutter.ModifierType.CONTROL_MASK;
			if (ctrlkey) {
				const [x, y] = global.get_pointer();
				return Clutter.EVENT_STOP;
			}
		}

		let w = global.display.get_focus_window();
		if (!w) return Clutter.EVENT_PROPAGATE;
		let act;
		switch (event.get_button()) {
		case 1:
			act = altkey ? 'key-a-1' : 'key-1';
			break;
		case 2:
			act = altkey ? 'key-a-2' : 'key-2';
			break;
		case 3:
			act = altkey ? 'key-a-3' : 'key-3';
			break;
		default:
			return Clutter.EVENT_PROPAGATE;
		}
		this.action(w, this.settings.get_string(act), event);
		return Clutter.EVENT_STOP;
	}

	action(w, act, event) {
		switch (act) {
		case 'none': break;
		case 'above':
			if (w.is_above())
				w.unmake_above();
			else
				w.make_above();
			break;
		case 'move':
			if (w.allows_move()) w.begin_grab_op(Meta.GrabOp.MOVING, true, event.get_time());
			break;
		case 'resize':
			if (w.allows_resize()) w.begin_grab_op(Meta.GrabOp.KEYBOARD_RESIZING_UNKNOWN, true, event.get_time());
			break;
		case 'max':
			const maxMode = Meta.MaximizeFlags.BOTH;
			if (w.get_maximized() != maxMode)
				w.maximize(maxMode);
			else
				w.unmaximize(maxMode);
			break;
		case 'max-h':
			const maxModeH = Meta.MaximizeFlags.VERTICAL;
			if (w.get_maximized() != maxModeH)
				w.maximize(maxModeH);
			else
				w.unmaximize(maxModeH);
			break;
		case 'min':
			w.minimize();
			break;
		case 'close':
			if (w.can_close()) w.kill();
			break;
		case 'full':
			//~ w.fullscreen();
			//~ w.fullscreen is not a function
			break;
		case 'lower':
			w.lower();
			this.switchWindows(true);
			break;
		case 'shade': break;
		case 'stick': break;
		}
	};

	scrollEvent(actor, event) {
		if (this.skip_extensions()) return Clutter.EVENT_PROPAGATE;

		const altkey = event.get_state() & Clutter.ModifierType.MOD1_MASK;
		if (altkey) {  // Just.P method
			aggregateMenu._volume._handleScrollEvent(0, event);
			return Clutter.EVENT_STOP;
		}
		let isUP;
		switch (event.get_scroll_direction()) {
		case Clutter.ScrollDirection.UP:
		case Clutter.ScrollDirection.LEFT:
			isUP = true;
			break;
		case Clutter.ScrollDirection.DOWN:
		case Clutter.ScrollDirection.RIGHT:
			isUP = false;
			break;
		default:
			return Clutter.EVENT_PROPAGATE;
		}
		this.switchWindows(isUP);  //切换
		return Clutter.EVENT_STOP;
	}

	switchWindows(isUP) {
		const ws = global.workspace_manager.get_active_workspace();
		const windows = ws.list_windows();
		if (windows.length <= 1) return;

		const w = global.display.get_focus_window();
		let i;
		for (i = 0; i < windows.length; ++i) {
			if (windows[i].title == w.title) { break; }
		}

		if (isUP) {
			i--;
			if (i < 0) { i = windows.length - 1; }
		} else {
			i++;
			if (i >= windows.length) { i = 0; }
		}
		windows[i].activate(global.get_current_time());
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
	}
}

function _updateHotCorners() {
	let corner;
	layoutManager.hotCorners.forEach(corner => {
		if (corner)
			corner.destroy();
	});
	layoutManager.hotCorners = [];

	corner = new HotCorner(layoutManager, monitor, monitor.width, 0);  // right-up
	corner.setBarrierSize(1);
	layoutManager.hotCorners.push(corner);
	corner = new HotCorner(layoutManager, monitor, 0, 0);  // left-up
	corner.setBarrierSize(1);
	layoutManager.hotCorners.push(corner);
	layoutManager.emit('hot-corners-changed');
}

let altmouse;

function init(metadata) {
}

function enable() {
	lg("start");
	_backgroundMenu.BackgroundMenu.prototype.open = () => {};
	_Panel.prototype._tryDragWindow = () => {};
	_LayoutManager.prototype._updateHotCorners = _updateHotCorners;
	_updateHotCorners();
	rightGap = new St.Bin({
		reactive : false,
		can_focus : false,
		track_hover : false,
		height : monitor.height,
		width : gap,
	});
	rightGap.set_position(monitor.width - gap, 0);
	layoutManager.addChrome(rightGap, {
		affectsInputRegion : true,
		affectsStruts : true,
	});
	altmouse = new AltMouse();
}

function disable() {
	lg("stop");
	_backgroundMenu.BackgroundMenu.prototype.open = orig_bgMenu;
	_Panel.prototype._tryDragWindow = orig_tryDragWindow;
	_LayoutManager.prototype._updateHotCorners = orig_updateHotCorners;
	layoutManager.emit('hot-corners-changed');
	layoutManager.removeChrome(rightGap);
	rightGap.destroy();
	rightGap = null;
	altmouse.destroy();
	altmouse = null;
}
