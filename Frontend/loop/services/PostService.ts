import * as SecureStore from "expo-secure-store";
import type { Category } from './CommunityService';

type Comment = {
  user: string;
  content: string;
  created_at: string;
};

export type Post = {
  id: string;
  author: { username: string; photo_url?: string };
  community: { id: number; name: string; categories: Category[]; };
  topic: string;
  content: string;
  created_at: string;
  likes: number;
  comments: Comment[];
  liked_by_user: boolean;
};

export interface CreatePostPayload {
  communityId: number;
  content:     string;
  topic?:      string;
}

export class PostService {
  private static apiUrl = process.env.EXPO_PUBLIC_API_URL;

  static async getPosts(): Promise<Post[]> {
    const token = await SecureStore.getItemAsync("access_token");
    const response = await fetch(`${this.apiUrl}/post`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const data = await response.json();
    return data as Post[];
  }

  static async createPost({ communityId, content, topic }: CreatePostPayload) {
    const token = await SecureStore.getItemAsync("access_token");
    const response = await fetch(`${this.apiUrl}/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ community_id: communityId.toString(),
        topic,                                  
        content, }),
    });

    // grab the JSON so you can surfacing the real backend error
    const respBody = await response.json();
    if (!response.ok) {
      // the Flask API returns { error: "..."} or { msg: "..." }
      const msg = respBody.error || respBody.msg || JSON.stringify(respBody);
      throw new Error(`Failed to create post: ${msg}`);
    }
    return respBody;
  }

  static async toggleLike(postId: string) {
    const token = await SecureStore.getItemAsync("access_token");
    const response = await fetch(`${this.apiUrl}/post/${postId}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to like post");
    }

    return await response.json();
  }

  static async commentOnPost(postId: string, comment: string) {
    const token = await SecureStore.getItemAsync("access_token");
    const response = await fetch(`${this.apiUrl}/post/${postId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      throw new Error("Failed to comment on post");
    }

    return await response.json();
  }
}
