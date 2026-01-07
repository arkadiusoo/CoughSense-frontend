import { useEffect, useState } from "react";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import "./styles/app.css";

const SIMULATED_RESULTS = [
  "Healthy cough profile detected.",
  "Possible mild bronchitis signature detected.",
  "Potential asthma-related cough pattern detected.",
  "Cough profile suggests upper airway irritation.",
];

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function pickRandomResult() {
  const index = Math.floor(Math.random() * SIMULATED_RESULTS.length);
  return SIMULATED_RESULTS[index];
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [stage, setStage] = useState("input");
  const [progress, setProgress] = useState(0);
  const [resultText, setResultText] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const {
    isSupported,
    status,
    audioBlob,
    audioUrl,
    error: recorderError,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const isRecording = status === "recording";
  const statusLabel = isRecording ? "Recording..." : audioUrl ? "Ready" : "Idle";

  useEffect(() => {
    if (!audioBlob) {
      return;
    }

    // Wrap the recorded blob so the upload matches a file input.
    const filename = `cough-recording-${Date.now()}.webm`;
    const file = new File([audioBlob], filename, {
      type: audioBlob.type || "audio/webm",
    });
    setSelectedFile(file);
  }, [audioBlob]);

  useEffect(() => {
    if (stage !== "progress") {
      return;
    }

    let current = 0;
    setProgress(0);

    // Simulate progress while waiting for a backend response.
    const progressTimer = window.setInterval(() => {
      current = Math.min(current + Math.random() * 7 + 3, 95);
      setProgress(Math.round(current));
    }, 220);

    const responseTimer = window.setTimeout(() => {
      window.clearInterval(progressTimer);
      setProgress(100);
      setResultText(pickRandomResult());
      setStage("result");
    }, 3200);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(responseTimer);
    };
  }, [stage]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }
    setSelectedFile(file);
    clearRecording();
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setFileInputKey((value) => value + 1);
    clearRecording();
  };

  const handleAnalyze = () => {
    if (!selectedFile || stage !== "input") {
      return;
    }
    setStage("progress");
  };

  const handleReset = () => {
    setStage("input");
    setProgress(0);
    setResultText("");
    setSelectedFile(null);
    clearRecording();
    setFileInputKey((value) => value + 1);
  };

  return (
    <div className="app">
      <main className="card">
        <header className="header">
          <p className="eyebrow">CoughSense</p>
          <h1>Check your cough</h1>
          <p className="subtitle">
            Record a short cough sample or upload an audio file. Then run the
            analysis and see the result.
          </p>
        </header>

        {stage === "input" && (
          <div className="stage">
            <div className="control-row">
              <button
                type="button"
                className="primary"
                onClick={startRecording}
                disabled={!isSupported || isRecording}
              >
                Record cough
              </button>
              <button
                type="button"
                className="ghost"
                onClick={stopRecording}
                disabled={!isRecording}
              >
                Stop
              </button>
            </div>
            <p className="status-line">Status: {statusLabel}</p>
            {!isSupported && (
              <p className="muted">Recording is not supported in this browser.</p>
            )}
            {recorderError && <p className="error">{recorderError}</p>}
            {audioUrl && <audio controls src={audioUrl} />}

            <div className="divider">
              <span>or</span>
            </div>

            <label className="file-upload">
              <span>Upload audio file</span>
              <input
                key={fileInputKey}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
              />
            </label>

            {selectedFile && (
              <div className="file-summary">
                <div>
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="muted">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button type="button" className="ghost" onClick={handleClearSelection}>
                  Clear
                </button>
              </div>
            )}

            <button
              type="button"
              className="primary"
              onClick={handleAnalyze}
              disabled={!selectedFile}
            >
              Analyze
            </button>
          </div>
        )}

        {stage === "progress" && (
          <div className="stage">
            <p className="progress-label">Analyzing your cough sample...</p>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="muted">This takes a few seconds.</p>
          </div>
        )}

        {stage === "result" && (
          <div className="stage">
            <p className="result-label">Result</p>
            <p className="result-text">{resultText}</p>
            <button type="button" className="ghost" onClick={handleReset}>
              Analyze another sample
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
