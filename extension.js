const { Clutter, Meta, Gdk } = imports.gi;
const Main = imports.ui.main;
//~ mixed fork: panelScroll,
const POSITION = {
    LEFT: 0,
    RIGHT: 1
};

function lg(s){log("===Alt-Mouse===>"+s)}

class PanelScroll {
    constructor() {
		this.wm = global.workspace_manager;
		this.previousDirection = Meta.MotionDirection.UP;
		this.listPointer = 0;
		this.scrollEventId = Main.panel.connect('scroll-event', this.scrollEvent.bind(this));
    }

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

        switch (this.pointerOnPanel()) {
        case POSITION.LEFT:
        case POSITION.RIGHT:
                this.switchWindows(direction);
            break;
        }

        return Clutter.EVENT_STOP;
    }

    pointerOnPanel() {
        let [x, y, mod] =global.get_pointer();

        let currentMonitor;
        let currentMonitorIndex = global.display.get_current_monitor();
        currentMonitor = global.display.get_monitor_geometry(currentMonitorIndex);

        if (x < (currentMonitor.x + currentMonitor.width / 2))
            return POSITION.LEFT;

        let aggregateMenu = Main.panel._rightBox.get_last_child().get_first_child();
        if (x < (currentMonitor.x + currentMonitor.width - aggregateMenu.width))
            return POSITION.RIGHT;

        return null;
    }

    switchWindows(direction) {
        let windows = this.getWindows();
        if (windows.length <= 1)
            return;

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
        let currentWorkspace = this.wm.get_active_workspace();

        let windows = global.display.get_tab_list(Meta.TabList.NORMAL_ALL, currentWorkspace);
        windows.map(w => {
            return w.is_attached_dialog() ? w.get_transient_for() : w;
        }).filter((w, i, a) => !w.skip_taskbar && a.indexOf(w) == i);

		lg(windows.length);
        return windows;
    }

    destroy() {
        if (this.scrollEventId != null) {
            Main.panel.disconnect(this.scrollEventId);
            this.scrollEventId = null;
        }
   }
}

let panelScroll;

function init(metadata) {
}

function enable() {
	lg("start");
    panelScroll = new PanelScroll();
}

function disable() {
	lg("stop");
    panelScroll.destroy();
    panelScroll = null;
}
