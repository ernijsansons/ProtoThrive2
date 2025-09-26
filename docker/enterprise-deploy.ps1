# Enterprise Docker Deployment Script for ProtoThrive (PowerShell)
# Implements comprehensive deployment with security, monitoring, and best practices

param(
    [switch]$SkipBuild,
    [switch]$SkipRegistry,
    [switch]$Cleanup,
    [switch]$Verbose,
    [switch]$DryRun,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $ProjectRoot ".env"
$DockerComposeFile = Join-Path $ProjectRoot "docker-compose.enterprise.yml"
$RegistryComposeFile = Join-Path $ScriptDir "docker-registry.yml"
$LogFile = "C:\temp\protothrive-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Create log directory if it doesn't exist
$LogDir = Split-Path -Parent $LogFile
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Logging functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

function Write-Error-Log {
    param([string]$Message)
    Write-Log -Message $Message -Level "ERROR"
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Log -Message $Message -Level "WARNING"
    Write-Host "WARNING: $Message" -ForegroundColor Yellow
}

function Write-Success-Log {
    param([string]$Message)
    Write-Log -Message $Message -Level "SUCCESS"
    Write-Host "SUCCESS: $Message" -ForegroundColor Green
}

function Write-Info-Log {
    param([string]$Message)
    Write-Log -Message $Message -Level "INFO"
    Write-Host "INFO: $Message" -ForegroundColor Cyan
}

# =============================================================================
# Function: Check prerequisites
# =============================================================================
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check Docker
    try {
        $null = docker --version
    }
    catch {
        Write-Error-Log "Docker is not installed or not in PATH"
    }
    
    # Check Docker Compose
    try {
        $null = docker-compose --version
    }
    catch {
        Write-Error-Log "Docker Compose is not installed or not in PATH"
    }
    
    # Check Docker daemon
    try {
        $null = docker info
    }
    catch {
        Write-Error-Log "Docker daemon is not running"
    }
    
    # Check available disk space (minimum 10GB)
    $Drive = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $FreeSpaceGB = [math]::Round($Drive.FreeSpace / 1GB, 2)
    if ($FreeSpaceGB -lt 10) {
        Write-Warning-Log "Low disk space: ${FreeSpaceGB}GB available (minimum 10GB recommended)"
    }
    
    # Check available memory (minimum 8GB)
    $Memory = Get-WmiObject -Class Win32_ComputerSystem
    $TotalMemoryGB = [math]::Round($Memory.TotalPhysicalMemory / 1GB, 2)
    if ($TotalMemoryGB -lt 8) {
        Write-Warning-Log "Low memory: ${TotalMemoryGB}GB available (minimum 8GB recommended)"
    }
    
    Write-Success-Log "Prerequisites check completed"
}

# =============================================================================
# Function: Setup environment
# =============================================================================
function Initialize-Environment {
    Write-Log "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if (!(Test-Path $EnvFile)) {
        Write-Log "Creating environment file..."
        
        # Generate secure passwords
        $PostgresPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
        $RedisPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
        $JwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 16)
        $EncryptionKey = [System.Web.Security.Membership]::GeneratePassword(32, 8)
        $GrafanaPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
        $MinioPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
        $RegistryPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
        $RegistrySecret = [System.Web.Security.Membership]::GeneratePassword(32, 8)
        
        $EnvContent = @"
# ProtoThrive Enterprise Environment Configuration
# Generated on $(Get-Date)

# Environment
NODE_ENV=production
ENVIRONMENT=production

# Database Configuration
POSTGRES_PASSWORD=$PostgresPassword
DATABASE_URL=postgresql://protothrive:$PostgresPassword@postgres:5432/protothrive

# Redis Configuration
REDIS_PASSWORD=$RedisPassword
REDIS_URL=redis://redis:6379

# JWT and Encryption
JWT_SECRET=$JwtSecret
ENCRYPTION_KEY=$EncryptionKey

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Spline Configuration
NEXT_PUBLIC_SPLINE_SCENE=https://prod.spline.design/your_scene_url

# Monitoring Configuration
GRAFANA_PASSWORD=$GrafanaPassword

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$MinioPassword

# Registry Configuration
REGISTRY_USERNAME=protothrive
REGISTRY_PASSWORD=$RegistryPassword
REGISTRY_HTTP_SECRET=$RegistrySecret

# Port Configuration
FRONTEND_PORT=3000
BACKEND_PORT=8787
POSTGRES_PORT=5432
REDIS_PORT=6379
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
JAEGER_UI_PORT=16686
JAEGER_AGENT_PORT=14268
MAILHOG_SMTP_PORT=1025
MAILHOG_WEB_PORT=8025
REGISTRY_PORT=5000
REGISTRY_UI_PORT=8080
REGISTRY_MONITOR_PORT=9091
"@
        
        Set-Content -Path $EnvFile -Value $EnvContent
        Write-Success-Log "Environment file created: $EnvFile"
    }
    else {
        Write-Info-Log "Environment file already exists: $EnvFile"
    }
    
    # Create necessary directories
    $Directories = @(
        "database\init",
        "database\backups",
        "monitoring\prometheus",
        "monitoring\grafana\provisioning",
        "monitoring\grafana\dashboards",
        "nginx\conf.d",
        "nginx\ssl",
        "backups\registry"
    )
    
    foreach ($Dir in $Directories) {
        $FullPath = Join-Path $ProjectRoot $Dir
        if (!(Test-Path $FullPath)) {
            New-Item -ItemType Directory -Path $FullPath -Force | Out-Null
        }
    }
    
    Write-Success-Log "Environment setup completed"
}

# =============================================================================
# Function: Build enterprise images
# =============================================================================
function Build-Images {
    Write-Log "Building enterprise Docker images..."
    
    # Build frontend image
    Write-Log "Building frontend image..."
    $FrontendBuildArgs = @(
        "build",
        "-f", "frontend\Dockerfile.enterprise",
        "-t", "protothrive-frontend:enterprise",
        "--target", "runner",
        "--build-arg", "NODE_ENV=production",
        "frontend"
    )
    
    $Process = Start-Process -FilePath "docker" -ArgumentList $FrontendBuildArgs -WorkingDirectory $ProjectRoot -Wait -PassThru -NoNewWindow
    if ($Process.ExitCode -ne 0) {
        Write-Error-Log "Failed to build frontend image"
    }
    
    # Build backend image
    Write-Log "Building backend image..."
    $BackendBuildArgs = @(
        "build",
        "-f", "backend\Dockerfile.enterprise",
        "-t", "protothrive-backend:enterprise",
        "--target", "runner",
        "--build-arg", "ENVIRONMENT=production",
        "backend"
    )
    
    $Process = Start-Process -FilePath "docker" -ArgumentList $BackendBuildArgs -WorkingDirectory $ProjectRoot -Wait -PassThru -NoNewWindow
    if ($Process.ExitCode -ne 0) {
        Write-Error-Log "Failed to build backend image"
    }
    
    Write-Success-Log "Enterprise images built successfully"
}

# =============================================================================
# Function: Deploy services
# =============================================================================
function Deploy-Services {
    Write-Log "Deploying enterprise services..."
    
    # Start services
    $ComposeArgs = @("-f", $DockerComposeFile, "up", "-d")
    $Process = Start-Process -FilePath "docker-compose" -ArgumentList $ComposeArgs -WorkingDirectory $ProjectRoot -Wait -PassThru -NoNewWindow
    if ($Process.ExitCode -ne 0) {
        Write-Error-Log "Failed to start services"
    }
    
    # Wait for services to be healthy
    Write-Log "Waiting for services to be healthy..."
    $MaxAttempts = 60
    $Attempt = 1
    
    do {
        $UnhealthyServices = docker-compose -f $DockerComposeFile ps --services --filter "health=unhealthy" | Measure-Object -Line | Select-Object -ExpandProperty Lines
        if ($UnhealthyServices -eq 0) {
            Write-Success-Log "All services are healthy"
            break
        }
        
        Write-Log "Waiting for services to be healthy... ($UnhealthyServices unhealthy, attempt $Attempt/$MaxAttempts)"
        Start-Sleep -Seconds 5
        $Attempt++
    } while ($Attempt -le $MaxAttempts)
    
    if ($Attempt -gt $MaxAttempts) {
        Write-Warning-Log "Some services may not be fully healthy yet"
    }
}

# =============================================================================
# Function: Verify deployment
# =============================================================================
function Test-Deployment {
    Write-Log "Verifying deployment..."
    
    # Check service status
    docker-compose -f $DockerComposeFile ps
    
    # Test endpoints
    $Endpoints = @(
        "http://localhost:3000/api/health",
        "http://localhost:8787/health",
        "http://localhost:9090/-/healthy",
        "http://localhost:3001/api/health"
    )
    
    foreach ($Endpoint in $Endpoints) {
        try {
            $Response = Invoke-WebRequest -Uri $Endpoint -TimeoutSec 10 -UseBasicParsing
            if ($Response.StatusCode -eq 200) {
                Write-Success-Log "Endpoint $Endpoint is responding"
            }
        }
        catch {
            Write-Warning-Log "Endpoint $Endpoint is not responding"
        }
    }
    
    # Display service URLs
    Write-Info-Log "Service URLs:"
    Write-Info-Log "  Frontend: http://localhost:3000"
    Write-Info-Log "  Backend API: http://localhost:8787"
    Write-Info-Log "  Grafana: http://localhost:3001"
    Write-Info-Log "  Prometheus: http://localhost:9090"
    Write-Info-Log "  Kibana: http://localhost:5601"
    Write-Info-Log "  Jaeger: http://localhost:16686"
    Write-Info-Log "  MinIO Console: http://localhost:9001"
}

# =============================================================================
# Function: Display help
# =============================================================================
function Show-Help {
    Write-Host @"
ProtoThrive Enterprise Docker Deployment Script (PowerShell)

Usage: .\enterprise-deploy.ps1 [OPTIONS]

Options:
    -SkipBuild        Skip building images (use existing ones)
    -SkipRegistry     Skip registry setup
    -Cleanup          Clean up before deployment
    -Verbose          Enable verbose output
    -DryRun           Show what would be done without executing
    -Help             Show this help message

Examples:
    .\enterprise-deploy.ps1                  # Full deployment
    .\enterprise-deploy.ps1 -SkipBuild       # Deploy without rebuilding images
    .\enterprise-deploy.ps1 -Cleanup         # Clean up and deploy fresh
    .\enterprise-deploy.ps1 -DryRun          # Show deployment plan

"@
}

# =============================================================================
# Main execution
# =============================================================================
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    # Set verbose mode
    if ($Verbose) {
        $VerbosePreference = "Continue"
    }
    
    # Dry run mode
    if ($DryRun) {
        Write-Info-Log "DRY RUN MODE - No changes will be made"
        Write-Info-Log "Would execute:"
        Write-Info-Log "  1. Check prerequisites"
        Write-Info-Log "  2. Setup environment"
        if (!$SkipBuild) {
            Write-Info-Log "  3. Build enterprise images"
        }
        Write-Info-Log "  4. Deploy services"
        Write-Info-Log "  5. Verify deployment"
        return
    }
    
    # Start deployment
    Write-Log "Starting ProtoThrive Enterprise Docker Deployment"
    Write-Log "Log file: $LogFile"
    
    # Cleanup if requested
    if ($Cleanup) {
        Write-Log "Cleaning up existing deployment..."
        docker-compose -f $DockerComposeFile down -v
        docker system prune -f
    }
    
    # Execute deployment steps
    Test-Prerequisites
    Initialize-Environment
    
    if (!$SkipBuild) {
        Build-Images
    }
    
    Deploy-Services
    Test-Deployment
    
    Write-Success-Log "ProtoThrive Enterprise deployment completed successfully!"
    Write-Info-Log "Check the log file for detailed information: $LogFile"
}

# Run main function
Main


