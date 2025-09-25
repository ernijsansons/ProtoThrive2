# Quick Docker commands
function Docker-Build { docker-compose build }
function Docker-Up { docker-compose up -d }
function Docker-Down { docker-compose down }
function Docker-Logs { docker-compose logs -f }
function Docker-Clean { 
    docker-compose down
    docker system prune -f
}
