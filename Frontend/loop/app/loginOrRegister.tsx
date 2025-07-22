import { Image, ScrollView, View } from 'react-native';
import { ScreenContent } from '~/components/ScreenContent';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useRouter, Stack } from 'expo-router';
import {LoopLogo} from "~/components/loop-logo";
import React from "react";

export default function LoginOrRegister() {
    const router = useRouter();

    return (
        <>
            <View className="flex-1 bg-background">
                <ScrollView>
                    <View className="relative top-24 items-center justify-center">
                        <View className="items-center justify-center mx-auto">
                            <LoopLogo/>
                            <Text className="absolute top-24 text-xl text-foreground">Learners On Open Pathways</Text>
                        </View>

                        <View className="items-center px-6 py-12 space-y-8">
                            <Text className="text-2xl font-bold text-center leading-relaxed">
                                Get Yourself in the{"\n"}Loop Today
                            </Text>

                            <Text className="italic text-l text-muted-foreground text-center">
                                Connect, chat, and learn.
                            </Text>
                        </View>
                    </View>

                    {/* Register Section */}
                    <View className="px-6 py-12">
                        <View className="w-full items-center space-y-3 pt-20">
                            <Text className="text-center text-foreground text-lg">Don't have an account?</Text>
                            <Button
                                size="xl"
                                variant="default"
                                className="w-full justify-center"
                                onPress={() => router.push('/register')}
                            >
                                <UoALogo/>
                                <Text className="font-bold">Register</Text>
                            </Button>

                            <Text className="text-center text-l text-foreground">
                                Register using your UoA Email
                            </Text>
                        </View>

                        {/* Sign in Section */}
                        <View className="w-full items-center space-y-3 pt-10">
                            <Text className="text-center text-l text-foreground">Already have an account?</Text>
                            <Button
                                size="xl"
                                className="w-full justify-center"
                                onPress={() => router.push('/login')}
                            >
                                <UoALogo/>
                                <Text className="font-bold text-background">Sign in</Text>
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}

const UoALogo = () => {
    return (
        <Image
            source={require('~/assets/UoAlogo.png')}
            className="h-10 w-10 absolute left-6"
            resizeMode="contain"
        />
    )
}
