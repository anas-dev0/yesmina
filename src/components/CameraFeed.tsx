import { useEffect, useRef, useState } from "react";
import "./CameraFeed.css";

interface DetectionInfo {
  num_detections: number;
  classes: number[];
  confidences: number[];
}

interface WebSocketMessage {
  image: string;
  detections: DetectionInfo;
  success: boolean;
  error?: string;
}

const CameraFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [detections, setDetections] = useState<DetectionInfo | null>(null);
  const [fps, setFps] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const fpsRef = useRef({ lastTime: Date.now(), frameCount: 0 });

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
      } catch (error) {
        console.error("Failed to access camera:", error);
        alert("Failed to access camera. Please check permissions.");
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    if (!isRunning) return;

    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket("ws://localhost:8000/ws/stream");

        wsRef.current.onopen = () => {
          console.log("WebSocket connected");
          setWsConnected(true);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            if (message.success) {
              // Display annotated frame
              const img = new Image();
              img.onload = () => {
                const ctx = resultCanvasRef.current?.getContext("2d");
                if (ctx && resultCanvasRef.current) {
                  ctx.drawImage(img, 0, 0);
                }
              };
              img.src = `data:image/jpeg;base64,${message.image}`;

              // Update detections
              setDetections(message.detections);

              // Update FPS
              const now = Date.now();
              fpsRef.current.frameCount++;
              if (now - fpsRef.current.lastTime >= 1000) {
                setFps(fpsRef.current.frameCount);
                fpsRef.current.frameCount = 0;
                fpsRef.current.lastTime = now;
              }
            } else {
              console.error("Inference error:", message.error);
            }
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
          setWsConnected(false);
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket closed");
          setWsConnected(false);
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isRunning]);

  // Capture and send frames
  useEffect(() => {
    if (
      !isRunning ||
      !cameraReady ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const frameIntervalId = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            videoRef.current,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );
          const base64Frame = canvasRef.current
            .toDataURL("image/jpeg", 0.8)
            .split(",")[1];

          // Send frame to WebSocket
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                frame: base64Frame,
              }),
            );
          }
        }
      }
    }, 33); // ~30 FPS

    return () => clearInterval(frameIntervalId);
  }, [isRunning, cameraReady, wsConnected]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="camera-feed-container">
      <div className="camera-view">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="video-element hidden"
        />
        <canvas ref={canvasRef} className="hidden" width={640} height={480} />
        <canvas
          ref={resultCanvasRef}
          className="result-canvas"
          width={640}
          height={480}
        />
        {!cameraReady && <div className="loading">Initializing camera...</div>}
      </div>

      <div className="controls">
        <button
          onClick={handleStartStop}
          className={`start-button ${isRunning ? "running" : ""}`}
        >
          {isRunning ? "⏹ Stop Detection" : "▶ Start Detection"}
        </button>

        <div className="status-info">
          <div className={`ws-status ${wsConnected ? "connected" : ""}`}>
            {wsConnected ? "🟢" : "🔴"} WebSocket:{" "}
            {wsConnected ? "Connected" : "Disconnected"}
          </div>
          <div className="fps-display">
            FPS: <span className="fps-value">{fps}</span>
          </div>
        </div>
      </div>

      {detections && (
        <div className="detection-stats">
          <h3>📊 Detection Results</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Objects Detected:</span>
              <span className="stat-value">{detections.num_detections}</span>
            </div>
            {detections.num_detections > 0 && (
              <>
                <div className="stat-item">
                  <span className="stat-label">Classes:</span>
                  <span className="stat-value">
                    {detections.classes.join(", ")}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Confidence:</span>
                  <span className="stat-value">
                    {detections.confidences.length > 0
                      ? (
                          (detections.confidences.reduce((a, b) => a + b, 0) /
                            detections.confidences.length) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;
