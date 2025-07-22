import {useCallback, useEffect, useState} from "react";
import * as SecureStore from "expo-secure-store";
import {Redirect, useRouter} from "expo-router";
import {Category, Community, CommunityService} from "~/services/CommunityService";
import {useFocusEffect} from "@react-navigation/native";

export default function RedirectPage() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkToken = async () => {
            const token = await SecureStore.getItemAsync('access_token');
            console.log("token is:", token);
            console.log("on homepage")
            if (token) {
                setIsAuthenticated(true);
            }
            else {
                setIsAuthenticated(false);
            }
        };

        checkToken();
    }, []);

    if (isAuthenticated === null) {
        return null;
    }

    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }
    else {
        return <Redirect href="/loginOrRegister" />;
    }
}