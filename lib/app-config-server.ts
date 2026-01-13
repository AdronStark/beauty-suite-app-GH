
import fs from 'fs';
import path from 'path';
import { AppDefinition, DEFAULT_APP_CONFIG } from './app-config';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'apps.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getAppConfig(): AppDefinition[] {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            // If no file, return default and optionally write it?
            // Let's write it so we have a file to edit
            const initial = DEFAULT_APP_CONFIG;
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(initial, null, 2));
            return initial;
        }

        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading app config:", error);
        return DEFAULT_APP_CONFIG;
    }
}

export function saveAppConfig(newConfig: AppDefinition[]) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
        return true;
    } catch (error) {
        console.error("Error saving app config:", error);
        return false;
    }
}
