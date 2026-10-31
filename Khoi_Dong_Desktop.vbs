Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = currentDir & "\apps\web-admin"
WshShell.Environment("PROCESS")("ELECTRON_RUN_AS_NODE") = ""

' Chạy ứng dụng Electron ngầm không hiện cửa sổ dòng lệnh đen (0 = ẩn hoàn toàn)
WshShell.Run "cmd /c ""set ELECTRON_RUN_AS_NODE= && npx electron .""", 0, False
