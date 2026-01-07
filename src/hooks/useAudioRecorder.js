import { useEffect, useRef, useState } from "react";

export function useAudioRecorder() {
  const [status, setStatus] = useState("idle");
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const isSupported =
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    navigator?.mediaDevices?.getUserMedia;

  const stopStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      stopStream();
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (!isSupported) {
      setError("Recording is not supported in this browser.");
      return;
    }

    setError("");
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Build a single blob from recorded chunks.
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const nextUrl = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(nextUrl);
        setStatus("stopped");
        stopStream();
      };

      recorder.start();
      setStatus("recording");
    } catch (err) {
      setError("Microphone access failed or was denied.");
      setStatus("idle");
      stopStream();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl("");
    setStatus("idle");
  };

  return {
    isSupported,
    status,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
