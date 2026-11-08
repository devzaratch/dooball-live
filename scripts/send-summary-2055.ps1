# Schedule Telegram summary at 20:55 (ASCII-only script; Thai text lives in summary-2055.txt)
$ErrorActionPreference = "Stop"
$outFile = Join-Path $PSScriptRoot "summary-2055.txt"

$token = "8818891073:AAGX7cFUnlW4e8rpW2aRlFtQqAx2gJWxWsg"
$chatId = "8914683622"
$target = Get-Date -Hour 20 -Minute 55 -Second 0
if ($target -lt (Get-Date)) { $target = $target.AddDays(1) }
$delay = [math]::Round(($target - (Get-Date)).TotalSeconds)
Write-Output ("waiting " + $delay + " sec (send at " + $target.ToString("HH:mm:ss") + ")")
Start-Sleep -Seconds $delay

$text = [System.IO.File]::ReadAllText($outFile, [System.Text.Encoding]::UTF8)
$json = @{ chat_id = $chatId; text = $text } | ConvertTo-Json -Depth 3
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

try {
    Invoke-RestMethod -Uri ("https://api.telegram.org/bot" + $token + "/sendMessage") -Method Post -ContentType "application/json; charset=utf-8" -Body $bytes | Out-Null
    Write-Output "summary sent"
} catch {
    Write-Output ("send failed: " + $_.Exception.Message)
}
