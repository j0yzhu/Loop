import * as SecureStore from "expo-secure-store";
import * as ImagePicker from 'expo-image-picker';

export interface Community extends CommunityApiResponse {
    joined: boolean;
}

export interface CommunityApiResponse {
    id: number;
    name: string;
    description: string;
    members: number;
    community_picture: string;
    categories: Category[];
};

export interface Category {
    id: number;
    topic: string;
    subtopic: string;
};

export interface CommunityMessage {
    id: number;
    sender: string;
    message: string;
    timestamp: string;
    delivered: boolean;
}

export class CommunityService {
    private static apiUrl = process.env.EXPO_PUBLIC_API_URL;

    static async getAccessToken() {
        const token = await SecureStore.getItemAsync('access_token');
        if (!token) {
            console.log('No access token found');
            throw new Error('No access token found');
        }
        return token;
    }

    static async getCommunityById(communityId: number): Promise<Community> {
        const token = await this.getAccessToken();
        const response = await fetch(`${this.apiUrl}/community/${communityId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.log(await response.text())
            const errorData = await response.json();
            console.log(errorData);
            throw new Error(errorData.msg || 'Failed to fetch community');
        }

        const data: CommunityApiResponse = await response.json();
        return { ...data, joined: false }; // Default joined to false
    }

    static async createCommunity(
        name: string,
        description: string,
        categories: number[]
    ): Promise<{ community_id: number }> {
        const token = await SecureStore.getItemAsync("access_token");

        const response = await fetch(`${this.apiUrl}/community`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name, description, categories }),
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.msg || "Failed to create community");
        }

        return await response.json();
    }

    static async joinCommunity(communityId: number) {
        const token = await this.getAccessToken();
        const response = await fetch(`${this.apiUrl}/homepage/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                community_id: communityId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log(errorData);
            throw new Error(errorData.msg || 'Failed to join community');
        }

        const data = await response.json();
    }

    static async getAllCommunities(): Promise<Community[]> {
        const token = await this.getAccessToken();
        const response = await fetch(`${this.apiUrl}/homepage/communities`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.log("Communities list data", errorData);
            throw new Error(errorData.msg || 'Failed to get communities.');
        }

        const data: CommunityApiResponse[] = await response.json();
        return this.joinMergedStatus(data);
    }

    static async joinMergedStatus(community: CommunityApiResponse[]): Promise<Community[]> {
        const joinedCommunities = await this.getJoinedCommunities();
        const joinedIds = new Set(joinedCommunities.map((community) => community.id));
        return community.map((community) => ({
            ...community,
            joined: joinedIds.has(community.id),
        }));
    }

    static async search(query: string, categories: number[]): Promise<Community[]> {
        try {
            const token = await SecureStore.getItemAsync("access_token");
            const response = await fetch(
                `${this.apiUrl}/community/searchCommunity?query=${query}&categories=${categories.join(",")}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            console.log("made request")
            console.log(response.status);

            if (!response.ok) {
                const json = await response.json();
                const errorMessage = json.error
                console.log(errorMessage)
                throw new Error(errorMessage);
            }
            const data = await response.json();
            return this.joinMergedStatus(data);
        }
            // @ts-ignore
        catch (error) {
            console.log(error);
            // @ts-ignore
            throw new Error(error.message);
        }
    }

    static async uploadCommunityPicture(communityId: number, image: ImagePicker.ImagePickerAsset): Promise<void> {
        const token = await SecureStore.getItemAsync("access_token");
        if (!token) {
            console.error("No access token found");
            return;
        }

        const formData = new FormData();

        const newImageUri = image.uri.startsWith("file://") ? image.uri : "file:///" + image.uri.split("file:/").join("");

        formData.append("file", {
            uri: newImageUri,
            name: image.fileName || 'community.jpg',
            type: 'image/jpeg',
        } as any);

        try {
            // /createCommunity/3/community-picture
            const response = await fetch(`${this.apiUrl}/community/createCommunity/${communityId}/community-picture`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Upload failed');
            }

            const data = await response.json();
            console.log('Upload successful:', data);
        } catch (error) {
            console.error('Image upload error:', error);
        }
    }

    static async getCategories(): Promise<Category[]> {
        console.log('Getting categories');
        const response = await fetch(`${this.apiUrl}/community/categories`);
        if (!response.ok) {
            console.log(response.status);
            throw new Error("Failed to fetch categories");
        }
        const j = await response.json();
        console.log(j);
        return j;
    }

    static async getJoinedCommunities(): Promise<Community[]> {
        const token = await this.getAccessToken();
        const resp = await fetch(
        `${this.apiUrl}/community/joined`,
        { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.msg || 'Failed to fetch joined communities');
        }

        const data: CommunityApiResponse[] = await resp.json();
        return data.map((community) => ({
            ...community,
            joined: true,
        }));
    }

        static async fetchCommunityMessages(communityId: number): Promise<CommunityMessage[]> {
            const token = await this.getAccessToken();
            const response = await fetch(`${this.apiUrl}/community/${communityId}/messages`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
            })
            if (!response.ok) {
                const errorData = await response.json();
                console.log(errorData);
                throw new Error(errorData.msg || 'Failed to fetch community messages');
            }
            return await response.json() as CommunityMessage[];
        }

        static async postCommunityMessage(communityId: number, message: string): Promise<CommunityMessage> {
            const token = await this.getAccessToken();
            const response = await fetch(`${this.apiUrl}/community/${communityId}/message`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.log(errorData);
                throw new Error(errorData.msg || 'Failed to post community message');
            }

            return await response.json() as CommunityMessage;
        }
}
