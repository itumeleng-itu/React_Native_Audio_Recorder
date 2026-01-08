import { useAudioRecorder, VoiceNote } from '@/hooks/use-audio-recorder';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from 'react-native';

const mic = require('../../assets/images/mic.png');

interface RecordModalProps {
  visible: boolean;
  onClose: () => void;
  onRecordingSaved?: (voiceNote: VoiceNote) => void;
}

type RecordingPhase = 'idle' | 'recording' | 'stopped' | 'saving';

export default function RecordModal({ 
  visible, 
  onClose,
  onRecordingSaved 
}: RecordModalProps) {
  
  const BAR_COUNT = 20;
  const MIN_BAR = 4;
  const MAX_BAR = 24;

  const barsRef = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(MIN_BAR))
  ).current;
  
  const waveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [noteName, setNoteName] = useState('');
  const [recordedDuration, setRecordedDuration] = useState(0);
  
  const {
    recordingState,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
    error,
  } = useAudioRecorder();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setPhase('idle');
      setNoteName('');
      setRecordedDuration(0);
      stopWave();
    }
  }, [visible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, []);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const startWave = () => {
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
    }

    waveIntervalRef.current = setInterval(() => {
      const anims = barsRef.map((v) =>
        Animated.timing(v, {
          toValue: Math.random() * (MAX_BAR - MIN_BAR) + MIN_BAR,
          duration: 140,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      Animated.parallel(anims).start();
    }, 150);
  };

  const stopWave = () => {
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }
    
    const anims = barsRef.map((v) =>
      Animated.timing(v, {
        toValue: MIN_BAR,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      })
    );
    Animated.parallel(anims).start();
  };

  // Handle recording button press
  const handleStartRecording = async () => {
    const success = await startRecording();
    if (success) {
      setPhase('recording');
      startWave();
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    stopWave();
    setRecordedDuration(recordingState.duration);
    setPhase('stopped');
  };

  // Handle save recording
  const handleSaveRecording = async () => {
    setPhase('saving');
    
    const voiceNote = await stopRecording(noteName.trim() || undefined);
    
    if (voiceNote) {
      if (onRecordingSaved) {
        onRecordingSaved(voiceNote);
      }
      handleClose();
    } else {
      setPhase('stopped');
    }
  };

  // Handle cancel/discard recording
  const handleCancelRecording = async () => {
    await cancelRecording();
    handleClose();
  };

  // Handle modal close
  const handleClose = () => {
    setPhase('idle');
    setNoteName('');
    setRecordedDuration(0);
    stopWave();
    onClose();
  };

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (phase === 'idle') {
      handleClose();
    } else if (phase === 'recording') {
      // Don't close while recording
    } else {
      // Show confirmation if recording exists
      Alert.alert(
        'Discard Recording?',
        'Your recording will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: handleCancelRecording },
        ]
      );
    }
  };

  const renderIdleState = () => (
    <>
      <Text className="text-center text-gray-600 text-base mb-8">
        Tap the mic to start recording
      </Text>

      <View className="items-center mb-8">
        <Pressable
          onPress={handleStartRecording}
          className="w-24 h-24 rounded-full items-center justify-center bg-gray-100 active:bg-gray-200"
        >
          <Image source={mic} style={{ width: 60, height: 60 }} resizeMode="contain" />
        </Pressable>
      </View>

      {/* Empty waveform placeholder */}
      <View className="flex-row items-center">
        <View className="flex-row items-end flex-1 h-8">
          {barsRef.map((val, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                { height: val },
                i === BAR_COUNT - 1 && { marginRight: 0 },
              ]}
            />
          ))}
        </View>
        <Text className="text-sm text-gray-400 ml-3 font-mono">00:00</Text>
      </View>
    </>
  );

  const renderRecordingState = () => (
    <>
      <View className="flex-row items-center justify-center mb-4">
        <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
        <Text className="text-center text-red-500 text-base font-semibold">
          Recording...
        </Text>
      </View>

      <View className="items-center mb-8">
        <Pressable
          onPress={handleStopRecording}
          className="w-24 h-24 rounded-full items-center justify-center bg-red-100 active:bg-red-200"
        >
          <View className="w-8 h-8 rounded bg-red-500" />
        </Pressable>
        <Text className="text-xs text-gray-500 mt-2">Tap to stop</Text>
      </View>

      {/* Waveform + Timer */}
      <View className="flex-row items-center">
        <View className="flex-row items-end flex-1 h-8">
          {barsRef.map((val, i) => (
            <Animated.View
              key={i}
              style={[
                styles.barActive,
                { height: val },
                i === BAR_COUNT - 1 && { marginRight: 0 },
              ]}
            />
          ))}
        </View>
        <Text className="text-sm text-red-500 ml-3 font-mono font-bold">
          {formatDuration(recordingState.duration)}
        </Text>
      </View>
    </>
  );

  const renderStoppedState = () => (
    <>
      <Text className="text-center text-gray-700 text-lg font-semibold mb-2">
        Recording Complete
      </Text>
      <Text className="text-center text-gray-500 text-sm mb-6">
        Duration: {formatDuration(recordedDuration)}
      </Text>

      {/* Name Input */}
      <View className="mb-6">
        <Text className="text-sm text-gray-600 mb-2">Name your recording (optional)</Text>
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-gray-50"
          placeholder="Enter a name..."
          placeholderTextColor="#9CA3AF"
          value={noteName}
          onChangeText={setNoteName}
          autoFocus
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={handleCancelRecording}
          className="flex-1 py-3 rounded-xl border border-gray-300 bg-white active:bg-gray-100"
        >
          <Text className="text-center text-gray-700 font-semibold">Discard</Text>
        </Pressable>
        <Pressable
          onPress={handleSaveRecording}
          className="flex-1 py-3 rounded-xl bg-gray-800 active:bg-gray-900"
        >
          <Text className="text-center text-white font-semibold">Save</Text>
        </Pressable>
      </View>
    </>
  );

  const renderSavingState = () => (
    <View className="items-center py-8">
      <ActivityIndicator size="large" color="#374151" />
      <Text className="text-gray-600 mt-4">Saving recording...</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          
          {/* White Card */}
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
              
              {phase === 'idle' && renderIdleState()}
              {phase === 'recording' && renderRecordingState()}
              {phase === 'stopped' && renderStoppedState()}
              {phase === 'saving' && renderSavingState()}
              
            </View>
          </TouchableWithoutFeedback>
          
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: 6,
    marginHorizontal: 2,
    backgroundColor: '#D1D5DB', // gray-300
    borderRadius: 3,
  },
  barActive: {
    width: 6,
    marginHorizontal: 2,
    backgroundColor: '#EF4444', // red-500
    borderRadius: 3,
  },
});