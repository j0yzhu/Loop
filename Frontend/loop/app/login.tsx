import {
    Image, Keyboard,
    KeyboardAvoidingView, Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useRouter, Stack } from 'expo-router';
import { Text } from '~/components/ui/text';
import { Checkbox } from '~/components/ui/checkbox';
import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft} from 'lucide-react-native';
import {UserService} from "~/services/UserService";
import * as SecureStore from "expo-secure-store";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue} from "~/components/ui/select";
import {Input} from "~/components/ui/input";
import {LoopLogo} from "~/components/loop-logo";

export default function Login() {
    const router = useRouter();
    const [upi, setUpi] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string | undefined>("@aucklanduni.ac.nz");
    const [rememberMe, setRememberMe] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [upiError, setUpiError] = useState('');

    async function onSignInPress() {
        const fullEmail = `${upi}${selectedDomain}`;
        let valid = true;

        if (!upi) {
            setUpiError('UPI required.');
            valid = false;
        } else if (!selectedDomain) {
            setUpiError('Please select a domain.');
            valid = false;
        } else {
            setUpiError('');
        }

        if (!password) {
            setPasswordError('Password required.');
            valid = false;
        } else {
            setPasswordError('');
        }

        if (!valid) return;

        try {
            console.log('Logging in');
            const response = await UserService.login(fullEmail, password);
            await SecureStore.setItemAsync('access_token', response.access_token);
            router.push('/(tabs)');
        } catch (error) {
            // @ts-ignore
            if (error?.message && error.message.includes('Incorrect email/password')) {
                setErrorMessage('Incorrect email or password. Please try again.');
            } else {
                // @ts-ignore
                setErrorMessage(error?.message);
            }
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
        <View className="flex-1 justify-center items-center px-4 bg-background">
            <Stack.Screen options={{ title: 'Login' }} />

            <View className="relative items-center justify-center mx-auto">
                <LoopLogo className="h-28 w-28"/>
                <Text className="absolute top-20 text-sm text-foreground">Learners On Open Pathways</Text>
            </View>

            <Card className="w-full max-w-md bg-secondary">
                <CardHeader>
                    <CardTitle className="text-foreground text-2xl text-center">Login into Loop</CardTitle>
                </CardHeader>

                <CardContent>
                    <Text className="mb-1 text-xl text-foreground">UoA Email: <Text
                        className="text-red-500">*</Text></Text>
                    <Text className="mb-1 text-lg text-foreground">Select staff or student email</Text>
                    <View className="flex flex-row gap-2">
                        <Input
                            placeholder={upiError ? upiError : "Enter Upi"}
                            placeholderTextColor={upiError ? "#ff0000" : "#ffffff"}
                            value={upi}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={text => {
                                setUpi(text);
                                if (text.trim() !== '') setUpiError('');
                            }}
                            className="flex-1 text-foreground py-2"
                        />
                        <Select onValueChange={(option) => setSelectedDomain(option?.value)}
                                value={{value: selectedDomain!, label: selectedDomain!}}>
                            <SelectTrigger className="min-w-[120px] border-none">
                                <SelectValue className="text-foreground" placeholder="Select domain"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem label="@aucklanduni.ac.nz"
                                            value="@aucklanduni.ac.nz">aucklanduni.ac.nz</SelectItem>
                                <SelectItem label="@auckland.ac.nz"
                                            value="@auckland.ac.nz">auckland.ac.nz</SelectItem>
                            </SelectContent>
                        </Select>
                    </View>

                    <Text className="mb-1 text-lg text-foreground">Password: <Text
                        className="text-red-500">*</Text></Text>
                    <View className="flex-row items-center border border-gray-600 bg-background rounded-md mb-2 px-3">
                        <Input
                            placeholder={passwordError ? passwordError : "Enter Password"}
                            placeholderTextColor={passwordError ? "#ff0000" : "#ffffff"}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={text => {
                                setPassword(text);
                                if (text.trim() !== '') setPasswordError('');
                            }}
                            className="flex-1 text-foreground py-2 border-0"
                        />

                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={20} color="grey"/> :
                                <Eye size={20} color="grey"/>}
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center mb-4 gap-2">
                        <Checkbox checked={rememberMe} onCheckedChange={setRememberMe} />
                        <Text className="text-lg">Remember me?</Text>
                    </View>

                    {errorMessage ? (
                        <Text className="text-center text-red-500 mt-2">{errorMessage}</Text>
                    ) : null}

                    <Button
                        className="py-4 rounded-md"
                        onPress={onSignInPress}
                    >
                        <Text className="font-bold">Sign in</Text>
                    </Button>
                </CardContent>
            </Card>

            <Text className="text-foreground text-lg mt-4">Don't have an account?</Text>
            <Button
                    variant={"link"}
                    onPress={() => router.push('/register')}>
                <Text className="underline">Sign Up Here</Text>
            </Button>
        </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}