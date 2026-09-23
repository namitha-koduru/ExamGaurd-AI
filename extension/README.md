# SmartExam AI — Chrome Extension (Manifest V3)

This Chrome Extension is a privacy-first behavioral telemetry sensor designed for the **SmartExam AI** online examination system.

## Key Capabilities

1. **Focus & Visibility Tracking**: Detects window blur, tab switching, and OS minimization with millisecond duration tracking.
2. **Clipboard Interception**: Detects copy and paste events. **Zero personal text is stored**; only event metadata (character count, document context) is collected.
3. **Keystroke Dynamics**: Measures typing speed (WPM) and key interval variance without recording raw characters.
4. **Mouse Dynamics**: Computes cursor movement density without logging raw screen coordinates indefinitely.
5. **Idle Detection**: Flags prolonged pauses and inactivity periods.

## Zero Invasive Surveillance Guarantee

- ❌ No webcam access or video recording
- ❌ No microphone access or audio recording
- ❌ No facial recognition or emotion analysis
- ❌ No browsing history inspection
- ❌ No monitoring outside the designated exam domain

## Installation (Developer Mode)

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` directory.
5. The SmartExam AI telemetry extension will now automatically connect with the exam interface!
