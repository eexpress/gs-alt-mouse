const { Clutter, Meta, Gdk, Shell, St } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const Me = ExtensionUtils.getCurrentExtension();
const AltTab = imports.ui.altTab;
const layoutManager = Main.layoutManager;
const monitor = layoutManager.primaryMonitor;
//~ Just Perfection 的隐藏桌面菜单
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
// Edge Gap 增加一个屏幕右侧占位
let rightGap = null;
const gap = 8;

function lg(s) { log("===" + Me.uuid.split('@')[0] + "===>" + s); };

//~ TODO:
//~ 判断鼠标下面有没有窗口。window_under_pointer
//~ ‌窗口去掉装饰条。不想使用外挂的xprop。
//~ ‌窗口上，全局附加alt键。
//~ 全屏后，panel消失，无法点击。需要全局控制权。
//~ 桌面双击才有效，gnome42+wayland下，单击正常了。。。

class AltMouse {
	constructor() {
		this.previousDirection = Meta.MotionDirection.UP;
		this.settings = ExtensionUtils.getSettings();

		this.clickEventId = global.stage.connect('button-release-event', this.clickEvent.bind(this));
		this.scrollEventId = global.stage.connect('scroll-event', this.scrollEvent.bind(this));
	}

	skip_extensions() {
		let [x, y] = global.get_pointer();
		let pickedActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
		if (pickedActor.get_name() == 'panel') return false;  // panel
		if (pickedActor.width == monitor.width) return false;  // desktop
		if (pickedActor.width == gap) return false;	 // gap
		return true;  //其他无名字的，以及‘xFloat’，都是面板上的扩展，需要跳过。
	}

	clickEvent(actor, event) {
		if (this.skip_extensions()) return Clutter.EVENT_PROPAGATE;

		const altkey = event.get_state() & Clutter.ModifierType.MOD1_MASK;
		const debug = false;
		if (debug) {  //调试模式，按ctrl点击，显示点击的坐标。
			const ctrlkey = event.get_state() & Clutter.ModifierType.CONTROL_MASK;
			if (ctrlkey) {
				const [x, y] = global.get_pointer();
				lg(x + ',' + y);
				return Clutter.EVENT_STOP;
			}
		}

		let w = global.display.get_focus_window();
		if (!w) return Clutter.EVENT_PROPAGATE;
		// GdH 提醒，才发现最小化对话栏导致父窗口失联，必须针对父窗口操作。
		w = w.is_attached_dialog() ? w.get_transient_for() : w;
		//~ let w = Meta.Display.get_focus_window(); //not function
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
		// 实时查看动作的设置。
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
			w.make_fullscreen();  // Meta.Display
			//~ w.unmake_fullscreen();	//Meta.Display
			//~ w.fullscreen();		//~ global.display.fullscreen is not a function
			break;
		case 'lower':
			w.lower();
			//~ this.switchWindows(false);
			break;
		case 'shade':
			//~ if (!w.can_shade()) break;
			if (w.is_shaded()) w.unshade(event.get_time());
			else w.shade(event.get_time());
			break;
		case 'stick':
			//~ w.stick();
			//~ w.unstick();
			break;
		}
	};

	scrollEvent(actor, event) {
		if (this.skip_extensions()) return Clutter.EVENT_PROPAGATE;

		const altkey = event.get_state() & Clutter.ModifierType.MOD1_MASK;
		if (altkey) {  // Just.P method
			aggregateMenu._volume._handleScrollEvent(0, event);
			return Clutter.EVENT_STOP;
		}
		// 直接使用AltTab，只是它调用的get_tab_list()， 按最后激活每次都调整次序。似乎是按照时间戳排序，导致数组前两个窗口循环。
		// 之前调用的ws.list_windows()，次序固定，但切换窗口后，不反映变化，也不适合。
		const ws = global.workspace_manager.get_active_workspace();
		const windows = AltTab.getWindows(ws);
		switch (event.get_scroll_direction()) {
		case Clutter.ScrollDirection.UP:
		case Clutter.ScrollDirection.LEFT:
			// 循环所有窗口
			windows[windows.length - 1].activate(global.get_current_time());
			break;
		case Clutter.ScrollDirection.DOWN:
		case Clutter.ScrollDirection.RIGHT:
			// 循环最后两个窗口
			windows[1].activate(global.get_current_time());
			break;
		default:
			return Clutter.EVENT_PROPAGATE;
		}
		return Clutter.EVENT_STOP;
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
	//~ lg("start");
	_backgroundMenu.BackgroundMenu.prototype.open = () => {};  // Just Perfection
	_Panel.prototype._tryDragWindow = () => {};
	_LayoutManager.prototype._updateHotCorners = _updateHotCorners;
	_updateHotCorners();
	// Edge Gap
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
	//~ lg("stop");
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
