$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "ERP Banh Keo FMCG.lnk"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$RootDir\Khoi_Dong_Desktop.vbs`""
$Shortcut.WorkingDirectory = $RootDir
$Shortcut.IconLocation = "$RootDir\apps\web-admin\electron\icon.png"
$Shortcut.Description = "He Thong ERP & DMS Banh Keo FMCG (Desktop App)"
$Shortcut.Save()

Write-Host "Da tao loi tat Desktop thanh cong tai: $ShortcutPath" -ForegroundColor Green
