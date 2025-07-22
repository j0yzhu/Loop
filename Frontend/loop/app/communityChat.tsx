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
    TouchableWithoutFeedback
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, InfoIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { socket } from '~/lib/socket';
import { Community, CommunityService } from '~/services/CommunityService';
import { UserService } from '~/services/UserService';
import * as SecureStore from 'expo-secure-store';
import { Button } from '~/components/ui/button';
import { useColorScheme } from '~/lib/useColorScheme';
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

interface Message {
    id: string;
    from: string;
    from_name?: string;
    text: string;
}

export default function CommunityChat() {
    return <CommunityMessages />;
}

const CommunityMessages: React.FC = () => {
    const router = useRouter();
    const { community_id } = useLocalSearchParams();
    const [community, setCommunity] = useState<Community>();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [sender, setSender] = useState<string>('');
    const { isDarkColorScheme } = useColorScheme();
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchCommunity = async () => {
            try {
                const communityData = await CommunityService.getCommunityById(Number(community_id));
                setCommunity(communityData);
            } catch (error) {
                console.error("Failed to fetch community:", error);
            }
        };
        fetchCommunity();
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = await SecureStore.getItemAsync("access_token");
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/community/${community_id}/messages`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!Array.isArray(data)) return;
                setMessages(data);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const user = await UserService.getCurrentUser();
                setSender(user.email);
                socket.connect();
                socket.emit('join_room', { room: community_id });
            } catch (error) {
                console.error("Init error:", error);
            }
        };
        init();
        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        socket.on('receive_message', (data: Message) => {
            setMessages(prev => [...prev, data]);
            flatListRef.current?.scrollToEnd({ animated: true });
        });
        return () => socket.off('receive_message');
    }, []);

    const handleSend = () => {
        if (!message.trim() || !sender) return;
        const msg: Message = { id: Date.now().toString(), from: sender, text: message.trim() };
        socket.emit('send_community_message', { ...msg, room: community_id });
        setMessage('');
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    const renderItem = ({ item, index }: { item: Message; index: number }) => {
        const isMe = item.from === sender;
        const isFirst = index === 0 || messages[index - 1].from !== item.from;
        const isLastFromUser =
            index === messages.length - 1 ||
            messages[index + 1].from !== item.from;

        return (
            <View
                style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    marginVertical: 2,
                    marginBottom: isLastFromUser ? 8 : 2,
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
                        {item.from_name || item.from}
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
                        <View style={{ paddingVertical: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                                        <ArrowLeft size={24} color={isDarkColorScheme ? "white" : "black"} />
                                    </TouchableOpacity>
                                    <Avatar alt="User PFP" className="h-12 w-12 bg-zinc-900">
                                        <AvatarImage source={{ uri: community?.community_picture }} />
                                        <AvatarFallback className="bg-foreground">
                                            <Text className="text-background">
                                                {community?.name?.charAt(0)}
                                            </Text>
                                        </AvatarFallback>
                                    </Avatar>
                                    <View style={{ marginLeft: 12 }}>
                                        <Text className="text-foreground" style={{ fontWeight: 'bold', fontSize: 16 }}>{community?.name}</Text>
                                        <Text className="text-muted-foreground" style={{ fontSize: 12 }}>{community?.members} members</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: '/communityInfo', params: { community_id } })}
                                >
                                    <InfoIcon color={isDarkColorScheme ? "white" : "black"} />
                                </TouchableOpacity>
                            </View>

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
};
