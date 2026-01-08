import { VoiceNote } from '@/hooks/use-audio-recorder';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const bgImage = require('../../assets/images/back.png');

type VoiceNoteCardProps = {
  note: VoiceNote;
  isPlaying: boolean;
  isPaused: boolean;
  currentPosition: number;
  onPlayPause: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  formatDuration: (ms: number) => string;
}

export default function VoiceNoteCard({
  note,
  isPlaying,
  isPaused,
  currentPosition,
  onPlayPause,
  onDelete,
  onRename,
  formatDuration,
}: VoiceNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(note.name);

  // Waveform animation
  const BAR_COUNT = 15;
  const MIN_BAR = 4;
  const MAX_BAR = 20;
  
  const barsRef = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(MIN_BAR))
  ).current;
  
  const waveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // calculate progress percentage
  const progress = note.duration > 0 ? (currentPosition / note.duration) * 100 : 0;

  // Start/stop waveform animation based on playback state
  useEffect(() => {
    if (isPlaying) {
      startWave();
    } else {
      stopWave();
    }
    
    return () => {
      if (waveIntervalRef.current) {
        clearInterval(waveIntervalRef.current);
      }
    };
  }, [isPlaying]);

  function startWave() {
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
  }

  function stopWave() {
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }
    
    // Collapse bars back to minimum
    const anims = barsRef.map((v) =>
      Animated.timing(v, {
        toValue: MIN_BAR,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      })
    );
    Animated.parallel(anims).start();
  }

  function handleSaveRename() {
    if (editedName.trim()) {
      onRename(editedName.trim());
    } else {
      setEditedName(note.name);
    }
    setIsEditing(false);
  }

  function handleLongPress() {
    Alert.alert(
      'Options',
      '',
      [
        {
          text: 'Rename',
          onPress: () => setIsEditing(true),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }

  function handleEditPress() {
    setIsEditing(true);
  }

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={500}
      className="mb-4 rounded-2xl overflow-hidden"
    >
      <ImageBackground 
        source={bgImage} 
        className="w-full"
        style={{ minHeight: 200 }}
        imageStyle={{ borderRadius: 16 }}
      >
        <View className="p-4 flex-1">
          {/* Recording Name */}
          <View className="bg-white/90 rounded-full px-4 py-2 self-start mb-4">
            {isEditing ? (
              <TextInput
                className="text-sm font-semibold text-gray-800"
                value={editedName}
                onChangeText={setEditedName}
                onBlur={handleSaveRename}
                onSubmitEditing={handleSaveRename}
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                {note.name}
              </Text>
            )}
          </View>
          <View className="flex-1" />
          {/* Waveform Animation - shows when playing */}
          {(isPlaying || isPaused) && (
            <View className="flex-row items-center justify-center my-2">
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
          )}

          {/* Spacer */}
          <View className="flex-1" />

          

          {/* Play Button and Edit */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1" />
            
            {/* Play Button */}
            <Pressable
              onPress={onPlayPause}
              className="bg-white rounded-full px-6 py-2 flex-row items-center active:bg-gray-100"
            >
              {isPlaying ? (
                <>
                  <View className="flex-row mr-2">
                    <View className="w-1 h-3 bg-gray-800 rounded mr-0.5" />
                    <View className="w-1 h-3 bg-gray-800 rounded" />
                  </View>
                  <Text className="text-sm font-semibold text-gray-800">Pause</Text>
                </>
              ) : (
                <>
                  <View 
                    className="mr-2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 8,
                      borderTopWidth: 5,
                      borderBottomWidth: 5,
                      borderLeftColor: '#1f2937',
                      borderTopColor: 'transparent',
                      borderBottomColor: 'transparent',
                    }}
                  />
                  <Text className="text-sm font-semibold text-gray-800">Play</Text>
                </>
              )}
            </Pressable>

          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: 4,
    marginHorizontal: 2,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
});
