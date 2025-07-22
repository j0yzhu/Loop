import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Alert, TextInput, SafeAreaView, Image
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { ArrowLeft, PencilIcon, UserIcon, ImageIcon, Trash2Icon } from 'lucide-react-native';
import { useColorScheme } from "~/lib/useColorScheme";
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/ui/dialog';

export default function CommunityInfo() {
    const router = useRouter();
    const { community_id, updated } = useLocalSearchParams();
    const [community, setCommunity] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [myEmail, setMyEmail] = useState('');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const { isDarkColorScheme } = useColorScheme();
    const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [editDescriptionDialogOpen, setEditDescriptionDialogOpen] = useState(false);
    const [newDescription, setNewDescription] = useState('');


    const isAdmin = community?.owner?.email === myEmail;

    const fetchCommunityData = async () => {
        try {
            const token = await SecureStore.getItemAsync("access_token");

            const userRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = await userRes.json();
            setMyEmail(userData.email);

            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/community/${community_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Failed to fetch community info: ${res.status}`);
            const data = await res.json();
            setCommunity(data);

            const memberRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/community/${community_id}/members`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const memberData = await memberRes.json();
            memberData.sort((a, b) => {
                const isMe = (x) => x.email === userData.email;
                const isAdmin = (x) => x.email === data.owner?.email;

                // You at the top
                if (isMe(a)) return -1;
                if (isMe(b)) return 1;

                // Admin second (only if not me)
                if (!isMe(data.owner) && isAdmin(a)) return -1;
                if (!isMe(data.owner) && isAdmin(b)) return 1;

                return 0;
            });

            setMembers(
                memberData.map((m) => ({
                    ...m,
                    status: m.is_friend ? 'friend' : 'none', // set initial toggle state
                }))
            );

        } catch (err) {
            console.error("Failed to fetch community info:", err);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCommunityData();
        }, [updated])
    );

    const handlePickCommunityPicture = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets[0].uri) {
                const formData = new FormData();
                formData.append("file", {
                    uri: result.assets[0].uri,
                    name: "community.jpg",
                    type: "image/jpeg",
                } as any);

                const token = await SecureStore.getItemAsync("access_token");
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/community/createCommunity/${community_id}/community-picture`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                    body: formData,
                });

                if (!res.ok) throw new Error("Upload failed");

                setCommunity(prev => ({ ...prev, community_picture: result.assets[0].uri }));
                Alert.alert("Success", "Community picture updated");
            }
        } catch (err) {
            console.error("Image upload error:", err);
            Alert.alert("Error", "Failed to upload picture");
        }
    };

    const handleLeave = () => {
        if (isAdmin) {
            Alert.alert("You must assign a new admin before leaving this community.");
            return;
        }

        Alert.alert("Confirm", "Are you sure you want to leave this community?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Leave",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await SecureStore.getItemAsync("access_token");
                        await fetch(`${process.env.EXPO_PUBLIC_API_URL}/community/${community_id}/leave`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        Alert.alert("Left Community", "You have left the community.");
                        router.replace("/message");
                    } catch (err) {
                        Alert.alert("Error", "Could not leave the community.");
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => {
        const isMe = item.email === myEmail;
        const isOwner = community?.owner?.email === item.email;
        const friend = item.is_friend;

        return (
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage source={{ uri: item.profile_picture || '' }} />
                        <AvatarFallback className="bg-foreground">
                            <Text className="text-background text-xs">{item.username?.charAt(0)}</Text>
                        </AvatarFallback>
                    </Avatar>
                    <View>
                        <Text className="text-foreground font-medium">
                            {item.username}
                            {isMe && <Text className="text-sm"> (You)</Text>}
                            {isOwner && <Text className="text-sm"> (Admin)</Text>}
                        </Text>
                        <Text className="text-muted-foreground text-xs">{item.email}</Text>
                    </View>
                </View>
                {!isMe && item.is_friend && (
                    <Button
                        size="sm"
                        className="px-3 bg-blue-600"
                        onPress={() => router.push({ pathname: '/chat', params: { user: item.email } })}
                    >
                        <Text className="text-white text-sm">Message</Text>
                    </Button>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            <View className="mx-5">
                <View className="mb-4 mt-3 flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <ArrowLeft size={24} color={isDarkColorScheme ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className="text-foreground text-xl font-bold">Community Info</Text>
                </View>

                <View className="items-center justify-center mt-4 mb-6">
                    <View className="relative items-center">
                        <Avatar className="h-24 w-24 border border-foreground mb-2">
                            <AvatarImage source={{ uri: community?.community_picture }} />
                            <AvatarFallback>
                                <Text className="text-2xl text-foreground">{community?.name?.[0]}</Text>
                            </AvatarFallback>
                        </Avatar>
                        {isAdmin && (
                            <TouchableOpacity onPress={handlePickCommunityPicture} className="absolute bottom-0 right-0 bg-background rounded-full p-2 border border-foreground mb-1">
                                <ImageIcon size={16} color={isDarkColorScheme ? "white" : "black"} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {isAdmin ? (
                        <Dialog open={editNameDialogOpen} onOpenChange={(open) => {
                            setEditNameDialogOpen(open);
                            if (open) setNewName(community?.name || '');
                        }}>
                            <DialogTrigger asChild>
                                <TouchableOpacity className="flex-row items-center justify-center gap-1">
                                    <Text className="text-foreground text-xl font-bold text-center">{community?.name}</Text>
                                    <PencilIcon size={16} color={isDarkColorScheme ? "white" : "black"} />
                                </TouchableOpacity>
                            </DialogTrigger>

                            <DialogContent className="bg-background p-4 rounded-lg">
                                <DialogHeader>
                                    <DialogTitle className="text-foreground text-lg px-10">Edit Community Name</DialogTitle>
                                </DialogHeader>

                                <TextInput
                                    value={newName}
                                    onChangeText={setNewName}
                                    placeholder="Enter new name"
                                    placeholderTextColor="#999"
                                    className="bg-background text-foreground border border-foreground px-4 py-3 rounded my-4"
                                />

                                <Button
                                    disabled={newName.trim() === community?.name?.trim()}
                                    onPress={async () => {
                                        try {
                                            const token = await SecureStore.getItemAsync("access_token");
                                            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/community/${community_id}/name`, {
                                                method: 'PATCH',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ name: newName }),
                                            });

                                            if (!res.ok) throw new Error("Failed to update community name");

                                            Alert.alert("Success", "Community name updated");
                                            setCommunity({ ...community, name: newName });
                                            setEditNameDialogOpen(false);
                                        } catch (err) {
                                            Alert.alert("Error", err.message);
                                        }
                                    }}
                                >
                                    <Text className="text-white font-bold">Save</Text>
                                </Button>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Text className="text-foreground text-xl font-bold text-center">{community?.name}</Text>
                    )}



                    <View className="mt-2 px-4 flex-row items-center justify-center flex-wrap gap-2">
                        {isAdmin ? (
                            <Dialog open={editDescriptionDialogOpen} onOpenChange={(open) => {
                                setEditDescriptionDialogOpen(open);
                                if (open) setNewDescription(community?.description || '');
                            }}>
                                <DialogTrigger asChild>
                                    <TouchableOpacity className="flex-row items-center justify-center gap-1">
                                        <Text className="text-muted-foreground text-center">
                                            {community?.description || "No description provided."}
                                        </Text>
                                        <PencilIcon size={14} color={isDarkColorScheme ? "white" : "black"} />
                                    </TouchableOpacity>
                                </DialogTrigger>

                                <DialogContent className="bg-background p-4 rounded-lg">
                                    <DialogHeader>
                                        <DialogTitle className="text-foreground text-lg px-8">Edit Community Description</DialogTitle>
                                    </DialogHeader>

                                    <TextInput
                                        value={newDescription}
                                        onChangeText={setNewDescription}
                                        placeholder="Enter new description"
                                        placeholderTextColor="#999"
                                        multiline
                                        className="bg-background text-foreground border border-foreground px-4 py-3 rounded my-4"
                                    />

                                    <Button
                                        disabled={newDescription.trim() === (community?.description || '').trim()}
                                        onPress={async () => {
                                            try {
                                                const token = await SecureStore.getItemAsync("access_token");
                                                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/community/${community_id}/description`, {
                                                    method: 'PATCH',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: JSON.stringify({ description: newDescription }),
                                                });

                                                if (!res.ok) throw new Error("Failed to update description");

                                                Alert.alert("Success", "Description updated");
                                                setCommunity({ ...community, description: newDescription });
                                                setEditDescriptionDialogOpen(false);
                                            } catch (err) {
                                                Alert.alert("Error", err.message);
                                            }
                                        }}
                                    >
                                        <Text className="text-white font-bold">Save</Text>
                                    </Button>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Text className="text-muted-foreground text-center">{community?.description}</Text>
                        )}
                    </View>

                </View>

                <Text className="text-foreground font-bold text-base mb-3">
                    Community members ({members.length})
                </Text>

                <View className="border border-muted-foreground py-4 px-4 mb-4 rounded-lg" style={{ maxHeight: 250 }}> 
                    <FlatList
                        data={members}
                        keyExtractor={(item) => item.email}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 10 }}
                    />
                </View>

                {isAdmin && (
                    <View className="border border-foreground rounded-lg px-4 py-3 mb-4">
                        <TouchableOpacity
                            className="flex-row items-center gap-2"
                            onPress={() => router.push({ pathname: '/changeCommunityAdmin', params: { community_id } })}
                        >
                            <UserIcon color={isDarkColorScheme ? "white" : "black"} />
                            <Text className="text-foreground ml-2">Change Admin Role</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Button className="bg-destructive mb-6" onPress={handleLeave}>
                    <Text className="text-white font-bold">Leave community</Text>
                </Button>

                {isAdmin && (
                    <TouchableOpacity
                        className="flex-row items-center justify-center mt-2"
                        onPress={() => {
                            Alert.alert("Confirm Delete", "This will permanently delete the community. Are you sure?", [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: async () => {
                                        try {
                                            const token = await SecureStore.getItemAsync("access_token");
                                            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/community/${community_id}/delete`, {
                                                method: "DELETE",
                                                headers: { Authorization: `Bearer ${token}` },
                                            });
                                            if (!res.ok) throw new Error("Failed to delete community");

                                            Alert.alert("Deleted", "Community has been deleted.");
                                            router.replace("/message"); // or homepage
                                        } catch (err) {
                                            Alert.alert("Error", err.message);
                                        }
                                    },
                                },
                            ]);
                        }}
                    >
                        <Trash2Icon size={18} color="red" />
                        <Text className="text-red-600 font-bold ml-2">Delete Community</Text>
                    </TouchableOpacity>
                )}

            </View>
        </SafeAreaView>
    );
}
