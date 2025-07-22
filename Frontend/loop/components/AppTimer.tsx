import { useTimer } from '~/app/Timer';
import {SafeAreaView, Text, View} from 'react-native';
import React from 'react';
import { Button } from '~/components/ui/button';
import {useSafeAreaInsets} from "react-native-safe-area-context";


export default function AppTimerDisplay() {
    const { elapsed, visible } = useTimer();
    const insets = useSafeAreaInsets();


    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `${h.toString().padStart(2, '0')}:${m
            .toString()
            .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!visible) {
        return (
            null
        );
    }

    return (
        <SafeAreaView style={{flex: 1, paddingTop: insets.top}} className="absolute top-2 rounded-xl bg-transparent p-4 space-y-2">
            <Text className="text-primary text-base font-medium">
                Time in App: {formatTime(elapsed)}
            </Text>
        </SafeAreaView>
    );
}

