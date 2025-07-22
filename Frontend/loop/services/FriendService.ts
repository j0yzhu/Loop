import { StringToBoolean } from "class-variance-authority/types";
import * as SecureStore from "expo-secure-store";
import {User} from "~/services/UserService";

export type FriendRequest = {
  request_id: string;
  requester: string;
  requester_id: string;
  req_name: string;
  recipient: string;
  status: string;
  created_at: string;
  profile_picture_url?: string;
};

export class FriendService {
  private static apiUrl = process.env.EXPO_PUBLIC_API_URL;

  static async sendFriendRequest(recipientEmail: string) {
    const token = await SecureStore.getItemAsync("access_token");
    const response = await fetch(`${this.apiUrl}/friends/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipient_email: recipientEmail }),
    });

    if (!response.ok) {
      throw new Error("Failed to send friend request");
    }

    return await response.json();
  }

  static async getMyFriends(): Promise<User[]> {
    const token = await SecureStore.getItemAsync("access_token");
    const response = await fetch(`${this.apiUrl}/friends/list`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch friends list");
    }

    const r = await response.json();
    console.log(r);
    return r;
  }

  static async getPendingRequests(): Promise<FriendRequest[]> {
    const token = await SecureStore.getItemAsync("access_token");
    const response = await fetch(`${this.apiUrl}/friends/requests/pending`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch pending requests");
    }
    const data = await response.json();
    return data as FriendRequest[]; // assuming backend returns { friends: [...] }
  }

  static async respondToFriendRequest(requestId: string, action: "accept" | "reject") {
    const token = await SecureStore.getItemAsync("access_token");
    const response = await fetch(`${this.apiUrl}/friends/request/${requestId}/respond`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      throw new Error("Failed to respond to friend request");
    }

    return await response.json();
  }

  static async suggestUsers() {
    const token = await SecureStore.getItemAsync("access_token");

    const response = await fetch(`${this.apiUrl}/friends/suggestions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    const data = await response.json();
    return data;
  }

}
