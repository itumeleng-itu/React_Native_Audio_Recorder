import React, { useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface SegmentedControlProps {
  segments: string[];   //number of tabs
  selectedIndex?: number; // current tab
  onChange?: (index: number) => void; 
  className?: string;//styling
}

export default function SegmentedControl({
  segments,
  selectedIndex = 0,
  onChange,
  className = '',
}: SegmentedControlProps) {
  const [selected, setSelected] = useState(selectedIndex);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const position = useSharedValue(selectedIndex);

  const handlePress = (index: number) => {
    setSelected(index);
    position.value = withSpring(index, {
      damping: 15,
      stiffness: 200,
    });
    onChange?.(index);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setSegmentWidth(width / segments.length);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: position.value * segmentWidth,
        },
      ],
    };
  });

  return (
    <View
      className={`bg-gray-100 rounded-full px-0.5 py-1 ${className}`}
      onLayout={handleLayout}
    >
      <View className="relative flex-row">
        <Animated.View
          style={[
            animatedStyle,
            {
              width: segmentWidth - 8,
              margin: 4,
            },
          ]}
          className="absolute h-[calc(100%-8px)] rounded-full bg-white shadow-sm"
          pointerEvents="none"
        />

        {/* Segments */}
        {segments.map((segment, index) => {
          const isSelected = selected === index;
          
          return (
            <Pressable
              key={index}
              onPress={() => handlePress(index)}
              className="flex-1 items-center justify-center px-2 py-1"
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                className={`text-[15px] font-semibold ${
                  isSelected ? 'text-blue-500 bg-black/5 rounded-full px-5 py-3' : 'text-gray-800'
                }`}
              >
                {segment}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}