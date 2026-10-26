Set WshShell = CreateObject("WScript.Shell")
' Run DhakaFLIX Mobile Relay in background without terminal window (0 = hide window)
WshShell.Run "cmd /c node scripts/start-relay.mjs", 0, False
' Open the generated URL file after 4 seconds
WScript.Sleep 4000
WshShell.Run "notepad.exe active-mobile-url.txt", 1, False
