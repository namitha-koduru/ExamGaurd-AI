# SmartExam AI — Local Development Guide

## Prerequisites
- Node.js >= 18
- Python >= 3.10

## Quickstart (Unified Dev Environment)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Unified Development Server (Port 3000)**:
   ```bash
   npm run dev
   ```
   This spins up the integrated Express + Vite server on `http://localhost:3000`.

3. **Install the Chrome Extension**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode**.
   - Click **Load unpacked** and select the `/extension` directory.

4. **Default Demonstration Accounts**:
   - **Student**: `alex.student@smartexam.edu` (Password: `password123`)
   - **Examiner**: `elena.examiner@smartexam.edu` (Password: `password123`)
   - **Admin**: `admin@smartexam.edu` (Password: `password123`)
