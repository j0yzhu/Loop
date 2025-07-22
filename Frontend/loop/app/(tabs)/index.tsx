import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Dimensions,
  Alert,
  Pressable,
  SafeAreaView,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import {Link, useRouter} from 'expo-router';
import {Community, CommunityService} from '~/services/CommunityService';
import {HomeService, Event, Announcement} from '~/services/HomeService';
import {Carousel} from '~/components/ui/carousel';
import {H2, P} from '~/components/ui/typography';
import {Button} from '~/components/ui/button';
import {ArrowRight, ClockIcon, MoonIcon, PlusIcon, SunIcon} from 'lucide-react-native';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommunityJoinButton } from '~/app/communities';
import { useFocusEffect } from '@react-navigation/native';
import { LoopLogo } from '~/components/loop-logo';
import { useColorScheme } from '~/lib/useColorScheme';
import {User, UserService} from "~/services/UserService";
import {useTimer} from "~/app/Timer";

const { width: screenWidth } = Dimensions.get('window');

export default function HomePage() {
  const insets = useSafeAreaInsets();

  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const { toggleVisible } = useTimer();

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView className="relative bg-background">
          <View className="relative items-center justify-center mx-auto">
              <LoopLogo className="h-28 w-28" />
              <Text className="absolute top-20 text-sm text-foreground">Learners On Open Pathways</Text>
          </View>
          <Button
              className="absolute left-7 top-10"
              variant="outline"
              size="icon"
              onPress={toggleVisible}>
              <ClockIcon color={isDarkColorScheme ? 'white' : 'black'} />
          </Button>
        <Button
          className="absolute right-7 top-10"
          variant="outline"
          size="icon"
          onPress={() => {
            setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
          }}>
          {colorScheme === 'dark' ? (
            <SunIcon color={isDarkColorScheme ? 'white' : 'black'} />
          ) : (
            <MoonIcon color={isDarkColorScheme ? 'white' : 'black'} />
          )}
        </Button>
        <View className="flex flex-col gap-6">
          <PopularCommunitiesCarousel />
          <EventsCarousel />
          <Announcements />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PopularCommunitiesCarousel = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const {isDarkColorScheme} = useColorScheme();

  const fetchCommunities = async () => {
    const result = await CommunityService.getAllCommunities();
    setCommunities(result);
  };

    useFocusEffect(
        useCallback(() => {
            fetchCommunities();
        }, [])
    );

    useEffect(() => {
        fetchCommunities();
    }, []);

    const handleJoinCommunity = async (communityId: number) => {
        try {
            await CommunityService.joinCommunity(communityId);
        } catch {
            Alert.alert("You're already in this community");
            return;
        }
        setCommunities((prevCommunities) =>
            prevCommunities.map((community) =>
                community.id === communityId ? {...community, members: community.members + 1, joined: true} : community
            )
        );
    };

    const communityCards = communities.map((community) => (
        <Card key={community.id} className="m-4 flex flex-row items-center bg-secondary">
            <CardHeader>
                <Avatar alt="Community Thumbnail" className="h-16 w-16 rounded-none">
                    <AvatarImage className="rounded-lg" source={{uri: community.community_picture}}/>
                    <AvatarFallback className="rounded-lg">
                        <Text className="text-foreground text-lg">{community.name[0]}</Text>
                    </AvatarFallback>
                </Avatar>
            </CardHeader>
            <CardContent className="flex-1 p-2">
                <CardTitle>{community.name}</CardTitle>
                <CardDescription className="line-clamp-2">{community.description}</CardDescription>
                <CardDescription className="text-foreground">{community.members} members</CardDescription>
            </CardContent>
            <CardFooter>
                <CommunityJoinButton community={community} onJoinPressed={handleJoinCommunity}/>
            </CardFooter>
        </Card>
    ));

    return (
        <View>
            <View className="mb-2 flex-row items-center justify-center gap-4">
                <H2>Communities</H2>
                <CreateCommunityButton />
            </View>

            <Carousel data={communityCards} height={110} loop={true}/>
            <Link href="/communities" asChild>
                <Button className="mx-auto mt-4 w-80 flex-row items-center justify-center gap-2">
                    <Text className="font-bold text-background">Explore Communities</Text>
                    <ArrowRight color={isDarkColorScheme ? "black" : "white"}/>
                </Button>
            </Link>
        </View>
    );
};

const CreateCommunityButton = () => {
    const router = useRouter();
    const { isDarkColorScheme } = useColorScheme();

    return (
        <Button
            onPress={() => router.navigate('/createCommunity')}
            size="icon"
            className="w-6 h-6"
        >
            <PlusIcon color={isDarkColorScheme ? 'black' : 'white'} />
        </Button>
    );
};

const EventsCarousel = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const {isDarkColorScheme} = useColorScheme();


    const fetchEvents = async () => {
        const data = await HomeService.getEvents();
        setEvents(data);
    };

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [])
    );

    useEffect(() => {
        fetchEvents();
    }, []);


    const handleRsvpEvent = async (eventId: number) => {
        try {
            console.log("making rsvp request");
            await HomeService.rsvpEvent(eventId);
            setEvents((prevEvents) =>
                prevEvents.map((event) =>
                    event.id === eventId ? {...event, rsvped: true} : event
                )
            );
        } catch {
            Alert.alert("You already rsvp for this event!");
            return;
        }
    }

    const eventCards = events.map((event) => (
        <View className="w-full p-4 h-full">
            <Card className="w-full h-full bg-secondary px-3">
                <View className="flex flex-row items-center justify-between">
                    <CardHeader className="flex-shrink">
                        <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                    </CardHeader>
                    <EventRsvpButton event={event} onRsvpPressed={handleRsvpEvent}/>
                </View>
                <CardFooter>
                    <CardDescription className="text-foreground line-clamp-2">
                        {format(event.date, 'Pp')} @ {event.location}
                    </CardDescription>
                </CardFooter>
            </Card>
        </View>
    ));

    return (
        <View>
            <View className="flex-row items-center justify-center gap-4 mb-2">
                <H2>Events</H2>
                <CreateEventButton />
            </View>
            <Carousel data={eventCards} height={200} loop={true}/>
            <Link href="/events" asChild>
                <Button className="mx-auto mt-4 w-80 flex-row items-center justify-center gap-2">
                    <Text className="font-bold text-background">Explore Events</Text>
                    <ArrowRight color={isDarkColorScheme ? "black" : "white"}/>
                </Button>
            </Link>
        </View>
    );
};

const CreateEventButton = () => {
    const router = useRouter();
    const { isDarkColorScheme } = useColorScheme();

    return (
        <Button
            onPress={() => router.navigate('/createEvent')}
            size="icon"
            className="w-6 h-6"
        >
            <PlusIcon color={isDarkColorScheme ? 'black' : 'white'} />
        </Button>
    );
};


const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await UserService.getCurrentUser();
            setUser(userData);
        };

        fetchUser();
    }, []);

    const load = async () => {
        const data = await HomeService.getAnnouncements();
        setAnnouncements(data);
    };

    useFocusEffect(useCallback(() => {
        load();
    }, []));

    const handleCreated = (newAnn: Announcement) => {
        setAnnouncements(prev => [newAnn, ...prev]);
    };

    useEffect(() => {
        if (user?.email) {
            console.log(user.email);
        }
    }, [user]);


    return (
        <View className="mb-2">
            <View className="flex-row justify-center items-center gap-4 mb-4">
                <H2>Announcements</H2>
                {
                    user?.email.includes('@auckland.ac.nz') ?
                        <CreateAnnouncementDialog onCreated={handleCreated}/>
                        :
                        null
                }

            </View>

            {announcements.length === 0 ? (
                <Text className="text-center text-muted-foreground mt-4">
                    No announcements available.
                </Text>
            ) : (
                announcements.map(a => (
                    <AnnouncementItem key={a.id} announcement={a}/>
                ))
            )}
        </View>
    );
};

export const EventRsvpButton: React.FC<{ event: Event, onRsvpPressed: (eventId: number) => void }> = ({
                                                                                                          event,
                                                                                                          onRsvpPressed
                                                                                                      }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                >
                    <Text className="text-background font-bold">{event.rsvped ? "RSVP'd" : "View"}</Text>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>RSVP for {event.title}</DialogTitle>
                    <DialogDescription>{event.description}</DialogDescription>
                    <DialogDescription className="text-primary">
                        {format(event.date, 'Pp')} @ {event.location}
                    </DialogDescription>
                    <DialogDescription className="text-foreground font-black">Do you want to RSVP for this
                        event?</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            disabled={event.rsvped}
                            onPress={() => onRsvpPressed(event.id)}>
                            <Text>{event.rsvped ? "RSVP'd" : "RSVP"}</Text>
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface Props {
    onCreated: (newAnnouncement: Announcement) => void;
}

export const CreateAnnouncementDialog: React.FC<Props> = ({onCreated}) => {
    const router = useRouter();
    const {isDarkColorScheme} = useColorScheme();

    return (
        <Button
            onPress={() => {
                router.navigate('/createAnnouncement');
            }}
            size="icon" className="flex flex-row gap-1 w-6 h-6">
            <PlusIcon color={isDarkColorScheme ? "black" : "white"}/>
        </Button>
    );
};

export const AnnouncementItem: React.FC<{ announcement: Announcement }> = ({announcement}) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Pressable>
                    <Card className="mx-4 mb-3">
                        <CardContent className="p-4">
                            <CardDescription className="text-sm text-muted-foreground">
                                {format(announcement.date, 'Pp')}
                            </CardDescription>
                            <CardTitle className="mt-1 text-lg font-semibold">{announcement.title}</CardTitle>
                            <CardTitle className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {announcement.description || 'No additional details available.'}
                            </CardTitle>
                        </CardContent>
                    </Card>
                </Pressable>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{announcement.title}</DialogTitle>
                    <DialogDescription>{format(announcement.date, 'Pp')}</DialogDescription>
                </DialogHeader>
                <CardDescription className="pt-2 text-sm">
                    {announcement.description || 'No description provided for this announcement.'}
                </CardDescription>
            </DialogContent>
        </Dialog>
    );

}