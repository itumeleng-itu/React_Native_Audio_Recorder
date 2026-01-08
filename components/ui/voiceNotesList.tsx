import FloatingRecordButton from "@/components/ui/floatingRecordButton";
import SearchBar from "@/components/ui/searchBar";
import VoiceNoteCard from "@/components/ui/voiceNoteCard";
import { VoiceNote } from "@/hooks/use-audio-recorder";
import { FlatList, Text, View } from "react-native";

type Props = {
  notes: VoiceNote[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  currentlyPlayingId: string | null;
  playbackState: {
    isPlaying: boolean;
    isPaused: boolean;
    currentPosition: number;
  };
  onPlayPause: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onRename: (noteId: string, newName: string) => void;
  onRecordPress: () => void;
  formatDuration: (ms: number) => string;
}

export default function VoiceNotesList({
  notes,
  searchQuery,
  onSearchChange,
  currentlyPlayingId,
  playbackState,
  onPlayPause,
  onDelete,
  onRename,
  onRecordPress,
  formatDuration,
}: Props) {
  return (
    <View className="flex-1">
      {/* Search Bar */}
      <SearchBar 
        value={searchQuery} 
        onChangeText={onSearchChange} 
      />

      {/* Section Header */}
      <Text className="text-base font-semibold text-gray-800 mb-3">
        your recent recordings
      </Text>

      {/* Voice Notes List */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <VoiceNoteCard
            note={item}
            isPlaying={currentlyPlayingId === item.id && playbackState.isPlaying}
            isPaused={currentlyPlayingId === item.id && playbackState.isPaused}
            currentPosition={currentlyPlayingId === item.id ? playbackState.currentPosition : 0}
            onPlayPause={() => onPlayPause(item.id)}
            onDelete={() => onDelete(item.id)}
            onRename={(newName) => onRename(item.id, newName)}
            formatDuration={formatDuration}
          />
        )}
        ListEmptyComponent={
          searchQuery ? (
            <View className="items-center py-10">
              <Text className="text-gray-500 text-lg">No results found</Text>
              <Text className="text-gray-400 text-sm">Try a different search term</Text>
            </View>
          ) : null
        }
      />

      {/* Floating Record Button */}
      <FloatingRecordButton onPress={onRecordPress} />
    </View>
  );
}
