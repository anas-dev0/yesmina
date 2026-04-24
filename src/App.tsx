import { useState, useEffect } from "react";
import CameraFeed from "./components/CameraFeed";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("https://kong-pointing-detroit-efficiently.trycloudflare.com ");
        if (response.ok) {
          setBackendStatus("connected");
        } else {
          setBackendStatus("disconnected");
        }
      } catch {
        setBackendStatus("disconnected");
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚦 YOLO Real-Time Detection</h1>
        <div className="status-indicator">
          <span className={`status-badge ${backendStatus}`}>
            Backend:{" "}
            {backendStatus === "connected" ? "✓ Connected" : "✗ Disconnected"}
          </span>
        </div>
      </header>

      <main className="app-main">
        {backendStatus === "connected" ? (
          <CameraFeed />
        ) : (
          <div className="error-message">
            <p>⚠️ Cannot connect to backend server at http://localhost:8000</p>
            <p>Please start the FastAPI server first:</p>
            <code>cd backend && python main.py</code>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Make sure the backend is running at <code>http://localhost:8000</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
