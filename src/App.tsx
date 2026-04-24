import { useState, useEffect } from "react";
import CameraFeed from "./components/CameraFeed";
import { getStatusUrl } from "./config";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const [apiUrl, setApiUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [editMode, setEditMode] = useState<boolean>(false);

  useEffect(() => {
    // Load URL from localStorage or use default
    const savedUrl = localStorage.getItem("backendUrl");
    const url = savedUrl || getStatusUrl();
    setApiUrl(url);
    setInputUrl(url);
  }, []);

  useEffect(() => {
    // Check backend health
    const checkBackend = async () => {
      try {
        const response = await fetch(`${apiUrl}/`, {
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

    if (apiUrl) {
      checkBackend();
      const interval = setInterval(checkBackend, 5000);
      return () => clearInterval(interval);
    }
  }, [apiUrl]);

  const handleSaveUrl = () => {
    let url = inputUrl.trim();
    // Remove trailing slash
    url = url.replace(/\/$/, "");

    if (!url) {
      alert("Please enter a valid URL");
      return;
    }

    // Ensure URL has protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
      setInputUrl(url);
    }

    setApiUrl(url);
    localStorage.setItem("backendUrl", url);
    setEditMode(false);
  };

  const handleResetUrl = () => {
    const defaultUrl = getStatusUrl();
    setInputUrl(defaultUrl);
    setApiUrl(defaultUrl);
    localStorage.removeItem("backendUrl");
    setEditMode(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚦 YOLO Real-Time Detection</h1>

        <div className="url-config-section">
          {!editMode ? (
            <div className="url-display">
              <div className="url-info">
                <label>Server URL:</label>
                <code className="url-value">{apiUrl || "Not configured"}</code>
              </div>
              <button
                onClick={() => setEditMode(true)}
                className="config-button"
              >
                ⚙️ Change URL
              </button>
            </div>
          ) : (
            <div className="url-edit">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://your-server.com or localhost:8000"
                className="url-input"
              />
              <div className="button-group">
                <button onClick={handleSaveUrl} className="save-button">
                  ✓ Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="cancel-button"
                >
                  ✗ Cancel
                </button>
                <button onClick={handleResetUrl} className="reset-button">
                  ↻ Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="status-indicator">
          <span className={`status-badge ${backendStatus}`}>
            Backend:{" "}
            {backendStatus === "connected" ? "✓ Connected" : "✗ Disconnected"}
          </span>
        </div>
      </header>

      <main className="app-main">
        {backendStatus === "connected" ? (
          <CameraFeed apiUrl={apiUrl} />
        ) : (
          <div className="error-message">
            <p>⚠️ Cannot connect to backend server</p>
            <p>
              Current URL: <code>{apiUrl || "Not configured"}</code>
            </p>
            <button
              onClick={() => setEditMode(true)}
              className="edit-url-button"
            >
              Edit Server URL
            </button>
            <p style={{ marginTop: "15px", fontSize: "0.9em", color: "#666" }}>
              {editMode
                ? "Enter your backend server URL above and click Save"
                : "Click 'Change URL' in the header to configure your server"}
            </p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Server: <code>{apiUrl || "Not configured"}</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
