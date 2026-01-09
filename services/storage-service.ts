import { VoiceNote } from '@/types/audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const VOICE_NOTES_KEY = 'voice_notes';
export const RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings/`;

// Initialize recordings directory
export async function initializeStorage(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
    }
}

// Load voice notes from AsyncStorage
export async function loadVoiceNotesFromStorage(): Promise<VoiceNote[]> {
    const stored = await AsyncStorage.getItem(VOICE_NOTES_KEY);
    if (!stored) return [];

    const notes: VoiceNote[] = JSON.parse(stored);

    // Verify files still exist
    const validNotes = await Promise.all(
        notes.map(async (note) => {
            const fileInfo = await FileSystem.getInfoAsync(note.uri);
            return fileInfo.exists ? note : null;
        })
    );

    return validNotes.filter((n): n is VoiceNote => n !== null);
}

// Save voice notes to AsyncStorage
export async function saveVoiceNotesToStorage(notes: VoiceNote[]): Promise<void> {
    await AsyncStorage.setItem(VOICE_NOTES_KEY, JSON.stringify(notes));
}

// Move recording file to permanent storage
export async function moveRecordingToStorage(tempUri: string, filename: string): Promise<string> {
    const newUri = `${RECORDINGS_DIR}${filename}`;
    await FileSystem.moveAsync({
        from: tempUri,
        to: newUri,
    });
    return newUri;
}

// Get file info (size)
export async function getFileSize(uri: string): Promise<number | undefined> {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists && 'size' in fileInfo ? fileInfo.size : undefined;
}

// Delete recording file
export async function deleteRecordingFile(uri: string): Promise<void> {
    await FileSystem.deleteAsync(uri, { idempotent: true });
}
