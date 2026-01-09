import { Audio, AVPlaybackStatus } from 'expo-av';

// Load and create a sound from URI
export async function loadSound(
    uri: string,
    initialStatus: { shouldPlay?: boolean; rate?: number } = {},
    onStatusUpdate?: (status: AVPlaybackStatus) => void
): Promise<Audio.Sound> {
    const { sound } = await Audio.Sound.createAsync(
        { uri },
        initialStatus,
        onStatusUpdate
    );
    return sound;
}

// Check if sound is loaded
export async function isSoundLoaded(sound: Audio.Sound): Promise<boolean> {
    const status = await sound.getStatusAsync();
    return status.isLoaded;
}

// Play sound
export async function playSound(sound: Audio.Sound): Promise<void> {
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
        await sound.playAsync();
    }
}

// Pause sound
export async function pauseSound(sound: Audio.Sound): Promise<void> {
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
        await sound.pauseAsync();
    }
}

// Stop and unload sound
export async function stopSound(sound: Audio.Sound): Promise<void> {
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
        await sound.stopAsync();
        await sound.unloadAsync();
    }
}

// Seek to position
export async function seekTo(sound: Audio.Sound, positionMillis: number): Promise<void> {
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
        await sound.setPositionAsync(positionMillis);
    }
}

// Set playback rate
export async function setPlaybackRate(sound: Audio.Sound, rate: number): Promise<void> {
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
        await sound.setRateAsync(rate, true);
    }
}
