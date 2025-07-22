import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { PencilIcon, MessageCircleIcon, UserPlus, ArrowLeft } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/ui/dialog';
import { useColorScheme } from "~/lib/useColorScheme";


export default function GroupInfo() {
    const router = useRouter();
    const { group_id, group_name } = useLocalSearchParams();
    const [name, setName] = useState(group_name);
    const [members, setMembers] = useState([]);
    const [myEmail, setMyEmail] = useState('');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const { isDarkColorScheme } = useColorScheme();

    const fetchMembers = async () => {
        try {
            const token = await SecureStore.getItemAsync("access_token");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/group/${group_id}/members`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            console.log("Group member response:", data);
            setMembers(data.members);
            setName(data.group_name);
        } catch (err) {
            console.error("Failed to fetch group members:", err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await SecureStore.getItemAsync("access_token");
                const userRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = await userRes.json();
                setMyEmail(userData.email);

                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/group/${group_id}/members`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();

                // Put current user first
                const sortedMembers = [
                    ...data.members.filter(m => m.email === userData.email),
                    ...data.members.filter(m => m.email !== userData.email)
                ];

                setMembers(sortedMembers);
                setName(data.group_name);
            } catch (err) {
                console.error("Failed to fetch group info:", err);
            }
        };

        fetchData();
    }, []);

    const renderItem = ({ item }) => {
        const isMe = item.email === myEmail;

        return (
            <View className="flex-row items-center justify-between mb-4">

                <View className="flex-row items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage source={{ uri: item.avatar || '' }} />
                        <AvatarFallback className="bg-foreground">
                            <Text className="text-background text-xs">{item.username?.charAt(0)}</Text>
                        </AvatarFallback>
                    </Avatar>
                    <View>
                        <Text className="text-foreground font-medium">
                            {item.username} {isMe && <Text className="text-foreground text-sm">(You)</Text>}
                        </Text>
                        <Text className="text-muted-foreground text-xs">{item.email}</Text>
                    </View>
                </View>
                {!isMe && (
                    <TouchableOpacity onPress={() => router.push({ pathname: '/chat', params: { user: item.email } })}>
                        <MessageCircleIcon color={isDarkColorScheme ? "white" : "black"} />
                    </TouchableOpacity>
                )}
                
            </View>
        );
    };



    return (
        <SafeAreaView className="flex-1 bg-background" >
            <Stack.Screen options={{ headerShown: false }} />
            <View className="mx-5">
                <View className="mb-4 mt-3" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <ArrowLeft size={24} color={isDarkColorScheme ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className="text-foreground text-xl font-bold">Group Info</Text>
                </View>
                

                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                        <TouchableOpacity className="flex-row items-center gap-2 mb-6">
                            <TextInput
                                value={name}
                                editable={false}
                                className="flex-1 bg-background text-foreground px-3 py-4 rounded-lg border border-foreground"
                            />
                            <PencilIcon color={isDarkColorScheme ? "white" : "black"} size={20} />

                        </TouchableOpacity>
                    </DialogTrigger>


                    <DialogContent className="bg-background p-4 rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-foreground text-lg px-10">Edit Group Name</DialogTitle>
                        </DialogHeader>

                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter new group name"
                            placeholderTextColor="#999"
                            className="bg-background text-foreground border border-foreground px-4 py-3 rounded my-4"
                        />

                        <Button disabled={name === group_name} onPress={async () => {
                            try {
                                const token = await SecureStore.getItemAsync("access_token");
                                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/group/${group_id}/name`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ name }),
                                });

                                if (!res.ok) throw new Error("Failed to update group name");

                                Alert.alert("Success", "Group name updated");
                                setEditDialogOpen(false);
                                fetchMembers();
                            } catch (err) {
                                Alert.alert("Error", err.message);
                            }
                        }}>
                            <Text className="text-white font-bold">Save</Text>
                        </Button>
                    </DialogContent>
                </Dialog>





                <FlatList
                    data={members}
                    keyExtractor={(item) => item.email}
                    renderItem={renderItem}
                    ListFooterComponent={
                        <View className="space-y-4 mt-4">
                            {/* Add Member Button */}
                            <View className="border border-foreground rounded-lg px-4 py-3">
                                <TouchableOpacity
                                    className="flex-row items-center gap-2"
                                    onPress={() => router.push({ pathname: '/addGroupMember', params: { group_id } })}
                                >
                                    <UserPlus color={isDarkColorScheme ? "white" : "black"} />
                                    <Text className="text-foreground ml-2">Add new member</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Leave Group Button with confirmation */}
                            <TouchableOpacity
                                className="bg-red-600 rounded-lg px-4 py-3 mt-4"
                                onPress={() => {
                                    Alert.alert(
                                        "Leave Group",
                                        "Are you sure you want to leave this group?",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                                text: "Leave",
                                                style: "destructive",
                                                onPress: async () => {
                                                    try {
                                                        const token = await SecureStore.getItemAsync("access_token");
                                                        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/message/group/${group_id}/leave`, {
                                                            method: 'POST',
                                                            headers: {
                                                                Authorization: `Bearer ${token}`
                                                            }
                                                        });

                                                        if (!res.ok) throw new Error("Failed to leave group");

                                                        Alert.alert("Left Group", "You have left the group.");
                                                        router.replace('/message'); // or whatever your main tab is
                                                    } catch (err) {
                                                        Alert.alert("Error", err.message);
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }}
                            >
                                <Text className="text-white text-center font-bold">Leave Group</Text>
                            </TouchableOpacity>
                        </View>
                    }


                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            </View>
        </SafeAreaView>
    );

}
