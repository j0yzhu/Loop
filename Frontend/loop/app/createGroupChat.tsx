import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Input } from '~/components/ui/input';
import { SearchBar } from '~/components/ui/searchbar';
import { Checkbox } from '~/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { FriendService } from '~/services/FriendService';
import * as SecureStore from 'expo-secure-store';
import { User } from "~/services/UserService";
import { ArrowLeft } from "lucide-react-native";
import { useColorScheme } from "~/lib/useColorScheme";

export default function CreateGroupChat() {
    const router = useRouter();
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [friends, setFriends] = useState<User[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [showWarning, setShowWarning] = useState(false);
    const { isDarkColorScheme } = useColorScheme();


    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const data = await FriendService.getMyFriends();
                setFriends(data);
            } catch (error) {
                console.error("Using fallback friends", error);
            }
        };
        fetchFriends();
    }, []);

    const toggleSelect = (email: string) => {
        setSelectedEmails(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const filteredFriends = friends.filter(friend =>
        `${friend.firstname} ${friend.lastname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert("Please enter a group name");
            return;
        }

        if (selectedEmails.length < 2) {
            Alert.alert("Select at least 2 friends to create a group.");
            return;
        }

        try {
            const token = await SecureStore.getItemAsync("access_token");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/groupchats/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: groupName.trim(),
                    members: selectedEmails
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create group");
            }

            const data = await res.json();
            console.log("Group created:", data);
            // Navigate to group chat screen directly
            router.replace({
                pathname: '/groupChat',
                params: {
                    group_id: data.group_id.toString(),
                    group_name: groupName.trim()
                }
            });

        } catch (err) {
            // @ts-ignore
            Alert.alert("Error", err.message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            <View className="mx-5">

                <View className="mb-4 mt-3 mx-1" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <ArrowLeft size={24} color={isDarkColorScheme ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className="text-foreground text-xl font-bold">New group chat</Text>
                </View>                

                <Input
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Group name"
                    placeholderTextColor="foreground"
                    className="mb-1 text-foreground border border-foreground"
                />

                <Text className="text-muted-foreground text-sm mt-4 mb-2">Suggested friends</Text>

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

                <FlatList
                    className="mt-2"
                    data={filteredFriends}
                    keyExtractor={item => item.email}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3"
                            onPress={() => toggleSelect(item.email)}
                        >
                            <View className="flex-row items-center gap-3">
                                <Avatar alt="friend" className="h-10 w-10">
                                    <AvatarImage
                                        source={{ uri: item.profile_picture_url }}
                                    />
                                    <AvatarFallback className="rounded-lg bg-foreground">
                                        <Text className="text-background">{item.firstname[0]}</Text>
                                    </AvatarFallback>
                                </Avatar>
                                <View>
                                    <Text className="text-foreground font-medium">{item.username}</Text>
                                    <Text className="text-muted-foreground text-xs">{item.email}</Text>
                                </View>
                            </View>

                            <Checkbox
                                checked={selectedEmails.includes(item.email)}
                                onCheckedChange={() => toggleSelect(item.email)}
                            />

                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text className="text-center text-muted-foreground mt-6">No friends found</Text>}
                    contentContainerStyle={{ paddingBottom: 120 }}
                />
                
            </View>
            <View className="absolute bottom-6 left-5 right-5 mb-3">
                {showWarning && (
                    <Text className="text-red-400 mb-1 text-sm text-center">
                        Please select at least 2 friends to create a group.
                    </Text>
                )}
                <Button
                    className={`mt-6 ${selectedEmails.length >= 2 ? "bg-primary" : "bg-muted-foreground"}`}
                    onPress={() => {
                        if (selectedEmails.length < 2) {
                            setShowWarning(true);
                            setTimeout(() => setShowWarning(false), 3000); // Fade out
                        } else {
                            setShowWarning(false);
                            handleCreateGroup();
                        }
                    }}
                >
                    <Text className="text-foreground font-semibold">Create Group</Text>
                </Button>
            </View>

            
        </SafeAreaView>
    );
}
