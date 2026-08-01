const { PrismaClient } = require('@prisma/client');

// Single shared Prisma instance across the app (avoids connection exhaustion
// in dev with hot-reload, and is the standard pattern for production too).
const prisma = new PrismaClient();

module.exports = prisma;
