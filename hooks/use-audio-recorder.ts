import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';

// Types
export interface VoiceNote {
    id: string;
    name: string;
    uri: string;
    duration: number; // in milliseconds
    createdAt: string;
    size?: number;
}

export interface RecordingState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number; // in milliseconds
}

export interface PlaybackState {
    isPlaying: boolean;
    isPaused: boolean;
    currentPosition: number; // in milliseconds
    duration: number; // in milliseconds
    playbackRate: number;
}

const VOICE_NOTES_KEY = 'voice_notes';
const RECORDINGS_DIR = `${FileSystem.Paths.document.uri}recordings/`;

export function useAudioRecorder() {
    // Recording state
    const [recordingState, setRecordingState] = useState<RecordingState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
    });

    // Playback state
    const [playbackState, setPlaybackState] = useState<PlaybackState>({
        isPlaying: false,
        isPaused: false,
        currentPosition: 0,
        duration: 0,
        playbackRate: 1.0,
    });

    // Voice notes list
    const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const recordingRef = useRef<Audio.Recording | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const currentlyPlayingId = useRef<string | null>(null);

    // Initialize - ensure recordings directory exists & load saved notes
    useEffect(() => {
        async function initialize() {
            try {
                // Ensure recordings directory exists
                const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
                }

                // Load saved voice notes
                await loadVoiceNotes();
            } catch (err) {
                console.error('Initialization error:', err);
                setError('Failed to initialize audio recorder');
            } finally {
                setIsLoading(false);
            }
        }

        initialize();

        // Cleanup on unmount
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    // Request permissions
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                setError('Microphone permission is required to record audio');
                return false;
            }

            // Configure audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            return true;
        } catch (err) {
            console.error('Permission error:', err);
            setError('Failed to request microphone permission');
            return false;
        }
    }, []);

    // Load voice notes from storage
    const loadVoiceNotes = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(VOICE_NOTES_KEY);
            if (stored) {
                const notes: VoiceNote[] = JSON.parse(stored);
                // Verify files still exist
                const validNotes = await Promise.all(
                    notes.map(async (note) => {
                        const fileInfo = await FileSystem.getInfoAsync(note.uri);
                        return fileInfo.exists ? note : null;
                    })
                );
                setVoiceNotes(validNotes.filter((n): n is VoiceNote => n !== null));
            }
        } catch (err) {
            console.error('Load notes error:', err);
            setError('Failed to load voice notes');
        }
    }, []);

    // Save voice notes to storage
    const saveVoiceNotes = useCallback(async (notes: VoiceNote[]) => {
        try {
            await AsyncStorage.setItem(VOICE_NOTES_KEY, JSON.stringify(notes));
            setVoiceNotes(notes);
        } catch (err) {
            console.error('Save notes error:', err);
            setError('Failed to save voice notes');
        }
    }, []);

    // Start recording
    const startRecording = useCallback(async (): Promise<boolean> => {
        try {
            setError(null);

            // Request permissions first
            const hasPermission = await requestPermissions();
            if (!hasPermission) return false;

            // Stop any existing playback
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            // Create and start recording
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            recordingRef.current = recording;

            // Start duration tracking
            setRecordingState({
                isRecording: true,
                isPaused: false,
                duration: 0,
            });

            durationIntervalRef.current = setInterval(async () => {
                if (recordingRef.current) {
                    const status = await recordingRef.current.getStatusAsync();
                    if (status.isRecording) {
                        setRecordingState(prev => ({
                            ...prev,
                            duration: status.durationMillis,
                        }));
                    }
                }
            }, 100);

            return true;
        } catch (err) {
            console.error('Start recording error:', err);
            setError('Failed to start recording');
            return false;
        }
    }, [requestPermissions]);

    // Pause recording
    const pauseRecording = useCallback(async (): Promise<boolean> => {
        try {
            if (!recordingRef.current) return false;

            await recordingRef.current.pauseAsync();
            setRecordingState(prev => ({ ...prev, isPaused: true }));

            return true;
        } catch (err) {
            console.error('Pause recording error:', err);
            setError('Failed to pause recording');
            return false;
        }
    }, []);

    // Resume recording
    const resumeRecording = useCallback(async (): Promise<boolean> => {
        try {
            if (!recordingRef.current) return false;

            await recordingRef.current.startAsync();
            setRecordingState(prev => ({ ...prev, isPaused: false }));

            return true;
        } catch (err) {
            console.error('Resume recording error:', err);
            setError('Failed to resume recording');
            return false;
        }
    }, []);

    // Stop recording and save
    const stopRecording = useCallback(async (noteName?: string): Promise<VoiceNote | null> => {
        try {
            if (!recordingRef.current) return null;

            // Clear duration interval
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            // Stop recording
            await recordingRef.current.stopAndUnloadAsync();

            // Reset audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            // Get recording URI and status
            const uri = recordingRef.current.getURI();
            const status = await recordingRef.current.getStatusAsync();

            if (!uri) {
                setError('Recording failed - no audio file created');
                return null;
            }

            // Generate unique filename and move to recordings directory
            const timestamp = new Date().toISOString();
            const id = `recording_${Date.now()}`;
            const filename = `${id}.m4a`;
            const newUri = `${RECORDINGS_DIR}${filename}`;

            await FileSystem.moveAsync({
                from: uri,
                to: newUri,
            });

            // Get file info for size
            const fileInfo = await FileSystem.getInfoAsync(newUri);

            // Create voice note object
            const voiceNote: VoiceNote = {
                id,
                name: noteName || `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                uri: newUri,
                duration: status.durationMillis || 0,
                createdAt: timestamp,
                size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : undefined,
            };

            // Save to storage
            const updatedNotes = [voiceNote, ...voiceNotes];
            await saveVoiceNotes(updatedNotes);

            // Reset recording state
            recordingRef.current = null;
            setRecordingState({
                isRecording: false,
                isPaused: false,
                duration: 0,
            });

            return voiceNote;
        } catch (err) {
            console.error('Stop recording error:', err);
            setError('Failed to save recording');
            return null;
        }
    }, [voiceNotes, saveVoiceNotes]);

    // Cancel recording without saving
    const cancelRecording = useCallback(async () => {
        try {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            if (recordingRef.current) {
                await recordingRef.current.stopAndUnloadAsync();
                const uri = recordingRef.current.getURI();
                if (uri) {
                    await FileSystem.deleteAsync(uri, { idempotent: true });
                }
                recordingRef.current = null;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            setRecordingState({
                isRecording: false,
                isPaused: false,
                duration: 0,
            });
        } catch (err) {
            console.error('Cancel recording error:', err);
        }
    }, []);

    // Play voice note
    const playVoiceNote = useCallback(async (noteId: string): Promise<boolean> => {
        try {
            setError(null);

            const note = voiceNotes.find(n => n.id === noteId);
            if (!note) {
                setError('Voice note not found');
                return false;
            }

            // Stop any existing playback
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            // Load and play the sound
            const { sound } = await Audio.Sound.createAsync(
                { uri: note.uri },
                { shouldPlay: true, rate: playbackState.playbackRate },
                onPlaybackStatusUpdate
            );

            soundRef.current = sound;
            currentlyPlayingId.current = noteId;

            setPlaybackState(prev => ({
                ...prev,
                isPlaying: true,
                isPaused: false,
                currentPosition: 0,
                duration: note.duration,
            }));

            return true;
        } catch (err) {
            console.error('Play error:', err);
            setError('Failed to play voice note');
            return false;
        }
    }, [voiceNotes, playbackState.playbackRate]);

    // Playback status update handler
    const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        setPlaybackState(prev => ({
            ...prev,
            isPlaying: status.isPlaying,
            currentPosition: status.positionMillis,
            duration: status.durationMillis || prev.duration,
        }));

        // Handle playback finished
        if (status.didJustFinish) {
            setPlaybackState(prev => ({
                ...prev,
                isPlaying: false,
                isPaused: false,
                currentPosition: 0,
            }));
            currentlyPlayingId.current = null;
        }
    }, []);

    // Pause playback
    const pausePlayback = useCallback(async (): Promise<boolean> => {
        try {
            if (!soundRef.current) return false;

            await soundRef.current.pauseAsync();
            setPlaybackState(prev => ({ ...prev, isPlaying: false, isPaused: true }));

            return true;
        } catch (err) {
            console.error('Pause playback error:', err);
            return false;
        }
    }, []);

    // Resume playback
    const resumePlayback = useCallback(async (): Promise<boolean> => {
        try {
            if (!soundRef.current) return false;

            await soundRef.current.playAsync();
            setPlaybackState(prev => ({ ...prev, isPlaying: true, isPaused: false }));

            return true;
        } catch (err) {
            console.error('Resume playback error:', err);
            return false;
        }
    }, []);

    // Stop playback
    const stopPlayback = useCallback(async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            currentlyPlayingId.current = null;
            setPlaybackState({
                isPlaying: false,
                isPaused: false,
                currentPosition: 0,
                duration: 0,
                playbackRate: playbackState.playbackRate,
            });
        } catch (err) {
            console.error('Stop playback error:', err);
        }
    }, [playbackState.playbackRate]);

    // Seek to position
    const seekTo = useCallback(async (positionMillis: number): Promise<boolean> => {
        try {
            if (!soundRef.current) return false;

            await soundRef.current.setPositionAsync(positionMillis);
            setPlaybackState(prev => ({ ...prev, currentPosition: positionMillis }));

            return true;
        } catch (err) {
            console.error('Seek error:', err);
            return false;
        }
    }, []);

    // Set playback rate
    const setPlaybackRate = useCallback(async (rate: number): Promise<boolean> => {
        try {
            if (soundRef.current) {
                await soundRef.current.setRateAsync(rate, true);
            }

            setPlaybackState(prev => ({ ...prev, playbackRate: rate }));
            return true;
        } catch (err) {
            console.error('Set rate error:', err);
            return false;
        }
    }, []);

    // Delete voice note
    const deleteVoiceNote = useCallback(async (noteId: string): Promise<boolean> => {
        try {
            const note = voiceNotes.find(n => n.id === noteId);
            if (!note) return false;

            // Stop playback if this note is playing
            if (currentlyPlayingId.current === noteId) {
                await stopPlayback();
            }

            // Delete file
            await FileSystem.deleteAsync(note.uri, { idempotent: true });

            // Update storage
            const updatedNotes = voiceNotes.filter(n => n.id !== noteId);
            await saveVoiceNotes(updatedNotes);

            return true;
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete voice note');
            return false;
        }
    }, [voiceNotes, saveVoiceNotes, stopPlayback]);

    // Rename voice note
    const renameVoiceNote = useCallback(async (noteId: string, newName: string): Promise<boolean> => {
        try {
            const updatedNotes = voiceNotes.map(note =>
                note.id === noteId ? { ...note, name: newName } : note
            );
            await saveVoiceNotes(updatedNotes);

            return true;
        } catch (err) {
            console.error('Rename error:', err);
            setError('Failed to rename voice note');
            return false;
        }
    }, [voiceNotes, saveVoiceNotes]);

    // Search voice notes
    const searchVoiceNotes = useCallback((query: string): VoiceNote[] => {
        if (!query.trim()) return voiceNotes;

        const lowerQuery = query.toLowerCase();
        return voiceNotes.filter(note =>
            note.name.toLowerCase().includes(lowerQuery)
        );
    }, [voiceNotes]);

    // Format duration for display (ms to MM:SS)
    const formatDuration = useCallback((ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    return {
        // State
        recordingState,
        playbackState,
        voiceNotes,
        isLoading,
        error,
        currentlyPlayingId: currentlyPlayingId.current,

        // Recording actions
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        cancelRecording,

        // Playback actions
        playVoiceNote,
        pausePlayback,
        resumePlayback,
        stopPlayback,
        seekTo,
        setPlaybackRate,

        // Management actions
        deleteVoiceNote,
        renameVoiceNote,
        searchVoiceNotes,
        loadVoiceNotes,

        // Utilities
        formatDuration,
        requestPermissions,
    };
}
