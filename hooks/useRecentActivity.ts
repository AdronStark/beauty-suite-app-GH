import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export type ActivityType = 'offer' | 'briefing';

export interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    code?: string; // Offer code or Briefing code
    timestamp: number;
    path: string;
}

const MAX_ITEMS = 10;

export function useRecentActivity() {
    const { data: session } = useSession();
    const userId = session?.user?.email || 'guest'; // specific enough for this app context
    const storageKey = `beauty_suite_recent_activity_${userId}`;

    const [activities, setActivities] = useState<ActivityItem[]>([]);

    // Load on mount or user change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    setActivities(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse recent activity", e);
                }
            }
        }
    }, [storageKey]);

    const trackActivity = (type: ActivityType, id: string, title: string, code?: string) => {
        if (!id) return;

        const newItem: ActivityItem = {
            id,
            type,
            title: title || 'Sin Título',
            code,
            timestamp: Date.now(),
            path: type === 'offer' ? `/ofertas/editor/${id}` : `/briefings/wizard?id=${id}`
        };

        setActivities(prev => {
            // Remove existing item with same ID (to bump it to top)
            const filtered = prev.filter(item => item.id !== id);
            // Add new item to front
            const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

            // Persist
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        });
    };

    return { activities, trackActivity };
}
