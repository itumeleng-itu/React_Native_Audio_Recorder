import EmptyState from "@/components/ui/emptyState";
import RecordModal from "@/components/ui/recordModal";
import VoiceNotesList from "@/components/ui/voiceNotesList";
import { useAudioRecorder, VoiceNote } from "@/hooks/use-audio-recorder";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import SegmentedControl from '../components/ui/tab';

export default function Landing() {
  const [tabIndex, setTabIndex] = useState(0); //recent or history (0 and 1)
  const [modalVisible, setModalVisible] = useState(false); //modal to appear when user clicks "Record note" button
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

  // Get recent notes (last 8 hours)
  const recentNotes = filteredNotes.filter(note => {
    const noteDate = new Date(note.createdAt);
    const dayAgo = new Date();
    dayAgo.setHours(dayAgo.getHours() - 8);
    return noteDate >= dayAgo;
  });

  // Get history (older than 8 hours)
  const historyNotes = filteredNotes.filter(note => {
    const noteDate = new Date(note.createdAt);
    const dayAgo = new Date();
    dayAgo.setHours(dayAgo.getHours() - 8);
    return noteDate < dayAgo;
  });

  const displayedNotes = tabIndex === 0 ? recentNotes : historyNotes;  //this shows recent notes in the recent tabs(recorded less than 8hrs ago): history(recorded more than 8hrs ago)

  function handleOpenModal(): void {
    setModalVisible(true);
  } //pop up modal when user clicks "Record note" button

  function handleCloseModal() {
    setModalVisible(false);
  } //close modal when user clicks "Record note" button

  const handleRecordingSaved = useCallback((voiceNote: VoiceNote) => {
    // Refresh the list
    loadVoiceNotes();
  }, [loadVoiceNotes]); //

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

  return (
    <View className="flex-1 bg-white px-6 pt-12">
      {/* Header with tabs and help button */}
      <View className="flex-row items-center justify-between mt-8">
        <SegmentedControl 
          segments={['Recent', 'History']}
          selectedIndex={tabIndex}
          onChange={(index) => setTabIndex(index)}
          className="w-60"
        />
        <Pressable 
          onPress={() => router.push('/feedback')}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
        >
          <Text className="text-lg">?</Text>
        </Pressable>
      </View>

      {/*conditional rendering, state has a recording and no recording*/}
      <View className="flex-1 mt-8">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Loading...</Text>
          </View>
        ) : displayedNotes.length > 0 || searchQuery ? (
          <VoiceNotesList
            notes={displayedNotes}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            currentlyPlayingId={currentlyPlayingId}
            playbackState={playbackState}
            onPlayPause={handlePlayPause}
            onDelete={handleDelete}
            onRename={handleRename}
            onRecordPress={handleOpenModal}
            formatDuration={formatDuration}
          />
        ) : (
          <EmptyState 
            tabIndex={tabIndex} 
            onRecordPress={handleOpenModal} 
          />
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