import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Keyboard,
    TouchableWithoutFeedback,
    Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { socket } from '~/lib/socket';
import { UserService } from '~/services/UserService';
import * as SecureStore from 'expo-secure-store';
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from '~/components/ui/button';
import { useColorScheme } from "~/lib/useColorScheme";

// Types
interface Message {
    id: string;
    from: string;
    text: string;
}

export default function Chat() {
    const router = useRouter();
    const { user } = useLocalSearchParams(); // recipient email
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [sender, setSender] = useState<string>('');
    const [recipientUsername, setRecipientUsername] = useState<string>('');
    const [recipientPfp, setRecipientPfp] = useState<string>('');
    const { isDarkColorScheme } = useColorScheme();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = await SecureStore.getItemAsync("access_token");
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/history/${user}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                if (!Array.isArray(data)) {
                    console.error("Expected array, got:", data);
                    return;
                }
                setMessages(data);
                flatListRef.current?.scrollToEnd({ animated: true });
            } catch (err) {
                console.error("Failed to load message history", err);
            }
        };

        const init = async () => {
            try {
                const userProfile = await UserService.getCurrentUser();
                if (!userProfile.email) {
                    console.warn("Email missing in user profile");
                    return;
                }
                setSender(userProfile.email);
                await fetchHistory();
                socket.connect();
                const room = getRoomId(userProfile.email, user as string);
                socket.emit('join_room', { room });

                const token = await SecureStore.getItemAsync("access_token");
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/email/${user}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setRecipientUsername(data.username);
                setRecipientPfp(data.profile_picture);
            } catch (err) {
                console.error("Failed to initialize chat:", err);
            }
        };

        init();

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        socket.on('receive_message', (data: Message) => {
            setMessages(prev => Array.isArray(prev) ? [...prev, data] : [data]);
            flatListRef.current?.scrollToEnd({ animated: true });
        });
        return () => {
            socket.off('receive_message');
        };
    }, []);

    const getRoomId = (user1: string, user2: string) => [user1.toLowerCase(), user2.toLowerCase()].sort().join('_');

    const handleSend = () => {
        if (!message.trim() || !sender) return;
        const msg: Message = { id: Date.now().toString(), from: sender, text: message.trim() };
        const room = getRoomId(sender, user as string);
        socket.emit('send_message', { ...msg, room });
        setMessage('');
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    return (
        <SafeAreaView className="bg-background" style={{ flex: 1 }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                                <ArrowLeft size={24} color={isDarkColorScheme ? "white" : "black"} />
                            </TouchableOpacity>
                            <Avatar alt="User PFP" className="h-12 w-12">
                                <AvatarImage source={{ uri: recipientPfp }} />
                                <AvatarFallback className="bg-foreground">
                                    <Text className="text-background">{recipientUsername.charAt(0)}</Text>
                                </AvatarFallback>
                            </Avatar>
                            <View style={{ marginLeft: 12 }}>
                                <Text className="text-foreground" style={{  fontWeight: 'bold', fontSize: 16 }}>{recipientUsername}</Text>
                                <Text className="text-foreground" style={{fontSize: 12 }}>{user}</Text>
                            </View>
                        </View>

                        

                        {/* Chat messages and input in column */}
                        <View style={{ flex: 1 }}>
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <View
                                        style={{
                                            alignSelf: item.from === sender ? 'flex-end' : 'flex-start',
                                            backgroundColor: item.from === sender ? '#3B82F6' : '#4B5563',
                                            padding: 12,
                                            borderRadius: 10,
                                            marginVertical: 4,
                                            maxWidth: '80%',
                                        }}
                                    >
                                        <Text style={{ color: 'white' }}>{item.text}</Text>
                                    </View>
                                )}
                                contentContainerStyle={{ paddingBottom: 16 }}
                                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            />

                            {/* Input row now part of layout, not absolute */}
                            <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
                                <TextInput
                                    value={message}
                                    onChangeText={setMessage}
                                    placeholder="Message..."
                                    placeholderTextColor="grey"
                                    style={{
                                        flex: 1,
                                        color: isDarkColorScheme ? "white" : "black",
                                        borderRadius: 10,
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                    }}
                                    className = "bg-background border border-foreground"
                                />
                                <Button onPress={handleSend} className="ml-2 bg-primary">
                                    <Text className="text-background font-bold">Send</Text>
                                </Button>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
