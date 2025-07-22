import {TouchableOpacity, View, ScrollView, KeyboardAvoidingView, Keyboard,
    TouchableWithoutFeedback, Platform, Pressable, Alert} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import {Text} from '~/components/ui/text';
import * as ImagePicker from 'expo-image-picker';
import React, {useState, useEffect, useCallback} from 'react';
import {ArrowLeft, PencilIcon, UserIcon, UsersIcon} from 'lucide-react-native';
import {ChevronDown} from '~/lib/icons/ChevronDown';
import DateTimePicker, {DateType, useDefaultStyles} from 'react-native-ui-datepicker';
import {User, UserService} from '~/services/UserService';
import {Button} from '~/components/ui/button';
import dayjs from "dayjs";
import {Input} from "~/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {ImagePickerAsset} from "expo-image-picker";
import {Avatar, AvatarFallback, AvatarImage} from "~/components/ui/avatar";
import {LoopLogo} from "~/components/loop-logo";
import {useFocusEffect} from "@react-navigation/native";
import { useColorScheme } from "~/lib/useColorScheme";

export default function ProfileSetup() {
    const [user, setUser] = useState<User | null>(null);

    const fetchUser = async () => {
        try {
            console.log("Fetching user data...");
            const userData = await UserService.getCurrentUser();
            console.log("User data fetched:", userData);
            setUser(userData);

            setUsername(userData.username);
            setBirthday(
                userData.date_of_birth && !isNaN(Date.parse(userData.date_of_birth.toString()))
                    ? new Date(userData.date_of_birth)
                    : new Date() // fallback to today
            );

            setYearLevel(userData.year_level);
            setDegree(userData.degree);
            setPronouns(userData.pronouns);
            setGender(userData.gender);
            setNeurotypes(userData.neurotypes ?? []);
            setInterests(userData.interests ?? []);
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUser();
        }, [])
    );

    const router = useRouter();
    const params = useLocalSearchParams();
    const initialStep = params.step ? parseInt(params.step as string) : 1;
    const [step, setStep] = useState(initialStep);

    const [username, setUsername] = useState(user?.username || '');
    const [birthday, setBirthday] = useState<DateType>(user?.date_of_birth);
    const [year_level, setYearLevel] = useState(user?.year_level || '');
    const [degree, setDegree] = useState(user?.degree || '');
    const [pronouns, setPronouns] = useState(user?.pronouns || '');
    const [gender, setGender] = useState(user?.gender || '');
    const [neurotypes, setNeurotypes] = useState<string[]>(user?.neurotypes ?? []);
    const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
    //missing input
    const [usernameError, setUsernameError] = useState('');
    const [birthdayError, setBirthdayError] = useState('');
    const [yearLevelError, setYearLevelError] = useState('');
    const [genderError, setGenderError] = useState('');
    //calendar
    const defaultStyles = useDefaultStyles();

    //gender options
    const genderOptions = [
        "Male",
        "Female",
        "Non-binary",
        "Transgender",
        "Agender",
        "Other",
        "Prefer not to say",
    ];

    //pronoun options
    const yearLevelOptions = [
        "1st year",
        '2nd Year',
        "3rd Year",
        "4th Year",
        "5th year",
        "Other",
        "Prefer not to say",
    ];

    //pronoun options
    const pronounOptions = [
        "she/her",
        'he/him',
        "they/them",
        "xe/xem",
        "Other",
        "Prefer not to say",
    ];

    const [profilePicture, setProfilePicture] = useState<ImagePickerAsset | null>(null);



    function validateFields() {
        let valid = true;

        if (!username || username.trim() === '') {
            setUsernameError('Please enter a username.');
            valid = false;
        } else {
            setUsernameError('');
        }

        if (!birthday) {
            setBirthdayError('Please select your date of birth.');
            valid = false;
        } else {
            setBirthdayError('');
        }

        if (!year_level || year_level.trim() === '') {
            setYearLevelError('Please enter your year level.');
            valid = false;
        } else {
            setYearLevelError('');
        }

        if (!gender || gender.trim() === '') {
            setGenderError('Please select an option.');
            valid = false;
        } else {
            setGenderError('');
        }

        return valid;
    }

    async function handleSubmit() {
        console.log('Submitting with neurotypes:', neurotypes);
        console.log('Submitting with interests:', interests);

        const dob = dayjs(birthday).format('YYYY-MM-DD');
        const age = `${dayjs().diff(birthday, 'year')}`;

        try {
            console.log('Creating profile');
            console.log(username, dob, year_level, degree, pronouns, gender, neurotypes, interests, age);
            const response = await UserService.setup(username, dob, year_level, degree, pronouns, gender,  neurotypes,  interests, age);
            if (profilePicture) {
                await UserService.uploadProfilePicture(profilePicture);
            }
            if (!user?.username) {
                router.push('/(tabs)');
            } else {
                router.push('/profile');
            }
        } catch (error) {
            console.log(error);
        }
    }


    const deleteUser = async () => {
    try {
        await UserService.deleteCurrentUser();
    } catch (error) {
        console.error('Failed to delete user:', error);
    }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{flex: 1}}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView className="bg-background"
                            contentContainerStyle={{flexGrow: 1}}
                            keyboardShouldPersistTaps="handled">
                    <View className="flex-1 justify-center items-center px-4">
                        <Stack.Screen options={{title: 'Profile Setup'}}/>

                        {step === 1 && ( <TouchableOpacity
                        onPress={async () => {
                            if (!user?.username) {
                                // Initial setup - delete user and go back
                                await deleteUser();
                                router.back();
                            } else {
                                // Profile edit - just go back
                                router.back();
                            }
                        }}
                        className="absolute top-12 left-4 flex-row items-center"
                        >
                                <ArrowLeft size={20} className="text-foreground"/>
                                <Text className="ml-1 text-xl text-foreground">Back</Text>
                            </TouchableOpacity>
                        )}

                        {step === 2 && (
                            <TouchableOpacity onPress={() => setStep(1)}
                                            className="absolute top-12 left-4 flex-row items-center">
                                <ArrowLeft size={20} className="text-foreground"/>
                                <Text className="ml-1 text-xl text-foreground">Back</Text>
                            </TouchableOpacity>
                        )}
                        

                        <View className="relative items-center justify-center mx-auto">
                            <LoopLogo className="h-28 w-28"/>
                            <Text className="absolute top-20 text-sm text-foreground">Learners On Open Pathways</Text>
                        </View>

                        <Card className="w-full max-w-md bg-secondary">
                            <CardHeader>
                                <CardTitle className="text-foreground text-2xl text-center">Set up your profile</CardTitle>
                            </CardHeader>

                            <CardContent>
                                {step === 1 ? (
                                    <>
                                        <Text className="mb-1 text-lg text-foreground">Username: <Text
                                            className="text-red-500">*</Text></Text>
                                        <Input
                                            placeholder={usernameError ? usernameError : "Enter username"}
                                            value={username}
                                            onChangeText={text => {
                                                setUsername(text);
                                                if (text.trim() !== '') setUsernameError('');
                                            }}
                                            className="flex-1 text-foreground py-2"
                                        />

                                        <Text className="mb-1 text-lg text-foreground">
                                            Date of Birth: <Text className="text-red-500">*</Text>
                                        </Text>
                                        {birthdayError !== '' && (
                                            <Text className="text-red-500 text-sm mb-2">{birthdayError}</Text>)}

                                        {birthday !== null && (
                                            <DateTimePicker
                                                mode="single"
                                                date={birthday}
                                                maxDate={new Date()}
                                                onChange={({ date }) => setBirthday(date)}
                                                styles={defaultStyles}
                                            />
                                        )}


                                        <Text className="mb-1 text-lg text-foreground">Gender: <Text
                                            className="text-red-500">*</Text></Text>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Pressable
                                                    className="px-3 py-2 border rounded-md bg-background border-border flex-row items-center justify-between">
                                                    <Text
                                                        className="text-foreground">{gender || (genderError ? genderError : "Select gender")}</Text>
                                                    <ChevronDown size={20} className="ml-1 text-xl text-foreground"/>
                                                </Pressable>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                className="text-foreground py-2 z-50 bg-popover rounded-md border border-border">
                                                {genderOptions.map((option) => (
                                                    <DropdownMenuItem
                                                        key={option}
                                                        onPress={() => setGender(option)}
                                                        className="px-3 py-2 text-lg"
                                                    >
                                                        <Text>{option}</Text>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>


                                        <Text className="mb-1 text-lg text-foreground">Year level: <Text
                                            className="text-red-500">*</Text></Text>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Pressable
                                                    className="px-3 py-2 border rounded-md bg-background border-border flex-row items-center justify-between">
                                                    <Text
                                                        className="text-foreground">{year_level || (yearLevelError ? yearLevelError : "Select year level")}</Text>
                                                    <ChevronDown size={20} className="ml-1 text-xl text-foreground"/>
                                                </Pressable>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                className="text-foreground py-2 z-50 bg-popover rounded-md border border-border">
                                                {yearLevelOptions.map((option) => (
                                                    <DropdownMenuItem
                                                        key={option}
                                                        onPress={() => setYearLevel(option)}
                                                        className="px-3 py-2 text-lg"
                                                    >
                                                        <Text>{option}</Text>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>


                                        <Text className="mb-1 text-lg text-foreground">Degree:</Text>
                                        <Input
                                            placeholder={"e.g. LLB/BCom"}
                                            value={degree}
                                            onChangeText={value => {
                                                setDegree(value);
                                            }}
                                            className="flex-1 text-foreground py-2"
                                        />

                                        <Text className="mb-1 text-lg text-foreground">Pronouns</Text>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Pressable
                                                    className="px-3 py-2 border rounded-md bg-background border-border flex-row items-center justify-between">
                                                    <Text
                                                        className="text-foreground">{pronouns || "Select pronouns"}</Text>
                                                    <ChevronDown size={20} className="ml-1 text-xl text-foreground"/>
                                                </Pressable>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                className="text-foreground py-2 z-50 bg-popover rounded-md border border-border">
                                                {pronounOptions.map((option) => (
                                                    <DropdownMenuItem
                                                        key={option}
                                                        onPress={() => setPronouns(option)}
                                                        className="flex-1 text-foreground py-2"
                                                    >
                                                        <Text>{option}</Text>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Text></Text>

                                        <Button
                                            className="py-4 rounded-md"
                                            onPress={() => {
                                                const valid = validateFields();
                                                if (valid) {
                                                    setStep(2);
                                                }
                                            }}
                                        >
                                            <Text className="font-bold">Next</Text>
                                        </Button>
                                    </>
                                ) : (
                                    
                                    <>

                                        <UserPhoto userName={username} onImageSelected={setProfilePicture}/>

                                        <Text className="mb-1 text-lg text-foreground">My Neurotype(s)</Text>
                                        <TagInput
                                            placeholder="e.g. ADHD, Autism, etc."
                                            onTagsChange={setNeurotypes}
                                            initialTags={neurotypes}
                                        />

                                        <Text className="mb-1 text-lg text-foreground">My Interest(s)</Text>
                                        <TagInput
                                            placeholder="e.g. Music, Sports, etc."
                                            onTagsChange={setInterests}
                                            initialTags={interests}
                                        />
                                        <Button
                                            className="py-4 rounded-md"
                                            onPress={handleSubmit}
                                        >
                                            {
                                                user?.username ?
                                                    <Text className="font-bold">Save Changes</Text>
                                                    :
                                                    <Text className="font-bold">Sign Up</Text>
                                            }

                                        </Button>
                                    </>
                                )}
                            </CardContent>

                        </Card>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

interface UserPhotoProp {
    userName?: string,
    onImageSelected?: (uri: ImagePickerAsset) => void;
}

export const UserPhoto: React.FC<UserPhotoProp> = ({userName, onImageSelected}) => {
    const [profilePicture, setProfilePicture] = useState<ImagePickerAsset | null>(null);
    const { isDarkColorScheme } = useColorScheme();

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "Camera roll access is needed to upload a photo.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setProfilePicture(asset);
            if (onImageSelected) onImageSelected(asset);
        }
    };

    return (
        <View className="mx-auto">
            <Pressable onPress={pickImage} className="flex flex-row h-20 w-20 justify-center gap-0.5 relative mb-4">

                <Avatar alt="User Profile Picture" className="h-20 w-20">
                    {profilePicture ? (
                        <AvatarImage source={{uri: profilePicture.uri}}/>
                    ) : (
                        <AvatarFallback>
                            <UserIcon color={isDarkColorScheme ? "white" : "black"} />
                        </AvatarFallback>
                    )}
                </Avatar>
                <View className="absolute right-0 bottom-0 bg-primary p-2 opacity-60 rounded-full">
                    <PencilIcon className="absolute right-0 bottom-0" size={12}/>
                </View>
            </Pressable>
        </View>

    );
};

interface TagInputProps {
    placeholder: string;
    onTagsChange?: (tags: string[]) => void;
    initialTags?: string[];
}

export function TagInput({placeholder, onTagsChange, initialTags = []}: TagInputProps) {
    const [tags, setTags] = useState<string[]>(initialTags);
    const [text, setText] = useState('');

    useEffect(() => {
        setTags(initialTags);
    }, [initialTags]);

    const handleChange = (val: string) => {
        if (val.includes(',')) {
            const raw = val.replace(',', '').trim()
            if (raw) {
                if (tags.includes(raw)) {
                    setText('');
                    return;
                }
                const updated = [...tags, raw];
                setTags(updated);
                onTagsChange?.(updated);
            }
            setText('');
        } else {
            setText(val);
        }
    };

    const removeTag = (idx: number) => {
        console.log('Removing tag at index:', idx, 'Tag:', tags[idx]);
        const updated = tags.filter((_, i) => i !== idx);
        console.log('Updated tags:', updated);
        setTags(updated);
        onTagsChange?.(updated);
    };

    return (
        <View className="mb-4">
            <View className="flex-row flex-wrap mb-2">
                {tags.map((tag, i) => (
                    <View
                        key={i}
                        className="flex-row items-center bg-gray-200 rounded-full px-3 py-1 mr-2 mb-2"
                    >
                        <Text className="text-gray-800">{tag}</Text>
                        
                        <TouchableOpacity onPress={() => removeTag(i)}>
                            <Text className="ml-1 text-gray-500">×</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
            <Input
                className="border border-gray-400 rounded px-2 py-1 text-foreground"
                placeholder={placeholder}
                value={text}
                onChangeText={handleChange}
                autoCorrect={false}
                autoCapitalize="none"
                onEndEditing={() => {
                    if (text.trim()) {
                        handleChange(text + ',');
                    }
                }}
                onSubmitEditing={() => {
                    if (text.trim()) {
                        handleChange(text + ',');
                    }
                }}
            />
        </View>
    );
}


