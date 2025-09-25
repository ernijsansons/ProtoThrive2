#!/bin/bash

# Enterprise Security Scanning Script for ProtoThrive Docker Images
# Implements comprehensive security scanning and compliance checks

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Configuration
SCAN_RESULTS_DIR="/tmp/security-scan-results"
TRIVY_CACHE_DIR="/tmp/trivy-cache"
CLAMAV_DB_DIR="/tmp/clamav-db"

# Create directories
mkdir -p "$SCAN_RESULTS_DIR" "$TRIVY_CACHE_DIR" "$CLAMAV_DB_DIR"

log "Starting enterprise security scan for ProtoThrive Docker images..."

# =============================================================================
# Function: Update ClamAV database
# =============================================================================
update_clamav_db() {
    log "Updating ClamAV virus database..."
    
    if command -v freshclam >/dev/null 2>&1; then
        freshclam --datadir="$CLAMAV_DB_DIR" --log=/tmp/clamav-update.log
        success "ClamAV database updated successfully"
    else
        warning "ClamAV not found, skipping virus scan"
        return 1
    fi
}

# =============================================================================
# Function: Scan for vulnerabilities with Trivy
# =============================================================================
scan_vulnerabilities() {
    local image_name="$1"
    local output_file="$SCAN_RESULTS_DIR/trivy-${image_name//[\/:]/_}.json"
    
    log "Scanning $image_name for vulnerabilities with Trivy..."
    
    if command -v trivy >/dev/null 2>&1; then
        trivy image \
            --format json \
            --output "$output_file" \
            --cache-dir "$TRIVY_CACHE_DIR" \
            --severity HIGH,CRITICAL \
            "$image_name"
        
        # Check for high/critical vulnerabilities
        local vuln_count=$(jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL") | .VulnerabilityID' "$output_file" 2>/dev/null | wc -l)
        
        if [ "$vuln_count" -gt 0 ]; then
            error "Found $vuln_count high/critical vulnerabilities in $image_name"
            return 1
        else
            success "No high/critical vulnerabilities found in $image_name"
        fi
    else
        warning "Trivy not found, skipping vulnerability scan"
        return 1
    fi
}

# =============================================================================
# Function: Scan for malware with ClamAV
# =============================================================================
scan_malware() {
    local image_name="$1"
    local output_file="$SCAN_RESULTS_DIR/clamav-${image_name//[\/:]/_}.log"
    
    log "Scanning $image_name for malware with ClamAV..."
    
    if command -v clamscan >/dev/null 2>&1; then
        # Create temporary directory for image contents
        local temp_dir="/tmp/clamav-scan-$$"
        mkdir -p "$temp_dir"
        
        # Extract image contents (simplified approach)
        docker save "$image_name" | tar -x -C "$temp_dir" 2>/dev/null || true
        
        # Scan extracted contents
        clamscan \
            --recursive \
            --infected \
            --log="$output_file" \
            --database="$CLAMAV_DB_DIR" \
            "$temp_dir" || true
        
        # Clean up
        rm -rf "$temp_dir"
        
        # Check for infections
        if grep -q "FOUND" "$output_file" 2>/dev/null; then
            error "Malware detected in $image_name"
            cat "$output_file"
            return 1
        else
            success "No malware detected in $image_name"
        fi
    else
        warning "ClamAV not found, skipping malware scan"
        return 1
    fi
}

# =============================================================================
# Function: Check image configuration security
# =============================================================================
check_image_security() {
    local image_name="$1"
    local output_file="$SCAN_RESULTS_DIR/config-${image_name//[\/:]/_}.json"
    
    log "Checking security configuration for $image_name..."
    
    # Inspect image configuration
    docker inspect "$image_name" > "$output_file"
    
    local security_issues=0
    
    # Check if running as root
    local user=$(jq -r '.[0].Config.User // "root"' "$output_file")
    if [ "$user" = "root" ] || [ "$user" = "" ]; then
        warning "$image_name is running as root user"
        security_issues=$((security_issues + 1))
    fi
    
    # Check for privileged mode
    local privileged=$(jq -r '.[0].HostConfig.Privileged // false' "$output_file")
    if [ "$privileged" = "true" ]; then
        error "$image_name is running in privileged mode"
        security_issues=$((security_issues + 1))
    fi
    
    # Check for read-only filesystem
    local readonly=$(jq -r '.[0].HostConfig.ReadonlyRootfs // false' "$output_file")
    if [ "$readonly" = "false" ]; then
        warning "$image_name does not have read-only root filesystem"
        security_issues=$((security_issues + 1))
    fi
    
    # Check for security options
    local security_opts=$(jq -r '.[0].HostConfig.SecurityOpt // []' "$output_file")
    if [ "$security_opts" = "[]" ]; then
        warning "$image_name has no security options configured"
        security_issues=$((security_issues + 1))
    fi
    
    if [ $security_issues -eq 0 ]; then
        success "Security configuration looks good for $image_name"
    else
        warning "Found $security_issues security configuration issues in $image_name"
    fi
}

# =============================================================================
# Function: Generate security report
# =============================================================================
generate_report() {
    local report_file="$SCAN_RESULTS_DIR/security-report-$(date +%Y%m%d-%H%M%S).html"
    
    log "Generating comprehensive security report..."
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>ProtoThrive Security Scan Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        .code { background-color: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ProtoThrive Enterprise Security Scan Report</h1>
        <p>Generated on: $(date)</p>
        <p>Scan ID: $(uuidgen)</p>
    </div>
    
    <div class="section">
        <h2>Scan Summary</h2>
        <p>Total images scanned: $(find "$SCAN_RESULTS_DIR" -name "trivy-*.json" | wc -l)</p>
        <p>Scan duration: $(date)</p>
    </div>
    
    <div class="section">
        <h2>Vulnerability Scan Results</h2>
        <div class="code">
            $(find "$SCAN_RESULTS_DIR" -name "trivy-*.json" -exec echo "File: {}" \; -exec jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL") | {VulnerabilityID, Severity, Title}' {} \; 2>/dev/null || echo "No high/critical vulnerabilities found")
        </div>
    </div>
    
    <div class="section">
        <h2>Malware Scan Results</h2>
        <div class="code">
            $(find "$SCAN_RESULTS_DIR" -name "clamav-*.log" -exec echo "File: {}" \; -exec cat {} \; 2>/dev/null || echo "No malware detected")
        </div>
    </div>
    
    <div class="section">
        <h2>Security Configuration</h2>
        <div class="code">
            $(find "$SCAN_RESULTS_DIR" -name "config-*.json" -exec echo "Image: {}" \; -exec jq '.[0] | {User: .Config.User, Privileged: .HostConfig.Privileged, ReadonlyRootfs: .HostConfig.ReadonlyRootfs, SecurityOpt: .HostConfig.SecurityOpt}' {} \; 2>/dev/null)
        </div>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Ensure all images run as non-root users</li>
            <li>Enable read-only root filesystems where possible</li>
            <li>Configure appropriate security options</li>
            <li>Regularly update base images and dependencies</li>
            <li>Implement automated security scanning in CI/CD pipeline</li>
        </ul>
    </div>
</body>
</html>
EOF

    success "Security report generated: $report_file"
}

# =============================================================================
# Main execution
# =============================================================================
main() {
    log "ProtoThrive Enterprise Security Scanner"
    log "======================================"
    
    # Update ClamAV database
    update_clamav_db || true
    
    # Get list of images to scan
    local images=(
        "protothrive-frontend:enterprise"
        "protothrive-backend:enterprise"
    )
    
    local scan_failures=0
    
    # Scan each image
    for image in "${images[@]}"; do
        log "Scanning image: $image"
        
        # Check if image exists
        if ! docker image inspect "$image" >/dev/null 2>&1; then
            warning "Image $image not found, skipping..."
            continue
        fi
        
        # Run security scans
        scan_vulnerabilities "$image" || scan_failures=$((scan_failures + 1))
        scan_malware "$image" || scan_failures=$((scan_failures + 1))
        check_image_security "$image" || scan_failures=$((scan_failures + 1))
        
        echo "----------------------------------------"
    done
    
    # Generate comprehensive report
    generate_report
    
    # Summary
    if [ $scan_failures -eq 0 ]; then
        success "All security scans completed successfully!"
        exit 0
    else
        error "Security scan completed with $scan_failures failures"
        exit 1
    fi
}

# Run main function
main "$@"
