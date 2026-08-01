require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD || 'change-this-immediately',
    10
  );

  await prisma.adminUser.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@sunshinesocial.org' },
    update: {},
    create: {
      fullName: 'Super Admin',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@sunshinesocial.org',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const services = [
    {
      name: 'Physiotherapy Session',
      description: 'One-on-one physiotherapy for pain relief and mobility, delivered by a qualified physiotherapist at up to 75% subsidised cost.',
    },
    {
      name: 'Body Pain Relief Therapy',
      description: 'Automated massage chair / leg massager sessions for therapeutic relief from common body aches and improved circulation.',
    },
    {
      name: 'Health Parameter Screening',
      description: 'Free on-the-spot screening for blood pressure, blood sugar, and basic health metrics using portable digital devices.',
    },
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } });
    if (!existing) {
      await prisma.service.create({ data: service });
    }
  }

  const upcomingCampExists = await prisma.camp.findFirst({
    where: { title: 'Sunshine Health Camp — Sample City' },
  });
  if (!upcomingCampExists) {
    const start = new Date();
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setHours(end.getHours() + 4);

    await prisma.camp.create({
      data: {
        title: 'Sunshine Health Camp — Sample City',
        city: 'Indore',
        locality: 'Replace with real locality',
        venueDetails: 'Replace with real venue address',
        startAt: start,
        endAt: end,
        capacity: 100,
        isPublished: true,
      },
    });
  }

  console.log('Seed complete.');
  console.log(`Admin login: ${process.env.SEED_ADMIN_EMAIL || 'admin@sunshinesocial.org'}`);

  // --- Phase 2: demo partner clinic + clinic staff login ---
  let clinic = await prisma.clinic.findFirst({ where: { name: 'Sample Partner Physiotherapy Clinic' } });
  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: 'Sample Partner Physiotherapy Clinic',
        city: 'Indore',
        address: 'Replace with real clinic address',
        contactPerson: 'Dr. Replace Name',
        mobileNumber: '9000000000',
        email: 'clinic@partnerclinic.example',
        isActive: true,
      },
    });
  }

  const clinicPasswordHash = await bcrypt.hash(
    process.env.SEED_CLINIC_PASSWORD || 'change-this-immediately',
    10
  );
  await prisma.clinicUser.upsert({
    where: { email: process.env.SEED_CLINIC_EMAIL || 'clinic@partnerclinic.example' },
    update: {},
    create: {
      clinicId: clinic.id,
      fullName: 'Clinic Front Desk',
      email: process.env.SEED_CLINIC_EMAIL || 'clinic@partnerclinic.example',
      passwordHash: clinicPasswordHash,
    },
  });
  console.log(`Clinic portal login: ${process.env.SEED_CLINIC_EMAIL || 'clinic@partnerclinic.example'}`);

  // A few sample coupons from the general subsidy pool, so the clinic
  // portal and admin coupon list have something to show immediately.
  const physioService = await prisma.service.findFirst({ where: { name: 'Physiotherapy Session' } });
  if (physioService) {
    const existingCoupons = await prisma.coupon.count();
    if (existingCoupons === 0) {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 6);

      for (let i = 0; i < 3; i += 1) {
        const random = Math.random().toString(16).slice(2, 8).toUpperCase();
        await prisma.coupon.create({
          data: {
            code: `SSF-${new Date().getFullYear()}-${random}`,
            serviceId: physioService.id,
            subsidyPercent: 75,
            valueInPaise: 60000, // ₹600 subsidised value, sample
            expiresAt: expiry,
            status: 'ISSUED',
          },
        });
      }
      console.log('Seeded 3 sample coupons from the general subsidy pool.');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
