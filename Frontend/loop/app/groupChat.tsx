import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Keyboard,
    TouchableWithoutFeedback,
    SafeAreaView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { socket } from '~/lib/socket';
import * as SecureStore from 'expo-secure-store';
import { UserService } from '~/services/UserService';
import { InfoIcon, ArrowLeft } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { useColorScheme } from "~/lib/useColorScheme";


interface GroupMessage {
    id: string;
    from: string;
    text: string;
    timestamp: string;
    username: string;
    avatar: string | null;
}

export default function GroupChat() {
    const { group_id, group_name } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [message, setMessage] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const router = useRouter();
    const { isDarkColorScheme } = useColorScheme();

    useEffect(() => {
        const init = async () => {
            const user = await UserService.getCurrentUser();
            setSenderEmail(user.email);

            const token = await SecureStore.getItemAsync('access_token');
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/group-history/${group_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setMessages(data);
            socket.connect();
            socket.emit('join_room', { room: group_id });
        };

        init();
        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        socket.on('receive_group_message', (msg: GroupMessage) => {
            setMessages(prev => [...prev, msg]);
            flatListRef.current?.scrollToEnd({ animated: true });
        });
        return () => socket.off('receive_group_message');
    }, []);

    const handleSend = () => {
        if (!message.trim()) return;
        socket.emit('send_group_message', {
            group_id,
            from: senderEmail,
            text: message.trim(),
        });
        setMessage('');
    };

    const renderItem = ({ item, index }: { item: GroupMessage; index: number }) => {
        const isMe = item.from === senderEmail;
        const isFirst = index === 0 || messages[index - 1].from !== item.from;

        return (
            <View
                style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    marginTop: isFirst ? 10 : 2,
                    marginBottom: 2,
                    marginLeft: isMe ? 0 : 8,
                    marginRight: isMe ? 8 : 0,
                }}
            >

                {isFirst && (
                    <Text
                        style={{
                            textAlign: isMe ? 'right' : 'left',
                            fontSize: 12,
                            marginBottom: 4,
                            paddingHorizontal: 4,
                        }}
                        className="text-foreground"
                    >
                        {item.username}
                    </Text>
                )}
                <View
                    style={{
                        backgroundColor: isMe ? '#3B82F6' : '#4B5563',
                        borderRadius: 8,
                        padding: 8,
                    }}
                >
                    <Text style={{ color: 'white', fontSize: 14 }}>{item.text}</Text>
                </View>
            </View>
        );
    };


    return (


        <SafeAreaView className="bg-background" style={{ flex: 1, paddingTop: insets.top }}>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        {/* Header */}
                        <View style={{ paddingVertical: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                                        <ArrowLeft size={24} color={isDarkColorScheme ? "white" : "black"} />
                                    </TouchableOpacity>
                                    <Text className="text-foreground" style={{ fontWeight: 'bold', fontSize: 16 }}>{group_name}</Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push({ pathname: '/groupInfo', params: { group_id, group_name } })
                                    }
                                >
                                    <InfoIcon color={isDarkColorScheme ? "white" : "black"} />
                                </TouchableOpacity>
                            </View>

                            {/* Divider */}
                            <View className="bg-foreground" style={{ height: 1, marginTop: 12, marginHorizontal: -12 }} />
                        </View>

                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 12 }}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        />

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
                                className="bg-background border border-foreground"
                            />
                            <Button onPress={handleSend} className="ml-2">
                                <Text className="text-background font-bold">Send</Text>
                            </Button>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
