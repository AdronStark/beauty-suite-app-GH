export { };
import { PrismaClient } from '@prisma/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const fs = require('fs');
    let output = '';
    const log = (msg: any) => { output += msg + '\n'; console.log(msg); };

    log(`Debug Compliance KPI`);
    log(`Current Time: ${now.toISOString()}`);
    log(`Week Interval: ${weekStart.toISOString()} - ${weekEnd.toISOString()}`);

    const blocks = await prisma.productionBlock.findMany({
        where: {
            deadline: {
                gte: weekStart,
                lte: weekEnd
            }
        },
        select: {
            id: true,

            articleDesc: true,
            status: true,
            deadline: true,
            plannedDate: true
        }
    });

    log(`Found ${blocks.length} blocks with deadline in current week.`);

    const produced = blocks.filter(b => b.status === 'PRODUCED');
    log(`Produced Count: ${produced.length}`);

    if (blocks.length > 0) {
        log(`Compliance Ratio: ${(produced.length / blocks.length) * 100}%`);
        log('--- Blocks Details ---');
        blocks.forEach(b => {
            log(`[${b.status}] ${b.articleDesc} (Deadline: ${b.deadline ? format(b.deadline, 'yyyy-MM-dd') : 'N/A'})`);
        });
    } else {
        log('Compliance is 100% (default) because no blocks have deadline this week.');
    }

    fs.writeFileSync('debug_output.txt', output);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
