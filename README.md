# React Native Audio Recorder

Simple React Native app for recording, saving and playing short voice notes.

## Designs
Figma wireframes and designs:  
https://www.figma.com/design/jFPcLqc4tNRTVIgRVynHcv/Wireframe?node-id=0-1&m=dev&t=uBsvPFRp8muWYJjr-1

## Features
- Tap / hold to record with live waveform animation
- Save recordings with optional name
- Play / pause recordings with progress
- List, rename and delete voice notes

## Setup (Windows)
1. Install dependencies:
   - Node >= 16, Yarn or npm
   - React Native CLI and Android/iOS toolchains
2. From project root:
   - npm install 
3. Run on Android:
   - npx react-native run-android
   Run on iOS:
   - npx pod-install && npx react-native run-ios

## Useful Scripts
- yarn start
- yarn android
- yarn ios
- yarn test

## Project Layout (key files)
- components/ui/recordModal.tsx — recording modal + waveform
- components/ui/WaveformBar.tsx — waveform component
- components/ui/voiceNotesList.tsx — list of notes
- hooks/use-audio-recorder.ts — recording & playback logic

## Troubleshooting
- Playback error "sound is not loaded": ensure the playback implementation awaits sound loading before play. See `use-audio-recorder.ts` for sound load/play sequence.
- If modal waveform doesn't animate during external playback, pass playback state into the modal and start the waveform timer when audio is playing.

## Contributing
Open an issue or submit a PR. Keep changes small and focused.
