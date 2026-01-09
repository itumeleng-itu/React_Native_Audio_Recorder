import { Audio } from 'expo-av';

// Request microphone permissions
export async function requestMicrophonePermission(): Promise<boolean> {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
}

// Configure audio mode for recording
export async function configureAudioForRecording(): Promise<void> {
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
    });
}

// Reset audio mode after recording
export async function resetAudioMode(): Promise<void> {
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
    });
}

// Create and start a new recording
export async function createRecording(): Promise<Audio.Recording> {
    const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    return recording;
}

// Get recording status (duration, etc.)
export async function getRecordingStatus(recording: Audio.Recording) {
    return await recording.getStatusAsync();
}

// Stop and unload recording
export async function stopRecording(recording: Audio.Recording): Promise<string | null> {
    await recording.stopAndUnloadAsync();
    return recording.getURI();
}

// Pause recording
export async function pauseRecording(recording: Audio.Recording): Promise<void> {
    await recording.pauseAsync();
}

// Resume recording
export async function resumeRecording(recording: Audio.Recording): Promise<void> {
    await recording.startAsync();
}
