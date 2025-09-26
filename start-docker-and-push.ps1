# Start Docker Desktop and Push ProtoThrive Images
# This script starts Docker Desktop and then builds/pushes images

param(
    [string]$Registry = "ernijsansons",
    [string]$Tag = "latest"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-ColorLog {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Start-DockerDesktop {
    Write-ColorLog "Starting Docker Desktop..." $Blue
    
    # Try different ways to start Docker Desktop
    $dockerPaths = @(
        "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "${env:LOCALAPPDATA}\Docker\Docker Desktop.exe"
    )
    
    foreach ($path in $dockerPaths) {
        if (Test-Path $path) {
            Write-ColorLog "Found Docker Desktop at: $path" $Yellow
            Start-Process -FilePath $path -WindowStyle Hidden
            break
        }
    }
    
    # Wait for Docker to start
    Write-ColorLog "Waiting for Docker to start..." $Yellow
    $maxWait = 60 # 60 seconds
    $waited = 0
    
    do {
        Start-Sleep -Seconds 2
        $waited += 2
        
        try {
            $null = docker info 2>$null
            Write-ColorLog "Docker is running!" $Green
            return $true
        }
        catch {
            Write-ColorLog "Still waiting for Docker... ($waited/$maxWait seconds)" $Yellow
        }
    } while ($waited -lt $maxWait)
    
    Write-ColorLog "Docker failed to start within $maxWait seconds" $Red
    return $false
}

function Test-DockerRunning {
    try {
        $null = docker info 2>$null
        return $true
    }
    catch {
        return $false
    }
}

# Main execution
Write-ColorLog "ProtoThrive Docker Push Script" $Blue
Write-ColorLog "================================" $Blue

# Check if Docker is already running
if (Test-DockerRunning) {
    Write-ColorLog "Docker is already running!" $Green
} else {
    Write-ColorLog "Docker is not running. Starting Docker Desktop..." $Yellow
    if (-not (Start-DockerDesktop)) {
        Write-ColorLog "Failed to start Docker Desktop. Please start it manually and try again." $Red
        Write-ColorLog "You can find Docker Desktop in the Start menu or system tray." $Yellow
        return
    }
}

# Wait a bit more for Docker to be fully ready
Start-Sleep -Seconds 5

# Now run the docker push script
Write-ColorLog "Running docker push script..." $Blue
& ".\docker-push.ps1" -Registry $Registry -Tag $Tag -All

Write-ColorLog "Script completed!" $Green

