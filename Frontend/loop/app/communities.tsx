import React, {useCallback, useEffect, useState} from 'react';
import {View, ScrollView, Text, SafeAreaView, Image, Alert} from 'react-native';
import SearchBar from "~/components/ui/searchbar";
import {Category, Community, CommunityService} from "~/services/CommunityService";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "~/components/ui/card";
import {Button} from "~/components/ui/button";
import { useRouter } from 'expo-router';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {P} from "~/components/ui/typography";
import {Badge} from "~/components/ui/badge";
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "~/components/ui/dialog";
import {useFocusEffect} from "@react-navigation/native";
import {PlusIcon} from "lucide-react-native";
import {useColorScheme} from "~/lib/useColorScheme";


export default function Communities() {
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
    const [communities, setCommunities] = useState<Community[] | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { isDarkColorScheme } = useColorScheme();

    const fetchCommunities = async () => {
        setLoading(true);
        const result = await CommunityService.search(search, selectedCategories.map((category) => category.id));
        setCommunities(result);
        setLoading(false);
    };

    useFocusEffect( // Makes the communities reload when we navigate to this page
        useCallback(() => {
            fetchCommunities();
        }, [])
    );

    useEffect(() => {
        fetchCommunities();
    }, [search, selectedCategories]);


    useEffect(() => {
        const getCategories = async () => {
            setCategories(await CommunityService.getCategories());
        }
        getCategories();
    }, []);

    useEffect(() => {
        const getCommunites = async () => {
            setLoading(true);
            setCommunities(await CommunityService.search(search, selectedCategories.map((category) => category.id)));
            console.log(communities)
            setLoading(false);
        }

        getCommunites();
    }, [search, selectedCategories]);

    const handleJoinCommunity = async (communityId: number) => {
        try {
            await CommunityService.joinCommunity(communityId);
        } catch {
            Alert.alert("You're already in this community");
            return;
        }
        setCommunities((prevCommunities) =>
            prevCommunities?.map((community) =>
                community.id === communityId ? {...community, members: community.members + 1, joined: true} : community
            )
        );
    };

    return (
        <SafeAreaView className="flex-1">
            <View className="flex-1 p-2">
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    <SearchBar
                        search={search}
                        onSearchChange={setSearch}
                        categories={categories}
                        selectedCategories={selectedCategories}
                        onSelectedCategoriesChange={setSelectedCategories}
                        loading={loading}
                        onLoadingChange={setLoading}
                    />

                    <View className="flex flex-col gap-4 mt-2">
                        {communities?.map((community) => (
                            <CommunityCard community={community} key={community.id} onJoinPressed={handleJoinCommunity}/>
                        ))}
                    </View>
                </ScrollView>
                <Button className="mb-4 mt-2 mx-6 flex flex-row items-center gap-2" onPress={() => router.push('/createCommunity')}>
                    <PlusIcon color={isDarkColorScheme ? "black" : "white"} /><P className="font-bold text-background">Create a New Community</P>
                </Button>
            </View>
        </SafeAreaView>
    );
}

export const CommunityCard: React.FC<{community: Community, onJoinPressed: (communityId: number) => void}> = ({community, onJoinPressed}) => {
    const [readMore, setReadMore] = useState<boolean>(false);

    return (
        <Card className="bg-secondary rounded-xl px-3 py-2 mx-auto" key={community.id}>
            <CardHeader className="flex flex-row justify-between w-full gap-4">
                <View>
                    <Avatar alt="Community Thumbnail" className="h-24 w-24 rounded-none">
                        <AvatarImage className="rounded-lg" source={{ uri: community.community_picture }} />
                        <AvatarFallback className="rounded-lg">
                            <Text>{community.name[0]}</Text>
                        </AvatarFallback>
                    </Avatar>
                </View>
                <View className="flex-1">
                    <CardTitle className="text-xxl font-semibold text-foreground">{community.name}</CardTitle>
                    <CardDescription
                        onPress={() => setReadMore(!readMore)}
                        className={`text-lg text-foreground ${readMore ? '' : 'line-clamp-2'}`}
                    >
                        {community.description}
                    </CardDescription>

                    <Text
                        onPress={() => setReadMore(!readMore)}
                        className="text-sm text-primary"
                    >
                        {readMore ? 'Read less' : 'Read more'}
                    </Text>
                </View>
            </CardHeader>

            <CardContent className="flex flex-col justify-between w-full ">


                <View className="flex flex-row flex-wrap gap-1">
                    {
                        community.categories.map((category) => (
                            <Badge key={category.id} variant="grey">
                                <Text className="text-foreground">{category.subtopic}</Text>
                            </Badge>
                        ))
                    }

                </View>


                <Text className="text-sm text-foreground mt-2">{community.members} members</Text>
            </CardContent>

            <CardFooter className="mt-3">
                <View className="flex justify-center w-full">
                    <CommunityJoinButton community={community} onJoinPressed={onJoinPressed}/>
                </View>
            </CardFooter>
        </Card>
    )
}

export const CommunityJoinButton: React.FC<{community: Community, onJoinPressed: (communityId: number) => void}> = ({community, onJoinPressed}) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    disabled={community.joined}
                >
                    <Text className="text-background font-bold">{community.joined ? "Joined" : "Join"}</Text>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join {community.name}</DialogTitle>
                    <DialogDescription>Are you sure you want to join this community?</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            onPress={() => onJoinPressed(community.id)}>
                            <Text>Yes, Join</Text>
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}