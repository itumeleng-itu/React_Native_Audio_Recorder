// Format milliseconds to MM:SS display
export function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Generate a unique recording ID
export function generateRecordingId(): string {
    return `recording_${Date.now()}`;
}

// Generate default recording name
export function generateDefaultName(): string {
    return `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
}
