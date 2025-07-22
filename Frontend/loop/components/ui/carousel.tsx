// components/Carousel.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
    FlatList,
    View,
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';

const { width } = Dimensions.get('window');

interface CarouselProps {
    data: React.ReactNode[];
    height?: number;
    loop?: boolean;
    minIndicators?: number;
}

export const Carousel: React.FC<CarouselProps> = ({
                                                      data,
                                                      height = 200,
                                                      loop = false,
                                                      minIndicators = 7,
                                                  }) => {
    const [activeIndex, setActiveIndex] = useState(loop ? 1 : 0);
    const listRef = useRef<FlatList>(null);

    const extendedData = loop
        ? [data[data.length - 1], ...data, data[0]]
        : data;

    useEffect(() => {
        if (loop && listRef.current) {
            setTimeout(() => {
                listRef.current?.scrollToIndex({ index: 1, animated: false });
            }, 0);
        }
    }, [loop]);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
    };

    const onMomentumScrollEnd = () => {
        if (!loop || !listRef.current) return;

        if (activeIndex === extendedData.length - 1) {
            listRef.current.scrollToIndex({ index: 1, animated: false });
            setActiveIndex(1);
        }

        if (activeIndex === 0) {
            listRef.current.scrollToIndex({ index: extendedData.length - 2, animated: false });
            setActiveIndex(extendedData.length - 2);
        }
    };

    const renderItem = ({ item }: { item: React.ReactNode }) => (
        <View className="w-screen items-center justify-center" style={{ height }}>
            {item}
        </View>
    );

    const actualDataLength = data.length;
    const paginationCount = loop
        ? Math.max(actualDataLength, minIndicators)
        : actualDataLength;

    const displayIndex = loop
        ? Math.min(Math.max(activeIndex - 1, 0), actualDataLength - 1)
        : activeIndex;

    return (
        <View>
            <FlatList
                ref={listRef}
                data={extendedData}
                renderItem={renderItem}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                onMomentumScrollEnd={onMomentumScrollEnd}
                initialScrollIndex={loop ? 1 : 0}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />

            <View className="flex-row justify-center py-2">
                {Array.from({ length: paginationCount }).map((_, index) => (
                    <View
                        key={index}
                        className={`h-2 w-2 rounded-full mx-1 ${
                            displayIndex === index ? 'bg-white' : 'bg-gray-400'
                        }`}
                    />
                ))}
            </View>
        </View>
    );
};
