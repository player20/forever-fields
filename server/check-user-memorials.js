const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    // Get your user email from command line or use default
    const userEmail = process.argv[2] || 'jacobo9509@yahoo.com';

    console.log(`\nLooking up memorials for: ${userEmail}\n`);

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, email: true },
    });

    if (!user) {
      console.log('User not found in database');
      return;
    }

    console.log('User found:', user.email);
    console.log('User ID:', user.id);

    // Get all memorials for this user
    const memorials = await prisma.memorial.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        deceasedName: true,
        deceasedNameLower: true,
        birthDate: true,
        deathDate: true,
        privacy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\nFound ${memorials.length} memorial(s):\n`);

    memorials.forEach((memorial, index) => {
      console.log(`Memorial ${index + 1}:`);
      console.log(`  ID: ${memorial.id}`);
      console.log(`  Name: ${memorial.deceasedName}`);
      console.log(`  Name (lowercase): ${memorial.deceasedNameLower}`);
      console.log(`  Birth Date: ${memorial.birthDate || 'N/A'}`);
      console.log(`  Death Date: ${memorial.deathDate || 'N/A'}`);
      console.log(`  Privacy: ${memorial.privacy}`);
      console.log(`  Created: ${memorial.createdAt}`);
      console.log(`  Updated: ${memorial.updatedAt}`);
      console.log('');
    });

    if (memorials.length === 0) {
      console.log('No memorials found for this user.');
      console.log('\nThis means you should be able to create a new memorial without any conflicts.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
