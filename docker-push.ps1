# Docker Push Script for ProtoThrive
# This script builds and pushes Docker images to Docker Hub

param(
    [string]$Registry = "ernijsansons",
    [string]$Tag = "latest",
    [switch]$Build,
    [switch]$Push,
    [switch]$All
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

function Test-DockerRunning {
    try {
        $null = docker info 2>$null
        return $true
    }
    catch {
        return $false
    }
}

function Build-Images {
    Write-ColorLog "Building ProtoThrive Docker images..." $Blue
    
    # Build frontend image
    Write-ColorLog "Building frontend image..." $Yellow
    $frontendTag = "${Registry}/protothrive-frontend:${Tag}"
    docker build -f frontend/Dockerfile.working -t $frontendTag frontend
    if ($LASTEXITCODE -ne 0) {
        Write-ColorLog "Failed to build frontend image" $Red
        return $false
    }
    
    # Build backend image
    Write-ColorLog "Building backend image..." $Yellow
    $backendTag = "${Registry}/protothrive-backend:${Tag}"
    docker build -f backend/Dockerfile.working -t $backendTag backend
    if ($LASTEXITCODE -ne 0) {
        Write-ColorLog "Failed to build backend image" $Red
        return $false
    }
    
    Write-ColorLog "Successfully built all images!" $Green
    return $true
}

function Push-Images {
    Write-ColorLog "Pushing ProtoThrive Docker images to registry..." $Blue
    
    # Login to Docker Hub
    Write-ColorLog "Please login to Docker Hub..." $Yellow
    docker login
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorLog "Failed to login to Docker Hub" $Red
        return $false
    }
    
    # Push frontend image
    Write-ColorLog "Pushing frontend image..." $Yellow
    $frontendTag = "${Registry}/protothrive-frontend:${Tag}"
    docker push $frontendTag
    if ($LASTEXITCODE -ne 0) {
        Write-ColorLog "Failed to push frontend image" $Red
        return $false
    }
    
    # Push backend image
    Write-ColorLog "Pushing backend image..." $Yellow
    $backendTag = "${Registry}/protothrive-backend:${Tag}"
    docker push $backendTag
    if ($LASTEXITCODE -ne 0) {
        Write-ColorLog "Failed to push backend image" $Red
        return $false
    }
    
    Write-ColorLog "Successfully pushed all images!" $Green
    Write-ColorLog "Frontend: $frontendTag" $Green
    Write-ColorLog "Backend: $backendTag" $Green
    return $true
}

function Show-Help {
    Write-Host @"
ProtoThrive Docker Push Script

Usage: .\docker-push.ps1 [OPTIONS]

Options:
    -Registry <name>    Docker registry/username (default: ernijsansons)
    -Tag <tag>          Image tag (default: latest)
    -Build              Build images only
    -Push               Push existing images only
    -All                Build and push images
    -Help               Show this help

Examples:
    .\docker-push.ps1 -All                    # Build and push all images
    .\docker-push.ps1 -Build                  # Build images only
    .\docker-push.ps1 -Push                   # Push existing images
    .\docker-push.ps1 -Registry myregistry -Tag v1.0.0 -All

"@
}

# Main execution
function Main {
    if ($args -contains "-Help" -or $args -contains "--help") {
        Show-Help
        return
    }
    
    # Check if Docker is running
    if (-not (Test-DockerRunning)) {
        Write-ColorLog "Docker is not running. Please start Docker Desktop first." $Red
        Write-ColorLog "You can start Docker Desktop from the Start menu or system tray." $Yellow
        return
    }
    
    Write-ColorLog "ProtoThrive Docker Push Script" $Blue
    Write-ColorLog "Registry: $Registry" $Blue
    Write-ColorLog "Tag: $Tag" $Blue
    Write-ColorLog "================================" $Blue
    
    $success = $true
    
    if ($Build -or $All) {
        $success = Build-Images
        if (-not $success) {
            Write-ColorLog "Build failed. Exiting." $Red
            return
        }
    }
    
    if ($Push -or $All) {
        $success = Push-Images
        if (-not $success) {
            Write-ColorLog "Push failed. Exiting." $Red
            return
        }
    }
    
    if (-not $Build -and -not $Push -and -not $All) {
        Write-ColorLog "No action specified. Use -Build, -Push, or -All" $Yellow
        Show-Help
        return
    }
    
    if ($success) {
        Write-ColorLog "Docker operations completed successfully!" $Green
    }
}

# Run main function
Main
