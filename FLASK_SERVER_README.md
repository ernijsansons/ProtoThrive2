# Flask Web Server

A simple Flask web server with three endpoints for basic API operations.

## Features

- **GET /** - Welcome endpoint with current timestamp
- **GET /health** - Health check endpoint
- **POST /echo** - Echo endpoint that returns JSON data with added timestamp
- Error handling for 404 and 500 errors
- Structured logging

## Requirements

- Python 3.8 or higher
- Flask 3.0.0
- Werkzeug 3.0.1

## Installation

1. Install the required dependencies:

```bash
pip install Flask==3.0.0 Werkzeug==3.0.1
```

Or install from the requirements.txt file:

```bash
pip install -r requirements.txt
```

## Running the Server

Start the server with:

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### 1. Welcome Endpoint

**Request:**
```bash
curl http://localhost:5000/
```

**Response:**
```json
{
  "message": "Welcome to the Flask API Server",
  "timestamp": "2025-10-04T12:34:56.789012"
}
```

### 2. Health Check Endpoint

**Request:**
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-04T12:34:56.789012"
}
```

### 3. Echo Endpoint

**Request:**
```bash
curl -X POST http://localhost:5000/echo \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "message": "Hello World"}'
```

**Response:**
```json
{
  "name": "John",
  "message": "Hello World",
  "timestamp": "2025-10-04T12:34:56.789012"
}
```

## Error Handling

The server includes error handling for:
- **400 Bad Request** - When non-JSON data is sent to /echo
- **404 Not Found** - When accessing undefined endpoints
- **500 Internal Server Error** - For unexpected server errors

## Logging

The server uses Python's built-in logging module with INFO level logging. All requests and errors are logged with timestamps.

## Development Mode

The server runs in debug mode by default, which provides:
- Auto-reload on code changes
- Detailed error pages
- Enhanced logging

For production, set `debug=False` in the `app.run()` call.
