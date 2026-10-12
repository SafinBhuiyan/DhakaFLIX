<#
.SYNOPSIS
  Registers a daily scheduled task in Windows Task Scheduler for DhakaFLIX.
  Runs every day at 4:00 AM in the background with auto-git push.

.NOTES
  To install, run in PowerShell:
    powershell -ExecutionPolicy Bypass -File .\scripts\setup-daily-sync.ps1
#>

$TaskName = "DhakaFLIX-Daily-Catalog-Sync"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BatPath = Join-Path $ScriptDir "run-daily-sync.bat"

Write-Host "Registering Scheduled Task: $TaskName" -ForegroundColor Cyan
Write-Host "Target script: $BatPath" -ForegroundColor Gray

# Define action
$Action = New-ScheduledTaskAction -Execute "$BatPath" -WorkingDirectory (Split-Path -Parent $ScriptDir)

# Define daily trigger at 4:00 AM
$Trigger = New-ScheduledTaskTrigger -Daily -At "04:00AM"

# Define settings (run on AC or battery, wake if needed, restart if missed)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register or update task
try {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Daily automated BDIX catalog scan and Vercel sync for DhakaFLIX" | Out-Null
  Write-Host "[OK] Successfully registered $TaskName to run daily at 4:00 AM!" -ForegroundColor Green
  Write-Host "You can test it right now with: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Yellow
} catch {
  Write-Error $_
}
