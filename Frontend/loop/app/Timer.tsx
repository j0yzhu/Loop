import React, { createContext, useContext, useEffect, useState } from 'react';
import {useSafeAreaInsets} from "react-native-safe-area-context";

const TimerContext = createContext<{
    elapsed: number;
    visible: boolean;
    toggleVisible: () => void;
}>({
    elapsed: 0,
    visible: false,
    toggleVisible: () => {},
});

export const TimerProvider = ({ children }: { children: React.ReactNode }) => {
    const [elapsed, setElapsed] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed((t) => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleVisible = () => setVisible((v) => !v);

    return (
        <TimerContext.Provider value={{ elapsed, visible, toggleVisible }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => useContext(TimerContext);
