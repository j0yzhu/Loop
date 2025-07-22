import React, {useState, useEffect, useCallback} from "react";
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
} from "react-native";
import {Button} from '~/components/ui/button';
import {LoopLogo} from '~/components/loop-logo';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from 'expo-image-picker';
import {H1, H2, H4} from "~/components/ui/typography";
import {useLocalSearchParams, useRouter} from "expo-router";
import {User, UserService} from "~/services/UserService";
import {useFocusEffect} from "@react-navigation/native";
import {Avatar, AvatarFallback, AvatarImage} from "~/components/ui/avatar";
import {Trash2} from "lucide-react-native";
import {Separator} from "~/components/ui/separator";

export default function ProfileScreen() {

    const router = useRouter();
    const { userId } = useLocalSearchParams();
    const userIdStr = userId as string | undefined;

    const isCurrentUserProfile = !userId; // If no userId, it's the current user's profile

    const insets = useSafeAreaInsets();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

    const fetchProfile = async () => {
        try {
            console.log(userIdStr)
            setLoading(true);
            if (userIdStr) {
                setUser(await UserService.getUserById(parseInt(userIdStr)));
            }
            else {
                setUser(await UserService.getCurrentUser());
            }

            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch user:", error);
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    useFocusEffect(
        useCallback(
            () => {
                fetchProfile();
            }, [userId]
        )
    );

    const pickPostPhoto = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets[0].uri) {
            setUser(prevState =>
                prevState ? {
                    ...prevState,
                    photos: [...prevState.photos, result.assets[0].uri]
                } : null
            )
            await UserService.uploadPostPhoto(result.assets[0].uri);
            // await fetchProfile()

        }
    }

    const pickProfilePicture = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets[0].uri) {
            setUser(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    profile_picture: result.assets[0].uri
                };
            });
            await UserService.uploadProfilePicture(result.assets[0]);
        }
    }

    const deletePhoto = async (photoIndex: number, photoUrl: string) => {
        console.log("DELETING PHOTO");
        try {
            if (!user) return;
            
            console.log("Full URL:", photoUrl);
            await UserService.deletePostPhoto(photoUrl);
            
            setUser(prev => {
                if (!prev) return null;
                const newPhotos = prev.photos.filter(p => p !== photoUrl);
                return {...prev, photos: newPhotos};
            });
            
            setSelectedPhotoIndex(null);
            // await fetchProfile()
        } catch (error) {
            console.error("Error deleting photo:", error);
            // Show error to user if needed
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212"}}>
                <ActivityIndicator size="large" color="#fff"/>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                <Text style={{color: "#fff"}}>Failed to load profile</Text>
                <Button
                    onPress={async () => {
                        try {
                            await SecureStore.deleteItemAsync('access_token');
                        } catch (error) {
                            console.error('Error deleting access token:', error);
                        }
                        router.replace('/login');
                    }}
                >
                    <Text className="text-background text-center font-bold">Logout</Text>
                </Button>
            </SafeAreaView>
        );
    }


    return (
        <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
            <View className="flex-1 bg-background">
                <View className="relative items-center justify-center mx-auto">
                    <LoopLogo className="h-28 w-28" />
                    <Text className="absolute top-20 text-sm text-foreground">Learners On Open Pathways</Text>
                </View>

                {/* Scrollable profile content */}
                <ScrollView contentContainerStyle={{ paddingBottom: 24 }} className="m-4">
                    

                    {/* Edit Profile Button */}
                    {isCurrentUserProfile && (
                        <Button
                            className="absolute right-5 top-0 items-center pl-1"
                            variant="outline"
                            size="icon"
                            onPress={() => router.push('/profileSetup')}
                        >
                            <Ionicons name="create-outline" size={24} color="green" />
                        </Button>
                    )}

                    {/* Profile Info */}
                    <View className="Flex flex-row gap-6 mb-2">
                        <TouchableOpacity onPress={pickProfilePicture}>
                            <Avatar alt="User PFP" className="h-32 w-32">
                                <AvatarImage source={{ uri: user.profile_picture }} />
                                <AvatarFallback className="bg-secondary">
                                    <Text className="text-foreground">{user.firstname.charAt(0)}</Text>
                                </AvatarFallback>
                            </Avatar>
                        </TouchableOpacity>

                        <View>
                            <H1 className="text-2xl text-foreground font-bold">{user?.username || 'Username'}</H1>
                            <H1 className="text-left text-lg text-foreground font-bold">
                                {user?.full_name || 'full_name'} {user?.pronouns && (
                                    <Text className="ml text-sm text-foreground">({user.pronouns})</Text>
                                )}
                            </H1>
                            {user?.bio && (
                                <Text className="ml text-medium text-foreground font-semibold">{user.bio}</Text>
                            )}
                            {user?.degree && (
                                <Text className="ml text-medium text-foreground">{user.degree}</Text>
                            )}
                            {user?.year_level && (
                                <Text className="ml text-medium text-foreground">{user.year_level}</Text>
                            )}
                        </View>
                    </View>

                    {/* Interests */}
                    <TouchableOpacity onPress={() => router.push('/profileSetup?step=2')}>
                        <View className="mb-2 mt-2 ml-2">
                            {user.interests.length > 0 ? (
                                <>
                                    <H4 className="text-md font-black mb-2">Interests</H4>
                                    <View className="flex-row flex-wrap gap-2">
                                        {user.interests.map((interest, index) => (
                                            <View
                                                key={`${index}`}
                                                className="px-3 py-1 rounded-full bg-muted/50 border border-border"
                                            >
                                                <Text className="text-foreground">{interest}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <Text className="text-center text-muted-foreground">No interests added</Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    <Separator />

                    {/* Neurotypes */}
                    <TouchableOpacity onPress={() => router.push('/profileSetup?step=2')}>
                        <View className="mb-2 ml-2">
                            {user.neurotypes.length > 0 ? (
                                <>
                                    <H4 className="text-md font-black my-2">Neurotypes</H4>
                                    <View className="flex-row flex-wrap gap-2">
                                        {user.neurotypes.map((neurotype, index) => (
                                            <View
                                                key={`${index}`}
                                                className="px-3 py-1 rounded-full bg-muted/50 border border-border"
                                            >
                                                <Text className="text-foreground">{neurotype}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <Text className="text-center text-muted-foreground">No neurotypes added</Text>
                            )}
                        </View>
                    </TouchableOpacity>


                    {/* Photos */}
                    <View className="mt-5 flex flex-row justify-center flex-wrap gap-2">
                        {isCurrentUserProfile && (
                            <TouchableOpacity
                                className="w-[148px] h-[148px] rounded-lg border-2 border-dashed border-primary justify-center items-center"
                                onPress={pickPostPhoto}
                            >
                                <View className="items-center">
                                    <Ionicons name="add" size={24} color="green" />
                                    <Text className="text-xs text-foreground mt-1">Add</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {user.photos.slice().reverse().map((photoUrl, index) => (
                            <TouchableOpacity key={index}>
                                <Image
                                    source={{ uri: photoUrl }}
                                    className="w-[148px] h-[148px] rounded-lg"
                                />
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onPress={() => deletePhoto(user.photos.length - 1 - index, photoUrl)}
                                    className="mt-2 flex-row items-center"
                                >
                                    <Trash2 size={15} color="white" />
                                    <Text className="text-white ml-1">Delete</Text>
                                </Button>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Sticky Logout Button */}
                {isCurrentUserProfile && (
                    <Button
                        onPress={async () => {
                            try {
                                await SecureStore.deleteItemAsync('access_token');
                            } catch (error) {
                                console.error('Error deleting access token:', error);
                            }
                            router.replace('/login');
                        }}
                        className="bg-primary mb-4 mt-2 mx-6 flex flex-row items-center gap-2"
                    >
                        <Text className="text-background text-center font-bold">Logout</Text>
                    </Button>
                )}
            </View>
        </SafeAreaView>
    );

};