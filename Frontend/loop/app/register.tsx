import {
    Keyboard, KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import {useRouter, Stack} from 'expo-router';
import {Text} from '~/components/ui/text';
import {Checkbox} from '~/components/ui/checkbox';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '~/components/ui/dialog';
import React, {useState} from 'react';
import {Eye, EyeOff, ArrowLeft} from 'lucide-react-native';
import {UserService} from "~/services/UserService";
import * as SecureStore from "expo-secure-store";
import {Select, SelectTrigger, SelectContent, SelectItem, SelectValue} from "~/components/ui/select";
import {Input} from "~/components/ui/input";
import {LoopLogo} from "~/components/loop-logo";
import {useColorScheme} from "~/lib/useColorScheme";

export default function Register() {
    const router = useRouter();
    const { isDarkColorScheme } = useColorScheme();

    const [upi, setUpi] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string | undefined>("@aucklanduni.ac.nz");
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [tsAndCs, setTsAndCs] = useState(false);

    // missing input error
    const [firstnameError, setFirstnameError] = useState('');
    const [lastnameError, setLastnameError] = useState('');
    const [upiError, setUpiError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [tsAndCsError, setTsAndCsError] = useState('');

    //terms and conditions dialog
    const [openTerms, setOpenTerms] = useState(false);
    const [openPrivacy, setOpenPrivacy] = useState(false);

    async function onSignUpPress() {
        const fullEmail = `${upi}${selectedDomain}`;
        let valid = true;

        if (!firstname.trim()) {
            setFirstnameError('Firstname required.');
            valid = false;
        } else {
            setFirstnameError('');
        }

        if (!lastname.trim()) {
            setLastnameError('Lastname required.');
            valid = false;
        } else {
            setLastnameError('');
        }

        if (!upi) {
            setUpiError('Enter UPI.');
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

        if (!confirmPassword) {
            setConfirmPasswordError('Please confirm your password.');
            valid = false;
        } else if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match.');
            setConfirmPassword('');
            valid = false;
        } else {
            setConfirmPasswordError('');
        }

        if (!tsAndCs) {
            setTsAndCsError('Please accept the terms and conditions to proceed.');
            valid = false;
        }

        if (!valid) return;

        try {
            console.log('Signing up');
            const response = await UserService.register(fullEmail, password, firstname, lastname);
            await SecureStore.setItemAsync("access_token", response.access_token);
            router.push('/profileSetup');
        } catch (error) {
            // @ts-ignore
            console.log(error.message);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{flex: 1}}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView className="bg-background"
                    contentContainerStyle={{flexGrow: 1}}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 justify-center items-center px-4">
                        <Stack.Screen options={{title: 'Register'}}/>

                        <TouchableOpacity onPress={() => router.back()}
                                          className="absolute top-12 left-4 flex-row items-center">
                            <ArrowLeft color={isDarkColorScheme ? "white" : "black"}/>
                            <Text className="ml-1 text-xl text-foreground">Back</Text>
                        </TouchableOpacity>

                        <View className="relative items-center justify-center mx-auto">
                            <LoopLogo className="h-28 w-28"/>
                            <Text className="absolute top-20 text-sm text-foreground">Learners On Open Pathways</Text>
                        </View>

                        <Card className="w-full max-w-md bg-secondary">
                            <CardHeader>
                                <CardTitle className="text-foreground text-2xl text-center">Register</CardTitle>
                            </CardHeader>

                            <CardContent>
                                <Text className="mb-1 text-lg text-foreground">Firstname: <Text
                                    className="text-red-500">*</Text></Text>
                                    <Input
                                        placeholder={firstnameError ? firstnameError : "Enter Firstname"}
                                        value={firstname}
                                        onChangeText={text => {
                                            setFirstname(text);
                                            if (text.trim() !== '') setFirstnameError('');
                                        }}
                                        className="flex-1 text-foreground py-2"
                                    />

                                <Text className="mb-1 text-lg text-foreground">Lastname: <Text
                                    className="text-red-500">*</Text></Text>
                                    <Input
                                        placeholder={lastnameError ? lastnameError : "Enter Lastname"}
                                        value={lastname}
                                        onChangeText={text => {
                                            setLastname(text);
                                            if (text.trim() !== '') setLastnameError('');
                                        }}
                                        className="flex-1 text-foreground py-2"
                                    />

                                <Text className="mb-1 text-lg text-foreground">UoA Email: <Text
                                    className="text-red-500">*</Text></Text>
                                <Text className="mb-1 text-sm text-foreground">Select staff or student email</Text>
                                <View className="flex flex-row gap-2">
                                    <Input
                                        placeholder={upiError ? upiError : "Enter Upi"}
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

                                <Text className="mb-1 text-lg text-foreground">Confirm password: <Text
                                    className="text-red-500">*</Text></Text>
                                <View
                                    className="flex-row items-center border border-gray-600 rounded-md mb-4 px-3 bg-background ${confirmPasswordError ? 'border-red-500' : 'border-gray-600'}">
                                    <Input
                                        placeholder={confirmPasswordError ? confirmPasswordError : "Confirm your password"}
                                        secureTextEntry={!showConfirmPassword}
                                        value={confirmPassword}
                                        onChangeText={text => {
                                            setConfirmPassword(text);
                                            if (text === password) setConfirmPasswordError('');
                                        }}
                                        className="flex-1 text-foreground py-2 border-0"
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? (
                                            <EyeOff size={20} color="grey"/>
                                        ) : (
                                            <Eye size={20} color="grey"/>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row items-center mb-4 gap-2">
                                    <Checkbox checked={rememberMe} onCheckedChange={setRememberMe}/>
                                    <Text className="text-lg text-foreground">Remember me?</Text>
                                </View>

                                <View className="flex-row items-center mb-4 gap-2">
                                    <Checkbox checked={tsAndCs} onCheckedChange={setTsAndCs}/>
                                    <Text className="text-md text-foreground">
                                        I agree to Loop's{' '}
                                        <Text onPress={() => setOpenTerms(true)}
                                              className="text-blue-600 underline text-md">
                                            Terms and Conditions
                                        </Text>{' '}
                                        &{' '}
                                        <Text onPress={() => setOpenPrivacy(true)}
                                              className="text-blue-600 underline text-md">
                                            Privacy Statement
                                        </Text>
                                    </Text>

                                <Dialog open={openTerms} onOpenChange={setOpenTerms}>
                                    <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle><Text className="text-foreground text-2xl">Terms and Conditions</Text></DialogTitle>
                                    </DialogHeader>
                                    <ScrollView
                                        className="bg-background"
                                        style={{ maxHeight: 450 }}
                                        contentContainerStyle={{flexGrow: 1}}
                                        showsVerticalScrollIndicator={true}
                                        >
                                        <DialogDescription>
                                        <Text className="text-lg text-foreground">
                                        Welcome to Loop, a social media platform designed to support and connect neurodiverse students at the University of Auckland (“the University”). By creating an account or using Loop (“the App”), you agree to these Terms and Conditions (“Terms”). If you do not agree, please do not use the App.
                                        {"\n"}{"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">1. Eligibility{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        Loop is intended solely for currently enrolled neurodiverse students at the University of Auckland. You must have an active University of Auckland email address to register and use this platform.
                                        {"\n"}{"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">2. User Conduct{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        You agree to use Loop in accordance with University of Auckland policies, especially those regarding bullying, harassment, and discrimination.
                                        {"\n"}{"\n"}
                                        You agree not to:
                                        Engage in bullying, harassment, discrimination, or victimisation of any kind;

                                        Post or share content that is hateful, harmful, false, misleading, or infringes on the rights of others;

                                        Misrepresent your identity or affiliations;

                                        Impersonate another individual or entity;

                                        Violate the privacy or confidentiality of others;

                                        Upload viruses, malware, or attempt to interfere with the App’s functionality.
                                        {"\n"}{"\n"}
                                        All interactions must uphold the values of manaakitanga, dignity, inclusivity, and respect, in alignment with the University's commitment to a safe and equitable community.
                                        {"\n"}{"\n"}
                                        </Text>

                                       <Text className="text-foreground text-2xl">3. Content Ownership and Moderation{"\n"}</Text>
                                       <Text className="text-lg text-foreground">
                                        You retain ownership of any content you post but grant Loop a non-exclusive, royalty-free license to use, display, and distribute your content within the App.

                                        The Loop moderation team may remove content or suspend accounts that breach these Terms or University policies.

                                        Repeated or serious violations may result in disciplinary action in line with University procedures and referral to University authorities.

                                        {"\n"}{"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">4. Privacy and Data Use{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        Loop will collect and process data in accordance with the Privacy Act 2020 and University of Auckland guidelines.

                                        Your personal data, including profile information and app activity, will be kept confidential except as required to comply with legal obligations or University investigations.

                                        You have the right to access, correct, or request deletion of your personal information at any time.
                                        {"\n"}{"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">5. Confidentiality{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        All parties are expected to maintain the confidentiality of sensitive matters discussed or disclosed through the App.

                                        Confidentiality does not mean secrecy: necessary disclosures may be made to University staff or authorities to protect user welfare or investigate complaints.

                                        Users should avoid sharing identifying information about others without consent.
                                        {"\n"}{"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">6. Reporting and Resolution{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        Loop encourages respectful and direct communication, but also provides mechanisms for formal complaint resolution:

                                        Users may report inappropriate behavior through the App or by contacting the University’s Proctor or Student Support Services.

                                        Reports will be handled in accordance with the Student Discipline Statute and University harassment and discrimination policies.

                                        False or malicious complaints may be subject to disciplinary action.
                                        {"\n"}{"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">7. Account Termination{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        We reserve the right to suspend or terminate your access to Loop if you:

                                        Breach these Terms or University policy;

                                        Use the App for purposes not aligned with its mission;

                                        Compromise the safety or wellbeing of other users.
                                        {"\n"}{"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">8. Limitation of Liability{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        Loop is provided “as is” and “as available” without warranties of any kind. To the fullest extent allowed by law, under no circumstances shall the University of Auckland, Loop, its developers, employees, officers, agents, or contractors be liable for any direct, indirect, incidental, special, punitive, or consequential damages arising from or relating to:

                                        Your use of or inability to use the App;

                                        Unauthorized access to or alteration of your transmissions or data;

                                        Statements or conduct of any third party or user on the App;

                                        Any interaction or meeting with other users of the App, whether online or in person.
                                        
                                        The University and Loop are not responsible or liable for any acts, omissions, or content posted by users, including offensive, inappropriate, or unlawful material. Loop may contain links or integrations with third-party platforms or services. The University and Loop do not control and are not responsible for these third parties, including their content, privacy practices, or functionality.

                                        {"\n"}{"\n"}
                                        </Text>
                                        
                                        <Text className="text-foreground text-2xl">9. Modifications to Terms{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        We reserve the right to update these Terms from time to time. You will be notified of any significant changes. Continued use of the App after changes are posted constitutes acceptance of the revised Terms.
                                        {"\n"}{"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">10. Governing Law{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        These Terms are governed by the laws of New Zealand. Any disputes will be resolved under University procedures or, if necessary, through the New Zealand legal system.
                                        {"\n"}{"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">11. Contact{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        For questions, support, or to report a violation, contact:{"\n"}
                                        inclusivelearning@auckland.ac.nz
                                        {"\n"}
                                        </Text>
                                        </DialogDescription>
                                        </ScrollView>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={openPrivacy} onOpenChange={setOpenPrivacy}>
                                    <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle><Text className="text-foreground text-2xl">Privacy Statement</Text></DialogTitle>
                                    </DialogHeader>
                                        <ScrollView
                                        className="bg-background"
                                        style={{ maxHeight: 450 }}
                                        contentContainerStyle={{flexGrow: 1}}
                                        persistentScrollbar={true}
                                        showsVerticalScrollIndicator={true}
                                        >
                                        <DialogDescription>
                                        <Text className="text-lg text-foreground">
                                        The Loop app is committed to protecting your privacy in accordance with the University of Auckland’s Privacy Framework and the Privacy Act 2020. This Privacy Statement explains how we collect, use, disclose, and protect your personal information when you engage with the app.
                                        {"\n"}
                                        {"\n"}
                                        </Text>
                                        <Text className="text-foreground text-2xl">1. Collection of Personal Information{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        When you use Loop, we may collect information such as your name, University email address, student ID or UPI, preferences for communities, and interactions within the app. We may also collect technical information like your device type or IP address to help us improve the app’s performance. Wherever possible, Loop offers you the option to engage with content anonymously or under a pseudonym.
                                        {"\n"}
                                        {"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">2. Purpose and Use{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        Your personal information is collected solely for purposes that support the operation, improvement, and safe use of the app. This includes personalising your experience, managing content moderation, understanding usage trends, and ensuring compliance with University policy and New Zealand law. Any use of your data outside of these purposes will require your explicit consent or be supported by a lawful exception.
                                        {"\n"}
                                        {"\n"}
                                        <Text className="text-foreground text-2xl">3. Disclosure and Sharing{"\n"}</Text>

                                        <Text className="text-lg text-foreground">
                                        We do not disclose your personal information to third parties unless it is necessary for service delivery and those parties are contractually obligated to protect your data. In some cases, such as legal obligations or the management of a privacy breach, information may be shared in line with University procedures and the Privacy Act 2020.
                                        {"\n"}
                                        {"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">4. Access and Correction{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        You have the right to request access to your personal information and ask for it to be corrected if you believe it is inaccurate. Requests can be made through the University’s Privacy Officer and will be handled in accordance with the University’s Personal Information Request Procedures.
                                        {"\n"}
                                        {"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">5. Security and Retention{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        We take reasonable steps to protect your personal information from unauthorised access, modification, or loss. Your data is only retained for as long as necessary to fulfil the purposes for which it was collected, and is securely deleted or anonymised when no longer needed, in accordance with the University’s General Disposal Authority.
                                        {"\n"}
                                        {"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">6. Use of Unique Identifiers{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        Loop may use your student ID or UPI for identification and internal management purposes. We do not use or require unique identifiers from other agencies unless legally justified and necessary for specific interactions (e.g., communication with government agencies). Where used, these identifiers are handled with care to prevent misuse.
                                        {"\n"}
                                        {"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">7. Privacy by Design{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        The Loop app has been developed with a strong focus on privacy by design. This means we embed privacy protections into the design and operation of our systems and processes from the outset. We are proactive about managing privacy risks and committed to transparency, security, and respect for user privacy.
                                        {"\n"}
                                        {"\n"}
                                        </Text>

                                        <Text className="text-foreground text-2xl">8. Questions or Concerns{"\n"}</Text>
                                        <Text className="text-lg text-foreground">
                                        If you have any concerns about how your information is being handled or wish to make a request under the Privacy Act, you can contact the University of Auckland’s Privacy Officer at: 
                                        privacy@auckland.ac.nz
                                        {"\n"}
                                        {"\n"}
                                        </Text>

                                        </Text>
                                        </DialogDescription>
                                        </ScrollView>
                                    </DialogContent>
                                </Dialog>
                                </View>

                                <Text className="text-red-500 mb-2">{tsAndCsError}</Text>

                                <Button
                                    className="py-4 rounded-md"
                                    onPress={onSignUpPress}
                                    >
                                    <Text className="font-bold">Sign up</Text>
                                </Button>
                            </CardContent>
                        </Card>
                        <Text className="text-foreground">
                            Already have an account?</Text>
                        <Button
                            variant={"link"}
                            onPress={() => router.push('/login')}>
                            <Text className="underline">Log In Here</Text>
                        </Button>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
