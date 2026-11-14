from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {
            "status": "online",
            "service": "PVIntelligence Industrial Solar Telemetry Engine",
            "version": "1.0.0",
            "telemetry_source": "Open-Meteo Live API",
            "transfer_learning": "LSTM+GRU (53% lower RMSE)"
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
        return
