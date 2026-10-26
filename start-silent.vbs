Set WshShell = CreateObject("WScript.Shell")
' Run DhakaFLIX Web Server invisibly in background (0 = hide window)
WshShell.Run "cmd /c npm run dev", 0, False
