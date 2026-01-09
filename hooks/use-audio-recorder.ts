import { Audio, AVPlaybackStatus } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

// Types
import { PlaybackState, RecordingState, VoiceNote } from '@/types/audio';

// Services
import * as PlaybackService from '@/services/playback-service';
import * as RecordingService from '@/services/recording-service';
import * as StorageService from '@/services/storage-service';

// Utils
import { formatDuration, generateDefaultName, generateRecordingId } from '@/utils/audio-utils';

// Re-export types for convenience
export { PlaybackState, RecordingState, VoiceNote };

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

    // Initialize storage and load notes
    useEffect(() => {
        async function initialize() {
            try {
                await StorageService.initializeStorage();
                const notes = await StorageService.loadVoiceNotesFromStorage();
                setVoiceNotes(notes);
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
            if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
            if (soundRef.current) soundRef.current.unloadAsync();
        };
    }, []);

    // Load voice notes from storage
    const loadVoiceNotes = useCallback(async () => {
        try {
            const notes = await StorageService.loadVoiceNotesFromStorage();
            setVoiceNotes(notes);
        } catch (err) {
            console.error('Load notes error:', err);
            setError('Failed to load voice notes');
        }
    }, []);

    // Save voice notes to storage
    const saveVoiceNotes = useCallback(async (notes: VoiceNote[]) => {
        try {
            await StorageService.saveVoiceNotesToStorage(notes);
            setVoiceNotes(notes);
        } catch (err) {
            console.error('Save notes error:', err);
            setError('Failed to save voice notes');
        }
    }, []);

    // Request permissions
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        try {
            const granted = await RecordingService.requestMicrophonePermission();
            if (!granted) {
                setError('Microphone permission is required to record audio');
                return false;
            }
            await RecordingService.configureAudioForRecording();
            return true;
        } catch (err) {
            console.error('Permission error:', err);
            setError('Failed to request microphone permission');
            return false;
        }
    }, []);

    // Start recording
    const startRecording = useCallback(async (): Promise<boolean> => {
        try {
            setError(null);

            const hasPermission = await requestPermissions();
            if (!hasPermission) return false;

            // Stop any existing playback
            if (soundRef.current) {
                await PlaybackService.stopSound(soundRef.current);
                soundRef.current = null;
            }

            // Create and start recording
            const recording = await RecordingService.createRecording();
            recordingRef.current = recording;

            // Update state and start duration tracking
            setRecordingState({ isRecording: true, isPaused: false, duration: 0 });

            durationIntervalRef.current = setInterval(async () => {
                if (recordingRef.current) {
                    const status = await RecordingService.getRecordingStatus(recordingRef.current);
                    if (status.isRecording) {
                        setRecordingState(prev => ({ ...prev, duration: status.durationMillis }));
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
            await RecordingService.pauseRecording(recordingRef.current);
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
            await RecordingService.resumeRecording(recordingRef.current);
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

            // Get duration before stopping
            const status = await RecordingService.getRecordingStatus(recordingRef.current);
            const recordedDuration = status.durationMillis || recordingState.duration || 0;

            // Stop recording
            const uri = await RecordingService.stopRecording(recordingRef.current);
            await RecordingService.resetAudioMode();

            if (!uri) {
                setError('Recording failed - no audio file created');
                return null;
            }

            // Generate ID and move to storage
            const id = generateRecordingId();
            const filename = `${id}.m4a`;
            const newUri = await StorageService.moveRecordingToStorage(uri, filename);
            const size = await StorageService.getFileSize(newUri);

            // Create voice note
            const voiceNote: VoiceNote = {
                id,
                name: noteName || generateDefaultName(),
                uri: newUri,
                duration: recordedDuration,
                createdAt: new Date().toISOString(),
                size,
            };

            // Save to storage
            await saveVoiceNotes([voiceNote, ...voiceNotes]);

            // Reset state
            recordingRef.current = null;
            setRecordingState({ isRecording: false, isPaused: false, duration: 0 });

            return voiceNote;
        } catch (err) {
            console.error('Stop recording error:', err);
            setError('Failed to save recording');
            return null;
        }
    }, [voiceNotes, saveVoiceNotes, recordingState.duration]);

    // Cancel recording without saving
    const cancelRecording = useCallback(async () => {
        try {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            if (recordingRef.current) {
                const uri = await RecordingService.stopRecording(recordingRef.current);
                if (uri) await StorageService.deleteRecordingFile(uri);
                recordingRef.current = null;
            }

            await RecordingService.resetAudioMode();
            setRecordingState({ isRecording: false, isPaused: false, duration: 0 });
        } catch (err) {
            console.error('Cancel recording error:', err);
        }
    }, []);

    // Playback status update handler
    const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        setPlaybackState(prev => ({
            ...prev,
            isPlaying: status.isPlaying,
            currentPosition: status.positionMillis,
            duration: status.durationMillis || prev.duration,
        }));

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
                await PlaybackService.stopSound(soundRef.current);
                soundRef.current = null;
            }

            // Load and play sound
            const sound = await PlaybackService.loadSound(
                note.uri,
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
    }, [voiceNotes, playbackState.playbackRate, onPlaybackStatusUpdate]);

    // Pause playback
    const pausePlayback = useCallback(async (): Promise<boolean> => {
        try {
            if (!soundRef.current) return false;
            await PlaybackService.pauseSound(soundRef.current);
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
            await PlaybackService.playSound(soundRef.current);
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
                await PlaybackService.stopSound(soundRef.current);
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
            await PlaybackService.seekTo(soundRef.current, positionMillis);
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
                await PlaybackService.setPlaybackRate(soundRef.current, rate);
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

            if (currentlyPlayingId.current === noteId) {
                await stopPlayback();
            }

            await StorageService.deleteRecordingFile(note.uri);
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
        return voiceNotes.filter(note => note.name.toLowerCase().includes(lowerQuery));
    }, [voiceNotes]);

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
