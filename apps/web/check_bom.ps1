$bytes = [System.IO.File]::ReadAllBytes("c:\Github repos\projects\ComplyArc\apps\web\package.json")
$hex = ($bytes[0..9] | ForEach-Object { '{0:X2}' -f $_ }) -join ' '
Write-Host "First 10 bytes: $hex"
Write-Host "Total bytes: $($bytes.Length)"
