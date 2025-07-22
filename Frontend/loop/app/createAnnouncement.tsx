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
import {Announcement, HomeService} from "~/services/HomeService";
import DateTimePicker, {DateType, useDefaultStyles} from 'react-native-ui-datepicker';
import {H2, P} from "~/components/ui/typography";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import dayjs from 'dayjs';
//import {Textarea} from "~/components/ui/textarea"; GRACE COMMENTED OUT BECAUSE THE TSX FILE DOES NOT EXIST


export default function CreateAnnouncement() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={{flex: 1, paddingTop: insets.top}} className="bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1}}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="bg-background">
                        <CreateAnnouncementCard/>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const CreateAnnouncementCard = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);


    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            return Alert.alert('Error', 'Please fill out all fields.');
        }
        try {
            setLoading(true);
            const created = await HomeService.createAnnouncements(title, description);
            Alert.alert('Success', 'Announcement created.');
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not create announcement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="bg-background">
            <Card className="p-4 m-4 bg-secondary rounded-2xl shadow-md">
                <CardHeader>
                    <CardTitle>Create Announcement</CardTitle>
                    <CardDescription>Fill in the details below.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <CardDescription>Give the Announcement a title <Text className="text-red-500 ">*</Text></CardDescription>
                    <Input
                        placeholder="Title"
                        value={title}
                        onChangeText={setTitle} />
                    <CardDescription>Purpose of this Announcement <Text className="text-red-500 ">*</Text></CardDescription>
                    <Input
                        placeholder="Description"
                        value={description}
                        onChangeText={setDescription}
                    />
                </CardContent>
                <CardFooter className="justify-center flex-col gap-2">
                    <Button onPress={handleSubmit} disabled={loading}>
                        <P className="text-background">
                            {loading ? "Creating..." : "Create Announcement"}
                        </P>
                    </Button>
                </CardFooter>
            </Card>
        </ScrollView>
    );
}