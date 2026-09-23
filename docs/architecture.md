# SmartExam AI — System Architecture

## Overview

SmartExam AI is designed as a distributed, privacy-preserving behavioral monitoring and examination platform.

```
                    SMARTEXAM AI
                         |
          +--------------+--------------+
          |                             |
       STUDENT                       EXAMINER
          |                             |
          v                             v
   React Exam UI                Proctor Dashboard
          |                             ^
          v                             |
 Chrome Extension (MV3)                 | SSE / WebSocket
          |                             | Live Telemetry Feed
          | Aggregated Event Stream     |
          v                             |
    FastAPI / Express Backend ----------+
          |
     +----+-----+----------------+
     |          |                |
     v          v                v
 Database    ML Engine      Risk Engine
 (Postgres/  (Isolation     (Explainable
  SQLite)     Forest)        Attribution)
```

## Core Subsystems

### 1. Student Examination Client (React + TypeScript)
- Server-authoritative timer preventing client-side clock tampering
- Real-time auto-saving of answers
- Network reconnection handling and offline tolerance
- Non-invasive telemetry sensor hooks (focus changes, navigation, clipboard alerts)

### 2. Chrome Extension (Manifest V3)
- Sandboxed content script attaching strictly to authorized examination URLs
- Periodic buffering and transmission of interaction telemetry
- Real-time detection of tab switching, minimization, and window blurs

### 3. Anomaly Detection & Scoring Pipeline
- **Raw Telemetry Ingestion**: Receives event bursts without storing private text
- **Feature Extraction Engine**: Computes 14 behavioral biometric indicators
- **Isolation Forest Classifier**: Ensemble evaluation of multivariate biometric deviations
- **Explainable Risk Scoring Engine**: Calculates normalized risk (0-100) and itemized contributing factors
- **Live Proctor Broadcast**: Real-time push of alerts to authorized proctors
