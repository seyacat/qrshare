#!/usr/bin/env python3
"""
Simple HTTP server for QRShare web app
Usage: python3 server.py [port]
"""

import http.server
import socketserver
import sys
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow CORS for testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

# Change to web directory
web_dir = Path(__file__).parent
import os
os.chdir(web_dir)

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"🚀 Servidor HTTP en http://localhost:{PORT}")
    print(f"📝 URL para compartir: http://localhost:{PORT}")
    print(f"📱 Receiver: http://localhost:{PORT}?peer=TOKEN")
    print(f"⛔ Ctrl+C para detener")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Servidor detenido")
