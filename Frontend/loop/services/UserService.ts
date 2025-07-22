import * as SecureStore from "expo-secure-store";
import * as ImagePicker from 'expo-image-picker';
import {Community} from "~/services/CommunityService";

export type User = {
    id: number;
    own_communities: Community[];
    email: string;
    username: string;
    firstname: string;
    lastname: string;
    full_name: string;
    year_level: string;
    degree: string;
    date_of_birth: Date;
    gender: string;
    age: string;
    pronouns: string;
    profile_picture?: string;
    profile_picture_url?: string;
    neurotypes: string[];
    interests: string[];
    bio: string;
    photos: string[];
};

export class UserService {
    private static apiUrl = process.env.EXPO_PUBLIC_API_URL;

    static async login(email: string, password: string) {
        try {
            const response = await fetch(
                `${this.apiUrl}/auth/login`,
                {
                    method: "POST",
                    body: JSON.stringify({ email, password }),
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
            console.log("made request")
            console.log(response.status);

            if (!response.ok) {
                const json = await response.json();
                const errorMessage = json.error
                console.log(errorMessage)
                throw new Error(errorMessage);
            }
            return await response.json();
        }
        // @ts-ignore
        catch (error) {
            console.log(error);
            // @ts-ignore
            throw new Error(error.message);
        }
    }
    static async register(email: string, password: string, firstname: string, lastname: string) {
        try {
            const response = await fetch(
                `${this.apiUrl}/auth/register`,
                {
                    method: "POST",
                    body: JSON.stringify({ firstname, lastname, email, password }),
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
            console.log("made request")
            console.log(response.status);

            if (!response.ok) {
                const json = await response.json();
                const errorMessage = json.error
                console.log(errorMessage)
                throw new Error(errorMessage);
            }

            return await response.json();
        }
            // @ts-ignore
        catch (error) {
            console.log(error);
            // @ts-ignore
            throw new Error(error.message);
        }
    }

    static async getAccessToken() {
        const token = await SecureStore.getItemAsync("access_token");
        if (!token) {
            console.log("No access token found");
            throw new Error("No access token found");
        }
        return token;
    }

 

    static async getCurrentUser(): Promise<User> {
        const token = await this.getAccessToken();
        console.log("Token being used:", token);  // log the actual token

        const url = `${this.apiUrl}/user/me`;
        console.log("Requesting:", url);  // log the URL

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();  // Not json in case it's HTML error
            console.log("Error response body:", errorText);  // show full backend error
            console.log("Status code:", response.status);    // show status
            throw new Error("Failed to get current user");
        }

        const user = await response.json();
        console.log("Fetched user profile:", user);  // see what you're getting
        return user;
    }


    static async setup(username: string, dob: string, year_level: string, degree: string, pronouns: string, gender: string, neurotypes: string[], interests: string[], age: string){
        console.log('Sending to backend:', {
            username, dob, year_level, degree, pronouns, 
            gender, neurotypes, interests, age
        });    
        const token = await SecureStore.getItemAsync("access_token");
        try {
            const response = await fetch(
                `${this.apiUrl}/user/setup`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ username, dob, year_level, degree, pronouns, gender, neurotypes, interests, age }),
                });
            console.log("made request");
            console.log(`${this.apiUrl}/user/setup`);
            console.log(response.status);

            if (!response.ok) {
                const json = await response.json();
                const errorMessage = json.error
                console.log(errorMessage)
                throw new Error(errorMessage);
            }
            return await response.json();
        }
            // @ts-ignore
        catch (error) {
            console.log(error);
            // @ts-ignore
            throw new Error(error.message);
        }
    }

     static async uploadProfilePicture(image: ImagePicker.ImagePickerAsset) {
        const token = await SecureStore.getItemAsync("access_token");
        if (!token) {
            console.error("No access token found");
            return;
        }

        const formData = new FormData();

         const newImageUri =  "file:///" + image.uri.split("file:/").join("");

         console.log(image.type)

        formData.append('file', {
            uri: newImageUri,
            name: image.fileName || 'profile.jpg',
            type: 'image/jpeg',
        } as any);

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/setup/profile-picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Note: Do not set 'Content-Type' header; let fetch set it automatically
                },
                body: formData,
            });

            console.log(response.body);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Upload failed');
            }

            const data = await response.json();
            console.log('Upload successful:', data);
        } catch (error) {
            console.error('Image upload error:', error);
        }
    };

    static async uploadPostPhoto(imageUri: string): Promise<string | null> {
        try {
            const token = await SecureStore.getItemAsync("access_token");
            if (!token) return null;

            // Convert local URI to blob
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const fileType = imageUri.split('.').pop() || 'jpg';
            const fileName = `post_${Date.now()}.${fileType}`;

            // Create FormData
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                name: fileName,
                type: `image/${fileType}`,
            } as any);

            // Use the correct endpoint for user photos
            const uploadResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/personal_profile/photos`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Upload failed: ${errorText}`);
            }

            const result = await uploadResponse.json();
            return result.url; // Note: The backend returns 'photo_url' in the UserPhoto object
        } catch (error) {
            console.error('Error uploading post photo:', error);
            return null;
        }
    };



    static async deletePostPhoto(photoUrl: string): Promise<void> {
    try {
        const token = await this.getAccessToken();
        
        // Extract just the S3 key (last part after domain)
        const photoKey = photoUrl.split('amazonaws.com/')[1];
        console.log("photokey :", photoKey)
        const url = `${this.apiUrl}/personal_profile/photos/${photoKey}`;
        
        console.log('DELETE request to:', url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to delete photo');
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
        throw error;
    }
}


    static async getUserById(userId: number): Promise<User> {
        const token = await this.getAccessToken();
        const url = `${this.apiUrl}/user/${userId}`;
        console.log("Requesting user by ID:", url);  // log the URL

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();  // Not json in case it's HTML error
            console.log("Error response body:", errorText);  // show full backend error
            console.log("Status code:", response.status);    // show status
            throw new Error("Failed to get user by ID");
        }

        const user = await response.json();
        console.log("Fetched user profile by ID:", user);  // see what you're getting
        return user;
    }


    static async getOtherUserProfile(email: string) {}

    static async deleteCurrentUser() {
    const token = await this.getAccessToken();

    try {
        const response = await fetch(`${this.apiUrl}/user/delete-user`, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log("Failed to delete user:", errorData);
            throw new Error('Failed to delete user');
        }

        await SecureStore.deleteItemAsync("access_token");

        console.log("User deleted successfully");
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
}

}
