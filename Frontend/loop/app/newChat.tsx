import { useEffect, useState } from "react";
import {View, Text, TouchableOpacity, FlatList, ListRenderItem, SafeAreaView} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { SearchBar } from "~/components/ui/searchbar";
import { FriendService } from "~/services/FriendService";
import { UsersIcon, MessageCircleIcon, ArrowLeft } from "lucide-react-native";
import { useColorScheme } from "~/lib/useColorScheme";
import { User } from "~/services/UserService";


type Friend = {
    email: string;
    username: string;
    firstname: string;
    lastname: string;
    avatar?: string;
    profile_picture?: string;
};

export default function NewChat() {
    const router = useRouter();
    const [friends, setFriends] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const { isDarkColorScheme } = useColorScheme();

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const data = await FriendService.getMyFriends();
                setFriends(data);
            } catch (error) {
                console.error("Error retrieving friends", error);
            }
        };

        fetchFriends();
    }, []);

    const filteredFriends = friends.filter((friend) =>
        `${friend.firstname} ${friend.lastname}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem: ListRenderItem<User> = ({ item: friend }) => (
        <View className="flex-row items-center justify-between mb-5 px-2">
            <View className="flex-row items-center gap-3">
                <Avatar alt="friend pfp" className="h-10 w-10">
                    <AvatarImage source={{ uri: friend.profile_picture}} />
                    <AvatarFallback className="rounded-lg bg-foreground">
                        <Text className="text-background">{friend.username?.charAt(0)}</Text>
                    </AvatarFallback>
                </Avatar>
                <View>
                    <Text className="text-foreground font-medium">{friend.firstname} {friend.lastname}</Text>
                    <Text className="text-muted-foreground text-xs">{friend.email}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => router.push({ pathname: '/chat', params: { user: friend.email } })}>
                <MessageCircleIcon color={isDarkColorScheme ? "white" : "black"} />
            </TouchableOpacity>
        </View>
    );


    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            <View className="mx-4">

                <View className="mb-4 mt-3 mx-2" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <ArrowLeft size={24} color={isDarkColorScheme ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className="text-foreground text-xl font-bold">Start a new conversation</Text>
                </View>

                {/* Search */}
                <View className="px-3">
                    <SearchBar
                        placeholder="Search friends..."
                        search={searchQuery}
                        onSearchChange={setSearchQuery}
                        loading={false}
                        onLoadingChange={() => { }}
                        categories={[]}
                        selectedCategories={[]}
                        onSelectedCategoriesChange={() => { }}
                        showFilter={false}
                    />
                </View>

                {/* Create Group Chat */}
                <TouchableOpacity
                    onPress={() => router.push("/createGroupChat")}
                    className="flex-row items-center py-5 mb-2"
                >
                    <UsersIcon color={isDarkColorScheme ? "white" : "black"} style={{ marginRight: 12, marginLeft: 10 }} />
                    <Text className="text-foreground underline text-lg ">Create a group chat</Text>
                </TouchableOpacity>


                {/* Friends List */}
                <FlatList
                    data={filteredFriends}
                    keyExtractor={(item) => item.email}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text className="text-center text-muted-foreground mt-6">No users found</Text>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            </View>
            
        </SafeAreaView>
    );
}
