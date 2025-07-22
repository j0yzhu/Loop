import React, { useState, useEffect } from "react";
import { useRouter } from 'expo-router';
import {View, Alert, SafeAreaView, ScrollView, Text, Touchable, Pressable, Keyboard,
    KeyboardAvoidingView, Platform, TouchableWithoutFeedback} from "react-native";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Category, Community, CommunityService } from "~/services/CommunityService";
import {H4, P} from "~/components/ui/typography";
import { Input } from "~/components/ui/input";
import * as ImagePicker from 'expo-image-picker';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "~/components/ui/dialog";
import {PencilIcon, TagsIcon, UsersIcon, XIcon} from "lucide-react-native";
import {Separator} from "~/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {ImagePickerAsset} from "expo-image-picker";

export default function CreateCommunity() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={{flex: 1, paddingTop: insets.top}}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1}}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView className="bg-background"
                                contentContainerStyle={{flexGrow: 1}}
                                keyboardShouldPersistTaps="handled"
                    >
                        <View className="mt-2 flex flex-col gap-10">
                            <CreatingCommunityCard/>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const CreatingCommunityCard = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
    const [thumbnail, setThumbnail] = useState<ImagePickerAsset | null>(null);
    const router = useRouter();


    useEffect(() => {
        const getCategories = async () => {
            setCategories(await CommunityService.getCategories());
        }
        getCategories();
    }, []);

    const toggleSelectCategory = (category: Category) => {
        console.log("Pressed")
        const isAlreadySelected = selectedCategories.some((c) => c.id === category.id);
        let updatedSelected: Category[];

        if (isAlreadySelected) {
            // Deselect category
            console.log("Deselecting", category.subtopic)
            updatedSelected = selectedCategories.filter((c) => c.id !== category.id);
        } else {
            // Select category
            console.log("Selecting", category.subtopic)
            updatedSelected = [...selectedCategories, category];
        }

        setSelectedCategories(updatedSelected)
    };

    const handleSubmit = async () => {
        if (!name.trim() || !description.trim() || selectedCategories.length === 0) {
            Alert.alert("Error", "Fill out all details");
            return;
        }
        try {
            setLoading(true);
            const result = await CommunityService.createCommunity(
                name,
                description,
                selectedCategories.map((category) => category.id)
            )
            const id = result.community_id;

            if (thumbnail) {
                await CommunityService.uploadCommunityPicture(id, thumbnail)
            }

            Alert.alert("Success", "Community created successfully");
            router.back();
        }
        catch (error) {
            console.error("Error creating community:", error);
            Alert.alert("Error", "Failed to create community. Please try again.");
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <Card className="p-4 m-4 bg-secondary rounded-2xl shadow-md">
            <CardHeader>
                <CardTitle>Create Community</CardTitle>
                <CardDescription>Fill in the details below.</CardDescription>
            </CardHeader>
            <CardContent>
                <CommunityPhoto communityName={name} onImageSelected={setThumbnail}/>
                <CardDescription>Give the Community a Name <Text className="text-red-500 ">*</Text></CardDescription>
                <Input
                    placeholder="Community Name"
                    value={name}
                    onChangeText={setName}
                    className="border p-2 mb-3 rounded"
                />
                <CardDescription>Purpose of this Community <Text className="text-red-500 ">*</Text></CardDescription>
                <Input
                    placeholder="Description"
                    value={description}
                    onChangeText={setDescription}
                    className="border p-2 mb-3 rounded"
                    multiline
                />
                <CardDescription>Community Categories <Text className="text-red-500 ">*</Text></CardDescription>
                <CategorySelectDialog
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onSelectedCategoriesChange={setSelectedCategories}
                />
                <View className="flex flex-row flex-wrap gap-1 mt-2">
                    {selectedCategories.map((category: Category, index: number) => (
                        <Button key={category.id} size="xs"
                                className="flex flex-row gap-1"
                                onPress={() => toggleSelectCategory(category)}
                        >
                            <Text>{category.subtopic} <XIcon className="color-background" size="15"/></Text>
                        </Button>
                    ))}
                </View>
            </CardContent>
            <CardFooter className="justify-center flex-col gap-2">
                <Button onPress={handleSubmit} disabled={loading}>
                    <P className="text-background">
                        {loading ? "Creating..." : "Create Community"}
                    </P>
                </Button>

            </CardFooter>
        </Card>
    );
}

interface CategorySelectDialogProps {
    categories: Category[]
    selectedCategories: Category[];
    onSelectedCategoriesChange: (selectedCategories: Category[]) => void;
}

const CategorySelectDialog: React.FC<CategorySelectDialogProps> = (props) => {
    const groupedCategories = props.categories.reduce<Record<string, Category[]>>((acc, category) => {
        const topic = category.topic || "Other";
        if (!acc[topic]) acc[topic] = [];
        acc[topic].push(category);
        return acc;
    }, {});

    const isSelected = (categoryId: number): boolean => {
        return props.selectedCategories.some((c) => c.id === categoryId);
    }

    const toggleSelectCategory = (category: Category) => {
        console.log("Pressed")
        const isAlreadySelected = props.selectedCategories.some((c) => c.id === category.id);
        let updatedSelected: Category[];

        if (isAlreadySelected) {
            // Deselect category
            console.log("Deselecting", category.subtopic)
            updatedSelected = props.selectedCategories.filter((c) => c.id !== category.id);
        } else {
            // Select category
            console.log("Selecting", category.subtopic)
            updatedSelected = [...props.selectedCategories, category];
        }

        props.onSelectedCategoriesChange(updatedSelected);
    };


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="items-center flex-row gap-2"
                >
                    <Text>
                        Select Categories
                    </Text>
                    <TagsIcon/>
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px] m-2'>
                <DialogHeader>
                    <DialogTitle>
                        <Text>Categories</Text>
                    </DialogTitle>
                    <DialogDescription>
                        <Text>Select your categories</Text>
                    </DialogDescription>

                </DialogHeader>
                <ScrollView
                    className="max-h-[300px]"
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={true}
                    indicatorStyle="white"
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    {Object.entries(groupedCategories).map(([topic, group], index) => (
                        <View key={`outer-${index}`} className="w-full">
                            <H4 className="mb-1 text-lg">{topic}</H4>
                            <View key={`inner-${index}`} className="flex flex-row flex-wrap gap-2">
                                {group.map((category) => {
                                    return (
                                        <Button key={category.id} size="xs" onPress={() => toggleSelectCategory(category)} variant={isSelected(category.id) ? "default" : "outline"}>
                                            <Text className={isSelected(category.id) ? "text-background" : "text-foreground"}>{category.subtopic}</Text>
                                        </Button>
                                    );
                                })}
                            </View>
                            <Separator className="my-4"/>
                        </View>
                    ))}
                </ScrollView>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button>
                            <Text>OK</Text>
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface CommunityPhotoProps {
    communityName?: string,
    onImageSelected?: (uri: ImagePickerAsset) => void;
}
export const CommunityPhoto: React.FC<CommunityPhotoProps> = ({ communityName, onImageSelected }) => {
    const [Thumbnail, setThumbnail] = useState<ImagePickerAsset | null>(null);

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
            setThumbnail(asset);
            if (onImageSelected) onImageSelected(asset);
        }
    };

    return (
        <View className="mx-auto">
            <Pressable onPress={pickImage} className="flex flex-row h-20 w-20 justify-center gap-0.5 relative mb-4">

                <Avatar alt="Community Thumbnail" className="h-20 w-20">
                    {Thumbnail ? (
                        <AvatarImage source={{ uri: Thumbnail.uri }} />
                    ) : (
                        <AvatarFallback>
                            <UsersIcon />
                        </AvatarFallback>
                    )}
                </Avatar>
                <View className="absolute right-0 bottom-0 bg-primary p-2 opacity-60 rounded-full">
                    <PencilIcon className="absolute right-0 bottom-0" size={12} />
                </View>
            </Pressable>
        </View>

    );
};
