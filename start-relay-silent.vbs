Set WshShell = CreateObject("WScript.Shell")
' Run DhakaFLIX Mobile Relay in background without terminal window (0 = hide window)
WshShell.Run "cmd /c node scripts/start-relay.mjs", 0, False
