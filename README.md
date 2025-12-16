# CoughSense Frontend

This repository contains the frontend part of the CoughSense system – a web-based user interface for uploading or recording cough audio samples and displaying analysis results.

The frontend is responsible for:
- providing a simple and accessible user interface,
- recording or uploading audio samples,
- sending audio data to the backend API,
- presenting the analysis results returned by the backend.

### Technology stack
- React
- JavaScript
- Web Audio API
- Docker

### Architectural assumptions
The frontend is implemented as a single-page application (SPA).
It contains no machine learning logic and does not process audio data beyond basic recording and upload functionality.
All analysis is delegated to the backend service.
