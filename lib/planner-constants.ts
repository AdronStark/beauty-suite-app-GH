export const SHIFTS = ['Mañana', 'Tarde'] as const;
export type Shift = typeof SHIFTS[number];

export interface ReactorDefinition {
    id: string;
    capacity: number;
    label: string;
}



// Config Constants
export const PLANNING_CONFIG = {
    BATCH_LIMIT: 2000, // kg
    MIN_DAYS_AFTER_ORDER: 1,
    MAX_WINDOW_DAYS: 60,
    BUFFER_DAYS_BEFORE_DEADLINE: 1,
};

export const BATCH_COLORS: Record<string, string> = {
    "T1": "#3b82f6", // Blue
    "T2": "#8b5cf6", // Violet
    "T3": "#f59e0b", // Amber
    "T4": "#ec4899", // Pink
    "T5": "#14b8a6", // Teal
    "DEFAULT": "#64748b" // Slate
};
