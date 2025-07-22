import * as SecureStore from 'expo-secure-store';

export const getAuthToken = async (): Promise<string | null> => {
    try {
        const token = await SecureStore.getItemAsync('access_token');
        return token;
    } catch (error) {
        console.error('Error retrieving token:', error);
        return null;
    }
};
