import { VoiceNote } from '@/hooks/use-audio-recorder';
import { useState } from 'react';
import { Alert, ImageBackground, Pressable, Text, TextInput, View } from 'react-native';

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

  // calculate progress percentage
  const progress = note.duration > 0 ? (currentPosition / note.duration) * 100 : 0;

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
        style={{ minHeight: 180 }}
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

          {/* Spacer */}
          <View className="flex-1" />

          {/* Progress Bar with Timestamps */}
          <View className="mb-4">
            {/* Timestamps */}
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-white font-mono">
                {isPlaying || isPaused ? formatDuration(currentPosition) : '00:00'}
              </Text>
              <Text className="text-xs text-white font-mono">
                {formatDuration(note.duration)}
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="h-1 bg-white/40 rounded-full overflow-hidden">
              <View 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>

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

            <View className="flex-1 items-end">
              {/* Edit Recording */}
              <Pressable onPress={handleEditPress}>
                <Text className="text-xs text-white underline">Edit Recording</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}
