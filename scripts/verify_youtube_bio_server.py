#!/usr/bin/env python3
"""
HTTP Server for YouTube Bio Verification
Can be used as a replacement for the Supabase Edge Function
"""

import json
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from verify_youtube_bio import fetch_youtube_bio


class YouTubeBioHandler(BaseHTTPRequestHandler):
    """HTTP request handler for YouTube bio verification."""
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for bio verification."""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            # Parse JSON
            try:
                data = json.loads(body.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_error_response(400, 'Invalid JSON')
                return
            
            # Support multiple field names for channel identifier
            channel_identifier = (
                data.get('channel_identifier') or 
                data.get('username') or 
                data.get('channel_id') or
                data.get('channel')
            )
            verification_code = data.get('verification_code')
            api_key = data.get('api_key')  # Optional, can also use env var
            
            if not channel_identifier:
                self.send_error_response(400, 'channel_identifier, username, or channel_id is required')
                return
            
            # Fetch bio and verify
            result = fetch_youtube_bio(channel_identifier, verification_code, api_key)
            
            # Send response
            self.send_json_response(200, result)
            
        except Exception as e:
            self.send_error_response(500, f'Internal server error: {str(e)}')
    
    def send_json_response(self, status_code: int, data: dict):
        """Send JSON response with CORS headers."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = json.dumps(data).encode('utf-8')
        self.wfile.write(response)
    
    def send_error_response(self, status_code: int, error_message: str):
        """Send error response."""
        self.send_json_response(status_code, {
            'success': False,
            'error': error_message
        })
    
    def log_message(self, format, *args):
        """Override to customize logging."""
        print(f"[{self.address_string()}] {format % args}")


def run_server(port: int = 8002):
    """Run the HTTP server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, YouTubeBioHandler)
    print(f'YouTube Bio Verification Server running on port {port}')
    print(f'POST requests to http://localhost:{port}/')
    print(f'Set YOUTUBE_API_KEY environment variable for API key')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.shutdown()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8002
    run_server(port)














