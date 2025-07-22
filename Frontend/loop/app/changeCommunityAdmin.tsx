import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Alert, SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { Checkbox } from '~/components/ui/checkbox';
import { Button } from '~/components/ui/button';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from '~/lib/useColorScheme';
import * as SecureStore from 'expo-secure-store';
import { SearchBar } from '~/components/ui/searchbar';


export default function ChangeCommunityAdmin() {
    const router = useRouter();
    const { community_id } = useLocalSearchParams();
    const [members, setMembers] = useState<any[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const { isDarkColorScheme } = useColorScheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [myEmail, setMyEmail] = useState('');
    const [community, setCommunity] = useState<any>(null);

    const fetchInfo = async () => {
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
                if (a.email === userData.email) return -1;
                if (b.email === userData.email) return 1;
                return 0;
            });
            setMembers(memberData);
        } catch (err) {
            console.error("Failed to fetch community info:", err);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchInfo();
        }, [community?.owner?.email])
    );


    useEffect(() => {
        if (showConfirmDialog && selectedEmail) {
            Alert.alert(
                "Assign New Admin",
                `Are you sure you want to assign ${selectedEmail} as the new admin? You will lose admin privileges.`,
                [
                    { text: "Cancel", style: "cancel", onPress: () => setShowConfirmDialog(false) },
                    {
                        text: "Confirm",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                const token = await SecureStore.getItemAsync("access_token");
                                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/community/${community_id}/change-admin`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ new_admin_email: selectedEmail }),
                                });

                                if (!res.ok) throw new Error("Failed to change admin");

                                await fetchInfo();

                                Alert.alert("Success", "Admin changed successfully");
                                setShowConfirmDialog(false);
                                router.replace({
                                    pathname: '/communityInfo',
                                    params: { community_id, updated: 'true' }
                                });

                            } catch (err) {
                                Alert.alert("Error", err.message);
                                setShowConfirmDialog(false);
                            }
                        }
                    }
                ]
            );
        }
    }, [showConfirmDialog]);



    const handleSelect = (email: string) => {
        setSelectedEmail(prev => (prev === email ? null : email));
    };

    const handleConfirm = async () => {
        try {
            const token = await SecureStore.getItemAsync("access_token");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/community/${community_id}/change-admin`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ new_admin_email: selectedEmail }),
            });

            if (!res.ok) throw new Error("Failed to change admin");

            Alert.alert("Success", "Admin changed successfully");
            router.back();
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            <View className="mx-5">
                <View className="mb-4 mt-3 flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <ArrowLeft size={24} color={isDarkColorScheme ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className="text-foreground text-xl font-bold">Assign New Admin</Text>
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
                    placeholder="Search members..."
                />

                <Text className="text-muted-foreground text-sm mt-4 mb-2 ml-2">Community Members</Text>

                <FlatList
                    data={members.filter(m =>
                        m.email !== myEmail && (
                            m.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.email?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                    )}
                    keyExtractor={(item) => item.email}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3"
                            onPress={() => handleSelect(item.email)}
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
                            {(!selectedEmail || selectedEmail === item.email) && (
                                <Checkbox
                                    className="mr-3"
                                    checked={selectedEmail === item.email}
                                    onCheckedChange={() => handleSelect(item.email)}
                                />
                            )}
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingBottom: 120 }}
                />
            </View>

            <View className="absolute bottom-6 left-5 right-5">
                <Button
                    disabled={!selectedEmail}
                    onPress={() => setShowConfirmDialog(true)}
                    className="bg-green-600 mb-5"
                >
                    <Text className="text-white font-semibold">
                        Confirm New Admin
                    </Text>
                </Button>

            </View>
        </SafeAreaView>
    );
}
