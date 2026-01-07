import { useState } from "react";
import FilePicker from "./components/FilePicker";
import RecorderPanel from "./components/RecorderPanel";
import ResultPanel from "./components/ResultPanel";
import { analyzeCoughAudio } from "./services/api";
import "./styles/app.css";

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

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [requestStatus, setRequestStatus] = useState("idle");
  const [requestError, setRequestError] = useState("");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const isLoading = requestStatus === "loading";

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setAnalysisResult(null);
    setRequestError("");
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setRequestError("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile || isLoading) {
      return;
    }

    setRequestStatus("loading");
    setRequestError("");
    setAnalysisResult(null);

    try {
      const result = await analyzeCoughAudio(selectedFile, apiBaseUrl);
      setAnalysisResult(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error occurred.";
      setRequestError(message);
    } finally {
      setRequestStatus("idle");
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <p className="eyebrow">CoughSense</p>
          <h1>Cough audio analysis</h1>
          <p className="subtitle">
            Record a cough sample or upload a file, then send it to the backend
            for analysis.
          </p>
        </header>

        <section className="panel">
          <h2>1. Provide audio</h2>
          <div className="panel-grid">
            <RecorderPanel onFileReady={handleFileSelected} />
            <FilePicker onFileSelected={handleFileSelected} />
          </div>
        </section>

        <section className="panel">
          <h2>2. Selected audio</h2>
          {!selectedFile && <p>No audio selected.</p>}
          {selectedFile && (
            <div className="selection">
              <div>
                <p className="file-name">{selectedFile.name}</p>
                <p className="muted">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button type="button" onClick={handleClearSelection}>
                Clear selection
              </button>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>3. Send to backend</h2>
          {!apiBaseUrl && (
            <p className="error">
              Missing API base URL. Set VITE_API_BASE_URL in your environment.
            </p>
          )}
          <div className="button-row">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!selectedFile || !apiBaseUrl || isLoading}
            >
              {isLoading ? "Sending..." : "Analyze"}
            </button>
          </div>
        </section>

        <ResultPanel
          result={analysisResult}
          error={requestError}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
