
const holidays = [
    { date: new Date('2026-01-06T00:00:00.000Z') } // Mock from DB
];

// Target date to check
const currentd = new Date('2026-01-06T00:00:00.000Z'); // UTC Midnight loop
// Test also if currentd was local midnight 
const currentdLocal = new Date(2026, 0, 6); // Local Midnight

function check(date: Date, label: string) {
    const currentYMD = date.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
    console.log(`[${label}] Date ISO: ${date.toISOString()} -> Madrid YMD: ${currentYMD}`);

    const isHoliday = holidays.some((h: any) => {
        const hDate = new Date(h.date);
        const hYMD = hDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
        console.log(`   Compare against Holiday: ${hDate.toISOString()} -> ${hYMD}`);
        return hYMD === currentYMD;
    });

    console.log(`   Is Holiday? ${isHoliday}`);
}

check(currentd, 'UTC Midnight');
check(currentdLocal, 'Local Midnight');
