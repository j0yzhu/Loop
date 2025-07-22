import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { HomeService, Event } from "~/services/HomeService";
import { useRouter } from 'expo-router';
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {H2, P} from "~/components/ui/typography";
import {
    Dialog, DialogClose, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "~/components/ui/dialog";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import {PlusIcon, Search} from "lucide-react-native";
import {Input} from "~/components/ui/input";
import { useColorScheme } from "~/lib/useColorScheme";

export default function Events() {
    const [events, setevents] = useState<Event[]>([]);
    const router = useRouter();
    const [search, setSearch] = useState<string>('');
    const [showRSVPed, setShowRSVPed] = useState<boolean>(false);
    const { isDarkColorScheme } = useColorScheme();

    const fetchEvents = async () => {
        const data = await HomeService.getEvents();
        setevents(data);
    };

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [])
    );

    const handleRsvpEvent = async (eventId: number) => {
        try {
            console.log("making rsvp request");
            await HomeService.rsvpEvent(eventId);
            setevents((prevEvents) =>
                prevEvents.map((event) =>
                    event.id === eventId ? { ...event, rsvped: true } : event
                )
            );
        } catch {
            Alert.alert("You already RSVP’d for this event!");
        }
    };

    // Filter the events
    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
                              event.description.toLowerCase().includes(search.toLowerCase());
        const matchesRSVPed = showRSVPed ? event.rsvped : true;
        return matchesSearch && matchesRSVPed;
    });

    return (
        <View className="bg-background flex-1 p-4">
            <EventSearchBar search={search} onSearchChange={setSearch} showRSVPed={showRSVPed} onShowRSVPedChange={setShowRSVPed}/>
            <ScrollView>
                {filteredEvents.map(event => (
                    <View key={event.id} className="mb-4">
                        <Card className="bg-secondary px-3">
                            <View className="flex flex-row items-center justify-between">
                                <CardHeader className="flex-shrink">
                                    <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                                </CardHeader>
                                <EventRsvpButton event={event} onRsvpPressed={handleRsvpEvent} />
                            </View>
                            <CardFooter>
                                <CardDescription className="text-foreground line-clamp-2">
                                    {format(event.date, 'Pp')} @ {event.location}
                                </CardDescription>
                            </CardFooter>
                        </Card>
                    </View>
                ))}
            </ScrollView>
            <Button className="mb-4 mt-2 mx-6 flex flex-row items-center gap-2" onPress={() => router.push('/createEvent')}>
                <PlusIcon color={isDarkColorScheme ? "black" : "white"} /><P className="font-bold text-background">Create an Event</P>
            </Button>
        </View>
    );
}

export const EventRsvpButton: React.FC<{ event: Event; onRsvpPressed: (eventId: number) => void }> = ({ event, onRsvpPressed }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant={event.rsvped ? "outline" : "default"}
                >
                    <Text
                        className={`${event.rsvped ? "text-foreground" : "text-foreground"} font-bold`}>{event.rsvped ? "RSVP'd" : "View"}</Text>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>RSVP for {event.title}</DialogTitle>
                    <DialogDescription>{event.description}</DialogDescription>
                    <DialogDescription className="text-primary">
                        {format(event.date, 'Pp')} @ {event.location}
                    </DialogDescription>
                    <DialogDescription className="text-foreground font-black">
                        Do you want to RSVP for this event?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button disabled={event.rsvped} onPress={() => onRsvpPressed(event.id)}>
                            <Text>{event.rsvped ? "RSVP'd" : "RSVP"}</Text>
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface EventSearchBarProps {
    search: string;
    onSearchChange: (query: string) => void;
    showRSVPed: boolean;
    onShowRSVPedChange: (showRSVPed: boolean) => void;
}

const EventSearchBar: React.FC<EventSearchBarProps> = ({ showRSVPed, search, onSearchChange, onShowRSVPedChange }) => {
    return (
        <View className="flex flex-row gap-2 items-center pb-2">
            <Button
                className="rounded-full"
                variant={showRSVPed ? "default" : "outline"}
                onPress={() => onShowRSVPedChange(true)}
                >
                <P className="font-bold">RSVP'd</P>
            </Button>
            <Button
                className="rounded-full"
                variant={!showRSVPed ? "default" : "outline"}
                onPress={() => onShowRSVPedChange(false)}>
                <P className="font-bold">All</P>
            </Button>
            <Input
                value={search}
                onChangeText={onSearchChange}
                className="flex-1"
                placeholder="Search"
            >
            </Input>
        </View>
    )
}