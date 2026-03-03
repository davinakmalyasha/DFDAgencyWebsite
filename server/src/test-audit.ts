import { AuditService } from './services/audit.service';
import { prisma } from './lib/prisma';

async function testAuditService() {
    console.log('Calling AuditService.log...');
    // Simulated call from controller: req.user.id is usually a number, let's pass undefined to see if this is the issue
    await AuditService.log(undefined as any, 'TEST_SERVICE', 'Target', { foo: 'bar' }, '127.0.0.1');

    await AuditService.log("1" as any, 'TEST_SERVICE_STRING', 'Target', { foo: 'bar' }, '127.0.0.1');
}

testAuditService().finally(() => prisma.$disconnect());
