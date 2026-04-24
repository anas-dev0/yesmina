import { useState, useEffect } from "react";
import CameraFeed from "./components/CameraFeed";
import { getStatusUrl } from "./config";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const [apiUrl, setApiUrl] = useState<string>("");

  useEffect(() => {
    const url = getStatusUrl();
    setApiUrl(url);

    const checkBackend = async () => {
      try {
        const response = await fetch(`${url}/`, {
          method: "GET",
          mode: "cors",
        });
        if (response.ok) {
          setBackendStatus("connected");
        } else {
          setBackendStatus("disconnected");
        }
      } catch (error) {
        console.warn("Backend connection check failed:", error);
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
            <p>⚠️ Cannot connect to backend server</p>
            <p>
              Backend URL: <code>{apiUrl}</code>
            </p>
            <p>If running locally, make sure the FastAPI server is running:</p>
            <code>cd backend && python main.py</code>
            <p style={{ marginTop: "15px", fontSize: "0.9em", color: "#666" }}>
              For remote backends, configure via environment variable:{" "}
              <code>VITE_API_URL</code>
            </p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Backend URL: <code>{apiUrl}</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
