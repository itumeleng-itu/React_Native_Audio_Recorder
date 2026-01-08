import Button from "@/components/ui/button";
import StackedCards from "@/components/ui/emptyStateCards";
import RecordModal from "@/components/ui/recordModal";
import VoiceNoteCard from "@/components/ui/voiceNoteCard";
import { useAudioRecorder, VoiceNote } from "@/hooks/use-audio-recorder";
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import SegmentedControl from '../components/ui/tab';

export default function Landing() {
  const [tabIndex, setTabIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    voiceNotes,
    isLoading,
    playVoiceNote,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    playbackState,
    currentlyPlayingId,
    deleteVoiceNote,
    renameVoiceNote,
    searchVoiceNotes,
    formatDuration,
    loadVoiceNotes,
  } = useAudioRecorder();

  // Get filtered notes based on search
  const filteredNotes = searchQuery ? searchVoiceNotes(searchQuery) : voiceNotes;

  // Get recent notes (last 7 days)
  const recentNotes = filteredNotes.filter(note => {
    const noteDate = new Date(note.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return noteDate >= weekAgo;
  });

  // Get history (older than 7 days)
  const historyNotes = filteredNotes.filter(note => {
    const noteDate = new Date(note.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return noteDate < weekAgo;
  });

  const displayedNotes = tabIndex === 0 ? recentNotes : historyNotes;

  function handleOpenModal(): void {
    setModalVisible(true);
  }

  function handleCloseModal() {
    setModalVisible(false);
  }

  const handleRecordingSaved = useCallback((voiceNote: VoiceNote) => {
    // Refresh the list
    loadVoiceNotes();
  }, [loadVoiceNotes]);

  const handlePlayPause = useCallback(async (noteId: string) => {
    if (currentlyPlayingId === noteId) {
      if (playbackState.isPlaying) {
        await pausePlayback();
      } else if (playbackState.isPaused) {
        await resumePlayback();
      } else {
        await playVoiceNote(noteId);
      }
    } else {
      await stopPlayback();
      await playVoiceNote(noteId);
    }
  }, [currentlyPlayingId, playbackState, pausePlayback, resumePlayback, playVoiceNote, stopPlayback]);

  const handleDelete = useCallback(async (noteId: string) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVoiceNote(noteId);
          },
        },
      ]
    );
  }, [deleteVoiceNote]);

  const handleRename = useCallback(async (noteId: string, newName: string) => {
    await renameVoiceNote(noteId, newName);
  }, [renameVoiceNote]);

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center">
      <View className="mb-20">
        <StackedCards size={400}/>
      </View>
      <Text className="text-3xl font-bold text-gray-700">
        {tabIndex === 0 ? "No recent notes?" : "No history yet"}
      </Text>
      <Text className="text-3xl font-bold text-gray-700">
        {tabIndex === 0 ? "Start recording." : ""}
      </Text>
      
      {tabIndex === 0 && (
        <View className="mb-10 mt-10">
          <Button 
            title="Record note" 
            variant="primary" 
            onPress={handleOpenModal}
          />
        </View>
      )}
    </View>
  );

  const renderVoiceNotesList = () => (
    <View className="flex-1">
      {/* Search Bar */}
      <View className="mb-4">
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base"
          placeholder="Search by name..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Voice Notes List */}
      <FlatList
        data={displayedNotes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <VoiceNoteCard
            note={item}
            isPlaying={currentlyPlayingId === item.id && playbackState.isPlaying}
            isPaused={currentlyPlayingId === item.id && playbackState.isPaused}
            currentPosition={currentlyPlayingId === item.id ? playbackState.currentPosition : 0}
            onPlayPause={() => handlePlayPause(item.id)}
            onDelete={() => handleDelete(item.id)}
            onRename={(newName) => handleRename(item.id, newName)}
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
      <View className="absolute bottom-6 right-0 left-0 items-center">
        <Pressable
          onPress={handleOpenModal}
          className="bg-gray-800 w-16 h-16 rounded-full items-center justify-center shadow-lg active:bg-gray-900"
        >
          <View className="w-4 h-4 rounded-full bg-red-500" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white px-6 pt-12">
      <SegmentedControl 
        segments={['Recent', 'History']}
        selectedIndex={tabIndex}
        onChange={(index) => setTabIndex(index)}
        className="w-60 mt-8"
      />

      <View className="flex-1 mt-8">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Loading...</Text>
          </View>
        ) : displayedNotes.length > 0 || searchQuery ? (
          renderVoiceNotesList()
        ) : (
          renderEmptyState()
        )}
      </View>

      <RecordModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onRecordingSaved={handleRecordingSaved}
      />
    </View>
  );
}