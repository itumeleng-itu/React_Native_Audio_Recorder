// Voice note data structure
export interface VoiceNote {
    id: string;
    name: string;
    uri: string;
    duration: number; // in milliseconds
    createdAt: string;
    size?: number;
}

// Recording state
export interface RecordingState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number; // in milliseconds
}

// Playback state
export interface PlaybackState {
    isPlaying: boolean;
    isPaused: boolean;
    currentPosition: number; // in milliseconds
    duration: number; // in milliseconds
    playbackRate: number;
}
