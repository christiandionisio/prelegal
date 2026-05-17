$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."
docker build -t prelegal .
docker rm -f prelegal 2>$null
docker run -d --name prelegal -p 8000:8000 prelegal
Write-Host "Prelegal is running at http://localhost:8000"
