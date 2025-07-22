import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack} from 'expo-router';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { Checkbox } from '~/components/ui/checkbox';
import { Button } from '~/components/ui/button';
import { SearchBar } from '~/components/ui/searchbar';
import * as SecureStore from 'expo-secure-store';
import {ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from "~/lib/useColorScheme";
interface Friend {
    email: string;
    username: string;
    avatar?: string;
}

export default function AddGroupMember() {
    const router = useRouter();
    const { group_id } = useLocalSearchParams();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [members, setMembers] = useState<string[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { isDarkColorScheme } = useColorScheme();

    useEffect(() => {
        const fetchFriendsAndMembers = async () => {
            try {
                const token = await SecureStore.getItemAsync("access_token");

                const membersRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/group/${group_id}/members`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const membersData = await membersRes.json();
                setMembers(membersData.members.map(m => m.email));

                const friendsRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/friends/list`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const friendsData = await friendsRes.json();
                setFriends(friendsData);
            } catch (err) {
                console.error("Failed to fetch friends or members:", err);
                Alert.alert("Error", "Unable to fetch friends or members.");
            }
        };

        fetchFriendsAndMembers();
    }, []);

    const toggleSelect = (email: string) => {
        setSelectedEmails(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const handleAddMembers = async () => {
        try {
            const token = await SecureStore.getItemAsync("access_token");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/group/${group_id}/add-member`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ emails: selectedEmails })
            });

            if (!res.ok) throw new Error("Failed to add members");

            Alert.alert("Success", "Members added successfully.");
            router.back();
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    };

    const filteredFriends = friends.filter(friend =>
        !members.includes(friend.email) && (
            friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            friend.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            <View className="mx-5">

                <View className="mb-4 mt-3" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <ArrowLeft size={24} color={isDarkColorScheme ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className="text-foreground text-xl font-bold">Add Group Members</Text>
                </View>
                

                <SearchBar
                    search={searchQuery}
                    onSearchChange={setSearchQuery}
                    loading={false}
                    onLoadingChange={() => { }}
                    categories={[]}
                    selectedCategories={[]}
                    onSelectedCategoriesChange={() => { }}
                    showFilter={false}
                    placeholder="Search friends..."
                />

                <Text className="text-muted-foreground text-sm mt-6 mb-2 ml-2">Your Friends</Text>

                <FlatList
                    data={filteredFriends}
                    keyExtractor={item => item.email}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3"
                            onPress={() => toggleSelect(item.email)}
                        >
                            <View className="flex-row items-center gap-3 ml-3">
                                <Avatar className="h-10 w-10 bg-zinc-900">
                                    <AvatarImage source={{ uri: item.profile_picture || '' }} />
                                    <AvatarFallback className="bg-foreground">
                                        <Text className="text-background text-xs">{item.username?.charAt(0)}</Text>
                                    </AvatarFallback>
                                </Avatar>

                                <View>
                                    <Text className="text-foreground font-medium">{item.username}</Text>
                                    <Text className="text-muted-foreground text-xs">{item.email}</Text>
                                </View>
                            </View>

                            <Checkbox
                                className="mr-3"
                                checked={selectedEmails.includes(item.email)}
                                onCheckedChange={() => toggleSelect(item.email)}
                            />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text className="text-center text-zinc-500 mt-6">No friends to add</Text>}
                    contentContainerStyle={{ paddingBottom: 120 }}
                />

            </View>
            <View className="absolute bottom-6 left-5 right-5">
                <Button
                    disabled={selectedEmails.length === 0}
                    onPress={handleAddMembers}
                    className="bg-green-600 mb-5"
                >
                    <Text className="text-white font-semibold">
                        Add {selectedEmails.length} Member{selectedEmails.length !== 1 ? 's' : ''}
                    </Text>
                </Button>
            </View>
        </SafeAreaView>
    );
}
