# CoughSense Frontend

## Short Description
This project is a single-page frontend application for cough or breath audio analysis.  
The user can record audio with a microphone or upload an audio file.  
The app sends the selected file to an API endpoint and shows the returned result.  
It also keeps a short local history of recent analyses and supports multiple languages and themes.

## Technologies Used
- React 18
- Vite 5
- JavaScript
- CSS 
- Browser APIs:
  - MediaRecorder and `getUserMedia` (audio recording)
  - Fetch API and FormData (API requests)
  - `localStorage` and `sessionStorage` (UI preferences and history)

## Project Structure
```text
.
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   │   ├── FilePicker.jsx
│   │   ├── HistoryPanel.jsx
│   │   ├── RecorderPanel.jsx
│   │   └── ResultPanel.jsx
│   ├── hooks/
│   │   ├── useAnalysisHistory.js
│   │   └── useAudioRecorder.js
│   ├── i18n/
│   │   └── translations.js
│   ├── services/
│   │   └── api.js
│   └── styles/
│       ├── app.css
│       └── index.css
└── tests/
    ├── assets/
    ├── pages/
    ├── conftest.py
    ├── requirements.txt
    └── test_gui.py
```

## Main Frontend Features
- Record cough or breath audio in the browser
- Upload local audio files (`accept="audio/*"`)
- Analyze flow with:
  - confirmation modal before request
  - progress stage while waiting for API response
  - result stage with returned label text
- Analysis history panel:
  - stores up to 10 latest results in session storage
  - toggle open/close
  - resize panel width with pointer drag
- Language switcher: English, Polish, Spanish, German
- Theme toggle: light/dark mode
- File summary with name and size
- Localized regulatory placeholder section in the UI

## API Communication
- API request logic is in `src/services/api.js`.
- The app sends a `POST` request with `multipart/form-data` to:
  - `<VITE_API_BASE_URL>/analyze`
- The uploaded field name is `file`.
- Non-2xx responses are converted to readable error messages and shown in the UI.
- Base URL is read in `src/App.jsx`:
  - `import.meta.env.VITE_API_BASE_URL`
  - fallback: `http://127.0.0.1:8000/api`

## State Management
This project uses local React state and custom hooks.  
There is no external state library (for example Redux).

- `App.jsx` keeps main UI state (stage, selected file, progress, errors, language, theme, sidebar state).
- `useAudioRecorder` handles microphone recording lifecycle and blob/url state.
- `useAnalysisHistory` handles analysis history state and persistence.
- Persistence:
  - `localStorage`: language and theme
  - `sessionStorage`: analysis history

## Environment Variables
No `.env` file is committed in this repository, but one frontend variable is used:

- `VITE_API_BASE_URL`
  - Purpose: backend API base URL
  - Used in: `src/App.jsx`
  - Example value: `http://127.0.0.1:8000/api`
  - If missing, the app uses the fallback above