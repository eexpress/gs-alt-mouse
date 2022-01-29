# gnome-shell-alt-mouse
Alt + Mouse control window

- | scroll up/down | butt 1|butt 2(middle)|butt 3
---|---|---|---|---|--
panel | switch window|move[^3]|resize|lower[^2]
desktop |switch window|move[^1][^3]|resize[^1]|lower[^1][^2]
Alt + |fullscreen[^4]/|max[^3]|close|min[^2]

[^1]: 鼠标三个按钮需要在桌面双击才有效。Need double-click
[^2]: 窗口置底/最小化后，滚轮下滚，可立刻恢复原貌。
[^3]: 有最大化窗口时，窗口正上方的面板点击失效。似乎是窗口尺寸超过了面板一样，直接提升最大化的那个窗口。根本不进入鼠标按键事件。
[^4]: 全屏后，窗口不能缩小，只能提前设置热键操作(比如Alt-F12)恢复。除开在全局取得控制权。

