import { useAudioRecorder } from "../hooks/useAudioRecorder";

function formatDurationLabel(status, audioUrl) {
  if (status === "recording") {
    return "Recording...";
  }
  if (audioUrl) {
    return "Ready";
  }
  return "Idle";
}

export default function RecorderPanel({ onFileReady }) {
  const {
    isSupported,
    status,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const isRecording = status === "recording";
  const statusLabel = formatDurationLabel(status, audioUrl);

  const handleUseRecording = () => {
    if (!audioBlob) {
      return;
    }

    const filename = `cough-recording-${Date.now()}.webm`;
    const file = new File([audioBlob], filename, {
      type: audioBlob.type || "audio/webm",
    });
    onFileReady(file);
  };

  return (
    <section className="panel">
      <h2>Record cough sample</h2>
      <p>Use your microphone to capture a short cough sample.</p>
      <div className="button-row">
        <button
          type="button"
          onClick={startRecording}
          disabled={!isSupported || isRecording}
        >
          Start recording
        </button>
        <button type="button" onClick={stopRecording} disabled={!isRecording}>
          Stop
        </button>
        <button type="button" onClick={clearRecording} disabled={!audioBlob}>
          Clear
        </button>
      </div>
      <p className="status-line">Status: {statusLabel}</p>
      {!isSupported && (
        <p className="muted">Recording is not supported in this browser.</p>
      )}
      {error && <p className="error">{error}</p>}
      {audioUrl && (
        <div className="preview">
          <audio controls src={audioUrl} />
          <button type="button" onClick={handleUseRecording}>
            Use this recording
          </button>
        </div>
      )}
    </section>
  );
}
