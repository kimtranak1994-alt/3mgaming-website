Set-Location "e:\AI"
Remove-Item -Path "public\3mgaming_web.zip" -Force -ErrorAction SilentlyContinue

$excludeDirs = @('.git', '.idea', '.vscode', '__pycache__', 'scratch')
$items = Get-ChildItem -Path . | Where-Object { 
    $excludeDirs -notcontains $_.Name -and $_.Name -ne '3mgaming_web.zip' -and $_.Name -ne 'build_zip.ps1'
}

Compress-Archive -Path $items.FullName -DestinationPath "public\3mgaming_web.zip" -Force
Write-Host "Done! Size: $((Get-Item 'public\3mgaming_web.zip').Length / 1MB) MB"
