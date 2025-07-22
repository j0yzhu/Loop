import {View, Text, FlatList, ListRenderItem, SafeAreaView} from 'react-native';
import { useRouter } from 'expo-router';
import { PlusIcon, SendIcon, UsersIcon } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { UserService, User } from '~/services/UserService';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { LoopLogo } from "~/components/loop-logo";
import { Button } from "~/components/ui/button";
import { P } from "~/components/ui/typography";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Community, CommunityService } from '~/services/CommunityService';
import { useColorScheme } from "~/lib/useColorScheme";
import {Separator} from "~/components/ui/separator";

interface LastMessage {
    message: string;
    timestamp: string;
}

interface ConversationItem {
    conversation_id: string;
    is_group?: boolean;
    group_id?: number;
    group_name?: string;
    last_message: LastMessage;
    sender_id: string;
    sender_pfp?: string;
    recipient_id: string;
    recipient_pfp?: string;
    delivered: boolean;
    other_user_username: string;
    other_user_email: string;
    unread_count: number;
    from_me: boolean;
    recipient_seen: boolean;
}

const formatTimeAgo = (timestamp: string): string => {
    const messageDate = new Date(timestamp);
    const now = new Date();

    const diffMs = now.getTime() - messageDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

export default function Message() {
    const router = useRouter();
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [email, setEmail] = useState<string>('');
    const [activeTab, setActiveTab] = useState('communities');
    const insets = useSafeAreaInsets();
    const { isDarkColorScheme } = useColorScheme();

    useFocusEffect(
        useCallback(() => {
            const fetchAll = async () => {
                try {
                    const user: User = await UserService.getCurrentUser();
                    if (user.email) {
                        setEmail(user.email);
                        const token = await SecureStore.getItemAsync("access_token");
                        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/conversations`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await res.json();
                        data.sort((a: ConversationItem, b: ConversationItem) =>
                            new Date(b.last_message.timestamp).getTime() - new Date(a.last_message.timestamp).getTime()
                        );
                        setConversations(data);

                    }
                } catch (err) {
                    console.error("Could not refresh messages tab", err);
                }
            };

            fetchAll();
        }, [])
    );

    const renderItem = ({ item }: { item: ConversationItem }) => {
        const otherUser = item.sender_id === email ? item.recipient_id : item.sender_id;
        const otherUserPfp = item.sender_id === email ? item.recipient_pfp : item.sender_pfp;
        const name = item.is_group ? item.group_name : item.other_user_username;
        const subtitle = item.last_message.message;


        return (
            <Button
                variant="ghost"
                size="xl"
                className="flex-row items-center mb-4 justify-between px-4"
                onPress={() => {
                    if (item.is_group) {
                        router.push({ pathname: '/groupChat', params: { group_id: item.group_id, group_name: item.group_name } });
                    } else {
                        router.push({ pathname: '/chat', params: { user: otherUser } });
                    }
                }}
                style={{ width: '100%' }}
            >
                <View className="flex flex-row items-center gap-2">
                    <Avatar alt="User PFP" className="h-12 w-12 bg-zinc-900">
                        <AvatarImage source={{ uri: otherUserPfp }} />
                        <AvatarFallback className="bg-foreground">
                            <Text className="text-background">
                                {(item.is_group ? item.group_name : item.other_user_username)?.charAt(0)}
                            </Text>
                        </AvatarFallback>

                    </Avatar>
                    <View>
                        <Text className="text-foreground font-bold text-base">
                            {item.is_group ? item.group_name : item.other_user_username}
                        </Text>
                        <View className="flex-row flex-wrap items-center">
                            {item.is_group ? (
                                <>
                                    <Text className="text-foreground text-xs">
                                        {item.last_message.message}
                                    </Text>
                                    <Text className="text-foreground text-xs"> | {formatTimeAgo(item.last_message.timestamp)}</Text>
                                </>
                            ) : item.unread_count > 0 && !item.from_me ? (
                                <Text className="text-foreground text-xs font-bold">
                                    {item.unread_count} new message{item.unread_count > 1 ? 's' : ''}
                                </Text>
                            ) : item.from_me && !item.recipient_seen ? (
                                <Text className="text-foreground text-xs">
                                    Sent {formatTimeAgo(item.last_message.timestamp)}
                                </Text>
                            ) : item.from_me && item.recipient_seen ? (
                                <Text className="text-foreground text-xs">
                                    Seen {formatTimeAgo(item.last_message.timestamp)}
                                </Text>
                            ) : (
                                <>
                                    <Text className="text-foreground text-xs">
                                        {item.last_message.message}
                                    </Text>
                                    <Text className="text-foreground text-xs"> | {formatTimeAgo(item.last_message.timestamp)}</Text>
                                </>
                            )}

                        </View>

                    </View>
                </View>
                {item.is_group ? (
                    <UsersIcon color={isDarkColorScheme ? "white" : "black"} />
                ) : (
                    <SendIcon color={isDarkColorScheme ? "white" : "black"} />
                )}
            </Button>
        );
    };

    if (!email) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <Text className="text-foreground text-lg">Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
            <View className="flex-1 bg-background">
                <View className="relative items-center justify-center mx-auto">
                    <LoopLogo className="h-28 w-28" />
                    <Text className="absolute top-20 text-sm text-foreground">Learners On Open Pathways</Text>
                </View>

                <View className="flex-1 m-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-[400px] mx-auto flex-col gap-1.5">
                        <View className="border border-primary rounded-md mb-4">
                            <TabsList className="flex-row w-full">
                            <TabsTrigger
                                value="communities"
                                className={`flex-1 px-3 py-2 rounded ${activeTab === 'communities' ? 'bg-primary' : ''}`}
                            >
                                <Text className={activeTab === 'communities' ? 'text-background' : 'text-foreground'}>
                                    Communities
                                </Text>
                            </TabsTrigger>
                            <TabsTrigger
                                value="dms"
                                className={`flex-1 px-3 py-2 rounded ${activeTab === 'dms' ? 'bg-primary' : ''}`}
                            >
                                <Text className={activeTab === 'dms' ? 'text-background' : 'text-foreground'}>
                                    Direct Messages
                                </Text>
                            </TabsTrigger>
                            </TabsList>
                        </View>

                        <TabsContent value="dms">
                            <FlatList<ConversationItem>
                                data={conversations}
                                keyExtractor={(item) => item.conversation_id}
                                renderItem={renderItem}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                style={{ height: 480 }}
                            />

                            <Button
                                onPress={() => router.push('/newChat')}
                                className="mb-2 mt-2 mx-6 flex flex-row gap-2">
                                <PlusIcon color={isDarkColorScheme ? "black" : "white"} />
                                <P className="text-background">New Chat</P>
                            </Button>
                        </TabsContent>

                        <TabsContent value="communities">
                            <CommunityChat style={{ height: 480 }} />
                            <Button
                                onPress={() => router.push('/communities')}
                                className="mb-2 mt-2 mx-6 flex flex-row gap-2">
                                <PlusIcon color={isDarkColorScheme ? "black" : "white"} />
                                <P className="text-background">Join a Community</P>
                            </Button>
                        </TabsContent>

                    </Tabs>
                </View>
                
            </View>
        </SafeAreaView>
    );
}

export function CommunityChat({ style }: { style?: any }) {
    const router = useRouter();
    const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
    const {isDarkColorScheme} = useColorScheme();

    const fetchJoinedCommunities = async () => {
        try {
            const communities = await CommunityService.getJoinedCommunities();
            setJoinedCommunities(communities);
        } catch (error) {
            console.error("Failed to fetch joined communities", error);
        }
    };

    useEffect(() => {
        fetchJoinedCommunities();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchJoinedCommunities();
        }, [])
    )


    const renderItem: ListRenderItem<Community> = ({ item: community }) => (
        <View>
        <Button
            variant="ghost"
            size="xl"
            className="flex-row items-center justify-between px-4 my-2"
            onPress={() => {router.push({ pathname: '/communityChat', params: { community_id: community.id } })}}
            style={{ width: '100%' }}
        >
            <View className="flex flex-row items-center gap-2">
                <Avatar alt="User PFP" className="h-12 w-12 bg-zinc-900">
                    <AvatarImage source={{ uri: community.community_picture }} />
                    <AvatarFallback className="bg-foreground">
                        <Text className="text-background">
                            {community.name?.charAt(0)}
                        </Text>
                    </AvatarFallback>

                </Avatar>
                <View>
                    <Text className="text-foreground font-bold text-base">
                        {community.name}
                    </Text>
                    <View className="flex-row flex-wrap items-center">
                        {/*{item.is_group ? (*/}
                        {/*    <>*/}
                        {/*        <Text className="text-foreground text-xs">*/}
                        {/*            {item.last_message.message}*/}
                        {/*        </Text>*/}
                        {/*        <Text className="text-foreground text-xs"> | {formatTimeAgo(item.last_message.timestamp)}</Text>*/}
                        {/*    </>*/}
                        {/*) : item.unread_count > 0 && !item.from_me ? (*/}
                        {/*    <Text className="text-foreground text-xs font-bold">*/}
                        {/*        {item.unread_count} new message{item.unread_count > 1 ? 's' : ''}*/}
                        {/*    </Text>*/}
                        {/*) : item.from_me && !item.recipient_seen ? (*/}
                        {/*    <Text className="text-foreground text-xs">*/}
                        {/*        Sent {formatTimeAgo(item.last_message.timestamp)}*/}
                        {/*    </Text>*/}
                        {/*) : item.from_me && item.recipient_seen ? (*/}
                        {/*    <Text className="text-foreground text-xs">*/}
                        {/*        Seen {formatTimeAgo(item.last_message.timestamp)}*/}
                        {/*    </Text>*/}
                        {/*) : (*/}
                        {/*    <>*/}
                        {/*        <Text className="text-foreground text-xs">*/}
                        {/*            {community.last_message.message}*/}
                        {/*        </Text>*/}
                        {/*        <Text className="text-foreground text-xs"> | {formatTimeAgo(item.last_message.timestamp)}</Text>*/}
                        {/*    </>*/}
                        {/*)}*/}

                    </View>

                </View>
            </View>
            <UsersIcon color={isDarkColorScheme ? "white" : "black"} />
        </Button>
            <Separator/>
        </View>
    );

    return (
        <FlatList
            data={joinedCommunities}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            style={style}
        />
    );
}
