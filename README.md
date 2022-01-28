# gnome-shell-alt-mouse
Alt + Mouse control window

zone | scroll | butt 1|butt 2|butt 3
---|---|---|---|---
panel | switch window|move[^3]|resize|lower[^2]
desktop |switch window|move[^1][^3]|resize[^1]|lower[^1][^2]

[^1]: 鼠标三个按钮需要在桌面双击才有效。Need double-click
[^2]: 窗口置底后，滚轮上滚，可立刻恢复原貌。
[^3]: 有最大化窗口时，失效。似乎是窗口尺寸超过了面板一样，直接提升最大化的那个窗口。根本不进入鼠标按键事件。

