import { Link, Tabs } from 'expo-router';
import { TabBarIcon } from '../../components/TabBarIcon';
import {DarkTheme, DefaultTheme, Theme} from "@react-navigation/native";
import {NAV_THEME} from "~/lib/constants";

const LIGHT_THEME: Theme = {
    ...DefaultTheme,
    colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
    ...DarkTheme,
    colors: NAV_THEME.dark,
};

export default function TabLayout() {
    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,   // ← disable the top bar
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="community"
                    options={{
                        title: 'Community',
                        tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="message"
                    options={{
                        title: 'Messages',
                        tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
                        href: "/profile"
                    }}
                />
            </Tabs>
        </>
    );
}
