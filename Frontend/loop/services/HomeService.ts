import * as SecureStore from "expo-secure-store";

export interface Event extends EventApiResponse {
    rsvped: boolean;
}

export interface EventApiResponse {
    description: string;
    id: number;
    title: string;
    date: number;
    location: string;
};

export type Announcement = {
    id: number;
    title: string;
    description: string;
    date: Date;
};

export class HomeService {
    private static apiUrl = process.env.EXPO_PUBLIC_API_URL;

    static async getAccessToken() {
        const token = await SecureStore.getItemAsync('access_token');
        if (!token) {
            console.log('No access token found');
            throw new Error('No access token found');
        }
        return token;
    }

    static async createAnnouncements(title: string, description: string): Promise<Announcement> {
        const token = await this.getAccessToken();
        const response = await fetch(`${this.apiUrl}/homepage/createAnnouncement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({title, description}),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log(errorData);
            throw new Error(errorData.msg || 'Failed to create announcement');
        }

        return await response.json();
    }

    static async getAnnouncements(): Promise<Announcement[]> {
        const token = await this.getAccessToken();
        const response = await fetch(`${this.apiUrl}/homepage/announcements`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.log("Announcement list data", errorData);
            throw new Error(errorData.msg || 'Failed to get announcements.');
        }
        const announcements = await response.json();

        if (announcements.message === "Empty") {
            return [];
        }

        return announcements;
    }

    static async getEvents(): Promise<Event[]> {
        const token = await this.getAccessToken();
        const response = await fetch(`${this.apiUrl}/homepage/events`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.log("Event list data", errorData);
            throw new Error(errorData.msg || 'Failed to get events.');
        }
        const data: EventApiResponse[] = await response.json();
        return this.joinMergedStatus(data);
    }

    static async joinMergedStatus(event: EventApiResponse[]): Promise<Event[]> {
        const rsvpedEvents = await this.getRSVPedEvents();
        const rsvpIds = new Set(rsvpedEvents.map((event) => event.id));
        return event.map((event) => ({
            ...event,
            rsvped: rsvpIds.has(event.id),
        }));
    }

    static async rsvpEvent(eventId: number) {
        const token = await this.getAccessToken();
        console.log("Making rsvp request")
        const response = await fetch(`${this.apiUrl}/homepage/rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                event_id: eventId,
            }),
        });

        console.log(response.status)

        if (!response.ok) {
            const errorData = await response.json();
            console.log(errorData);
            throw new Error(errorData.msg || 'Failed to RSVP to event');
        }

        return await response.json();
    }

    static async getRSVPedEvents(): Promise<Event[]> {
        const token = await this.getAccessToken();
        const resp = await fetch(
            `${this.apiUrl}/homepage/rsvped`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.msg || 'Failed to fetch RSVPed events');
        }

        const data: EventApiResponse[] = await resp.json();
        return data.map(e => ({
            ...e,
            rsvped: true
        }));
    }

    static async createEvent(
        title: string,
        description: string,
        location: string,
        date: string

    ): Promise<{ event_id: number }> {
        const token = await SecureStore.getItemAsync("access_token");

        const response = await fetch(`${this.apiUrl}/homepage/createEvent`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({title, description, location, date}),
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.msg || "Failed to create event");
        }

        return await response.json();
    }
}