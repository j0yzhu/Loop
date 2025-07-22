import React, {useState} from "react";
import {Button} from "~/components/ui/button";
import {
    View,
    Alert,
    SafeAreaView,
    ScrollView,
    Pressable,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback, Text
} from "react-native";
import {Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription} from "~/components/ui/card";
import {Input} from "~/components/ui/input";
import {useRouter} from 'expo-router';
import {HomeService} from "~/services/HomeService";
import DateTimePicker, {DateType, useDefaultStyles} from 'react-native-ui-datepicker';
import {H2, P} from "~/components/ui/typography";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import dayjs from 'dayjs';

export default function CreateEvent() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={{flex: 1, paddingTop: insets.top}}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1}}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View>
                        <CreatingEventCard/>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const CreatingEventCard = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const today = new Date();
    const [selected, setSelected] = useState<DateType>();

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim() || !location.trim() || !selected) {
            Alert.alert("Error", "Fill out all details");
            return;
        }
        try {
            setLoading(true);
            const result = await HomeService.createEvent(
                title,
                description,
                location,
                dayjs(selected).format('YYYY-MM-DDTHH:mm:ss')
            )

            Alert.alert("Success", "Event created successfully");
            router.back();
        } catch (error) {
            console.error("Error creating event:", error);
            Alert.alert("Error", "Failed to create event. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const handleDatePress = (date: DateType) => {
        console.log(date);
        setSelected(date);
    }

    return (
        <ScrollView>
            <Card className="p-4 m-4 bg-secondary rounded-2xl shadow-md">
                <CardHeader>
                    <CardTitle>Create Event</CardTitle>
                    <CardDescription>Fill in the details below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CardDescription>Give the Event a title <Text className="text-red-500 ">*</Text></CardDescription>
                    <Input
                        placeholder="Event Title"
                        value={title}
                        onChangeText={setTitle}
                        className="border p-2 mb-3 rounded"
                    />
                    <CardDescription>Purpose of this Event <Text className="text-red-500 ">*</Text></CardDescription>
                    <Input
                        placeholder="Description"
                        value={description}
                        onChangeText={setDescription}
                        className="border p-2 mb-3 rounded"
                        multiline
                    />
                    <CardDescription>Location of Event <Text className="text-red-500 ">*</Text></CardDescription>
                    <Input
                        placeholder="Location"
                        value={location}
                        onChangeText={setLocation}
                        className="border p-2 mb-3 rounded"
                        multiline
                    />
                    <CardDescription>Date of this Event <Text className="text-red-500 ">*</Text></CardDescription>
                    <Pressable>
                        <DateTimePicker
                            mode="single"
                            timePicker={true}
                            date={selected}
                            onChange={({date}) => handleDatePress(date)}
                            minDate={today} // Set the minimum selectable date to today
                            styles={useDefaultStyles()}
                        />
                    </Pressable>
                </CardContent>
                <CardFooter className="justify-center flex-col gap-2">
                    <Button onPress={handleSubmit} disabled={loading}>
                        <P className="text-background">
                            {loading ? "Creating..." : "Create Event"}
                        </P>
                    </Button>
                </CardFooter>
            </Card>
        </ScrollView>
    );
}