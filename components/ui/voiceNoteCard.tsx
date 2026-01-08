import { VoiceNote } from '@/hooks/use-audio-recorder';
import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

interface VoiceNoteCardProps {
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

  const formattedDate = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(note.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const progress = note.duration > 0 ? (currentPosition / note.duration) * 100 : 0;

  const handleSaveRename = () => {
    if (editedName.trim()) {
      onRename(editedName.trim());
    } else {
      setEditedName(note.name);
    }
    setIsEditing(false);
  };

  const handleLongPress = () => {
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
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={500}
      className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-200 active:bg-gray-100"
    >
      <View className="flex-row items-center">
        {/* Play/Pause Button */}
        <Pressable
          onPress={onPlayPause}
          className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center mr-4 active:bg-gray-700"
        >
          {isPlaying ? (
            // Pause icon
            <View className="flex-row">
              <View className="w-1 h-4 bg-white rounded mr-1" />
              <View className="w-1 h-4 bg-white rounded" />
            </View>
          ) : (
            // Play icon
            <View 
              className="w-0 h-0 ml-1"
              style={{
                borderLeftWidth: 10,
                borderTopWidth: 6,
                borderBottomWidth: 6,
                borderLeftColor: 'white',
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
              }}
            />
          )}
        </Pressable>

        {/* Note Info */}
        <View className="flex-1">
          {isEditing ? (
            <TextInput
              className="text-base font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg px-2 py-1 -my-1"
              value={editedName}
              onChangeText={setEditedName}
              onBlur={handleSaveRename}
              onSubmitEditing={handleSaveRename}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
              {note.name}
            </Text>
          )}
          
          <View className="flex-row items-center mt-1">
            <Text className="text-xs text-gray-500">{formattedDate}</Text>
            <Text className="text-xs text-gray-400 mx-1">•</Text>
            <Text className="text-xs text-gray-500">{formattedTime}</Text>
          </View>
        </View>

        {/* Duration */}
        <View className="items-end">
          <Text className="text-sm font-mono text-gray-600">
            {isPlaying || isPaused 
              ? `${formatDuration(currentPosition)} / ${formatDuration(note.duration)}`
              : formatDuration(note.duration)
            }
          </Text>
          {(isPlaying || isPaused) && (
            <Text className="text-xs text-gray-400 mt-1">
              {isPaused ? 'Paused' : 'Playing'}
            </Text>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      {(isPlaying || isPaused) && (
        <View className="mt-3">
          <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className="h-full bg-gray-800 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>
      )}
    </Pressable>
  );
}
