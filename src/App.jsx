import { useEffect, useMemo, useRef, useState } from "react";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { useAnalysisHistory } from "./hooks/useAnalysisHistory";
import HistoryPanel from "./components/HistoryPanel";
import { locales, translations } from "./i18n/translations";
import { analyzeCoughAudio } from "./services/api";
import "./styles/app.css";

const DEFAULT_SIDEBAR_WIDTH = 320;
const LANGUAGE_STORAGE_KEY = "coughsense.language";
const THEME_STORAGE_KEY = "coughsense.theme";
const RESULT_INDEX_BY_TEXT = (() => {
  const map = new Map();
  Object.values(translations).forEach((entry) => {
    entry.simulatedResults.forEach((text, index) => {
      if (!map.has(text)) {
        map.set(text, index);
      }
    });
  });
  return map;
})();

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

function extractResultText(payload) {
  if (!payload) {
    return "";
  }
  if (typeof payload === "string") {
    return payload;
  }
  if (typeof payload.result === "string") {
    return payload.result;
  }
  if (typeof payload.prediction === "string") {
    return payload.prediction;
  }
  if (typeof payload.diagnosis === "string") {
    return payload.diagnosis;
  }
  if (typeof payload.label === "string") {
    return payload.label;
  }
  if (typeof payload.classification === "string") {
    return payload.classification;
  }
  if (typeof payload.message === "string") {
    return payload.message;
  }
  try {
    return JSON.stringify(payload);
  } catch {
    return "";
  }
}

function getSidebarMaxWidth() {
  if (typeof window === "undefined") {
    return DEFAULT_SIDEBAR_WIDTH;
  }
  return Math.round(window.innerWidth * 0.5);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getInitialLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && translations[stored]) {
    return stored;
  }

  const browserLanguage = navigator.language?.toLowerCase() || "";
  if (browserLanguage.startsWith("pl")) {
    return "pl";
  }
  if (browserLanguage.startsWith("es")) {
    return "es";
  }
  if (browserLanguage.startsWith("de")) {
    return "de";
  }
  return "en";
}

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [stage, setStage] = useState("input");
  const [progress, setProgress] = useState(0);
  const [resultText, setResultText] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [language, setLanguage] = useState(() => getInitialLanguage());
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [theme, setTheme] = useState(() => getInitialTheme());

  const progressTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  const { history, addEntry } = useAnalysisHistory();
  const t = translations[language] ?? translations.en;
  const locale = locales[language] ?? locales.en;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
  const mappedHistory = useMemo(
    () =>
      history.map((entry) => {
        if (typeof entry.resultKey === "number") {
          return entry;
        }
        const mappedKey = RESULT_INDEX_BY_TEXT.get(entry.result);
        if (typeof mappedKey === "number") {
          return { ...entry, resultKey: mappedKey };
        }
        return entry;
      }),
    [history]
  );

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
  const statusKey = isRecording ? "recording" : audioUrl ? "ready" : "idle";
  const statusLabel = `${t.statusPrefix} ${t.status[statusKey]}`;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }, [language]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = theme;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

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
    setAnalysisError("");
  }, [audioBlob]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }
    setSelectedFile(file);
    setAnalysisError("");
    clearRecording();
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setFileInputKey((value) => value + 1);
    clearRecording();
    setAnalysisError("");
  };

  const stopProgress = () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const startProgress = () => {
    stopProgress();
    let current = 0;
    setProgress(0);

    // Simulate progress while waiting for a backend response.
    progressTimerRef.current = window.setInterval(() => {
      current = Math.min(current + Math.random() * 7 + 3, 95);
      setProgress(Math.round(current));
    }, 220);
  };

  const handleAnalyzeRequest = () => {
    if (!selectedFile || stage !== "input") {
      return;
    }
    setShowDisclaimer(true);
  };

  const handleConfirmAnalyze = async () => {
    setShowDisclaimer(false);
    setAnalysisError("");
    if (!selectedFile) {
      return;
    }
    setStage("progress");
    startProgress();

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    try {
      const response = await analyzeCoughAudio(selectedFile, apiBaseUrl);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      stopProgress();
      setProgress(100);

      const result = extractResultText(response);
      setResultText(result || t.analysisErrorFallback);
      addEntry({ resultText: result || t.analysisErrorFallback });
      setStage("result");
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      stopProgress();
      const message =
        error instanceof Error && error.message
          ? error.message
          : t.analysisErrorFallback;
      setAnalysisError(message);
      setStage("input");
    }
  };

  const handleDismissDisclaimer = () => {
    setShowDisclaimer(false);
  };

  const handleToggleTheme = () => {
    setTheme((value) => (value === "dark" ? "light" : "dark"));
  };

  const handleReset = () => {
    requestIdRef.current += 1;
    stopProgress();
    setStage("input");
    setProgress(0);
    setResultText("");
    setSelectedFile(null);
    setAnalysisError("");
    clearRecording();
    setFileInputKey((value) => value + 1);
  };

  const handleToggleSidebar = () => {
    if (sidebarWidth === 0) {
      const maxWidth = getSidebarMaxWidth();
      setSidebarWidth(clamp(DEFAULT_SIDEBAR_WIDTH, 0, maxWidth));
      return;
    }
    setSidebarWidth(0);
  };

  const handleResizeStart = (event) => {
    event.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    // Track pointer on the window to support fast dragging.
    const handlePointerMove = (event) => {
      const maxWidth = getSidebarMaxWidth();
      const nextWidth = clamp(event.clientX, 0, maxWidth);
      setSidebarWidth(nextWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing]);

  useEffect(() => {
    const handleResize = () => {
      const maxWidth = getSidebarMaxWidth();
      setSidebarWidth((value) => Math.min(value, maxWidth));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="app">
      <button
        type="button"
        className="menu-button"
        onClick={handleToggleSidebar}
        aria-label={t.toggleHistoryLabel}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="top-controls">
        <div className="lang-switcher" aria-label={t.languageLabel}>
          <button
            type="button"
            className={`lang-button${language === "en" ? " active" : ""}`}
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            aria-label={t.languageEnglishLabel}
          >
            EN
          </button>
          <button
            type="button"
            className={`lang-button${language === "pl" ? " active" : ""}`}
            onClick={() => setLanguage("pl")}
            aria-pressed={language === "pl"}
            aria-label={t.languagePolishLabel}
          >
            PL
          </button>
          <button
            type="button"
            className={`lang-button${language === "es" ? " active" : ""}`}
            onClick={() => setLanguage("es")}
            aria-pressed={language === "es"}
            aria-label={t.languageSpanishLabel}
          >
            ES
          </button>
          <button
            type="button"
            className={`lang-button${language === "de" ? " active" : ""}`}
            onClick={() => setLanguage("de")}
            aria-pressed={language === "de"}
            aria-label={t.languageGermanLabel}
          >
            DE
          </button>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={handleToggleTheme}
          aria-label={theme === "dark" ? t.themeLightLabel : t.themeDarkLabel}
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? t.themeLightLabel : t.themeDarkLabel}
        </button>
      </div>

      <div className="layout">
        <HistoryPanel
          history={mappedHistory}
          width={sidebarWidth}
          isResizing={isResizing}
          onResizeStart={handleResizeStart}
          title={t.historyTitle}
          subtitle={t.historySubtitle}
          emptyText={t.historyEmpty}
          locale={locale}
          resultTranslations={t.simulatedResults}
        />
        <div className="content">
          <main className="card">
            <header className="header">
              <p className="eyebrow">{t.appName}</p>
              <h1>{t.title}</h1>
              <p className="subtitle">{t.subtitle}</p>
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
                    {t.recordButton}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={stopRecording}
                    disabled={!isRecording}
                  >
                    {t.stopButton}
                  </button>
                </div>
                <p className="status-line">{statusLabel}</p>
                {!isSupported && (
                  <p className="muted">{t.microphoneUnsupported}</p>
                )}
                {recorderError && <p className="error">{recorderError}</p>}
                {audioUrl && <audio controls src={audioUrl} />}

                <div className="divider">
                  <span>{t.orDivider}</span>
                </div>

                <label className="file-upload">
                  <span>{t.uploadLabel}</span>
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
                      <p className="muted">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ghost"
                      onClick={handleClearSelection}
                    >
                      {t.clearButton}
                    </button>
                  </div>
                )}

                {analysisError && <p className="error">{analysisError}</p>}

                <button
                  type="button"
                  className="primary"
                  onClick={handleAnalyzeRequest}
                  disabled={!selectedFile}
                >
                  {t.analyzeButton}
                </button>
              </div>
            )}

            {stage === "progress" && (
              <div className="stage">
                <p className="progress-label">{t.analyzingLabel}</p>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <p className="muted">{t.progressHint}</p>
              </div>
            )}

            {stage === "result" && (
              <div className="stage">
                <p className="result-label">{t.resultLabel}</p>
                <p className="result-text">{resultText}</p>
                <button type="button" className="ghost" onClick={handleReset}>
                  {t.analyzeAnotherButton}
                </button>
              </div>
            )}

            <footer className="regulatory">
              <div>
                <p className="regulatory-title">{t.regulatoryTitle}</p>
                <p className="muted">{t.regulatoryDescription}</p>
              </div>
              <div className="regulatory-grid">
                {/* <div className="regulatory-item">
                  <span className="regulatory-label">{t.regulatoryCeLabel}</span>
                  <span className="regulatory-value">
                    {t.regulatoryPlaceholder}
                  </span>
                </div> */}
                <div className="regulatory-item">
                  <span className="regulatory-label">{t.regulatoryUdiDiLabel}</span>
                  <span className="regulatory-value">
                    {t.regulatoryPlaceholder}
                  </span>
                </div>
                <div className="regulatory-item">
                  <span className="regulatory-label">{t.regulatoryUdiPiLabel}</span>
                  <span className="regulatory-value">
                    {t.regulatoryPlaceholder}
                  </span>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {showDisclaimer && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>{t.disclaimerTitle}</h2>
            <p className="modal-text">{t.disclaimerBody}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={handleDismissDisclaimer}
              >
                {t.disclaimerSecondary}
              </button>
              <button type="button" className="primary" onClick={handleConfirmAnalyze}>
                {t.disclaimerPrimary}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
