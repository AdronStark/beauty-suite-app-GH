/**
 * SQLite Database Backup Script
 * 
 * Creates timestamped backups of dev.db before starting the dev server.
 * Keeps last 14 days of backups automatically.
 * 
 * Usage: npx tsx scripts/backup_db.ts
 * 
 * NOTE: Remove this when migrating to PostgreSQL (see postgres_migration_guide.md)
 */

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
const RETENTION_DAYS = 14;

function formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log('📁 Created backups directory');
    }
}

function cleanOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deleted = 0;
    for (const file of files) {
        if (!file.endsWith('.db')) continue;
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            deleted++;
        }
    }
    if (deleted > 0) {
        console.log(`🗑️  Cleaned ${deleted} old backup(s) (>${RETENTION_DAYS} days)`);
    }
}

function createBackup() {
    if (!fs.existsSync(DB_PATH)) {
        console.log('⚠️  No database file found at', DB_PATH);
        console.log('   Skipping backup (new installation?)');
        return;
    }

    ensureBackupDir();

    const backupName = `dev_${formatDate(new Date())}.db`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    // Check if backup already exists for this minute (avoid duplicates on rapid restarts)
    if (fs.existsSync(backupPath)) {
        console.log('💾 Backup already exists for this timestamp, skipping');
        return;
    }

    fs.copyFileSync(DB_PATH, backupPath);
    const sizeMB = (fs.statSync(backupPath).size / 1024 / 1024).toFixed(2);
    console.log(`💾 Backup created: ${backupName} (${sizeMB} MB)`);

    cleanOldBackups();
}

// Run
console.log('\n🔒 SQLite Backup Service');
console.log('========================');
createBackup();
console.log('');
