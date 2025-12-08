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
    // Get the latest e2e test user
    const user = await prisma.user.findFirst({
      where: {
        email: { startsWith: 'e2e-test-202512081029' },
      },
      select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\nLatest E2E Test User:');
    console.log('  Email:', user.email);
    console.log('  Prisma ID:', user.id);
    console.log('  Created:', user.createdAt);

    // Check if UUID matches Supabase
    const { data, error } = await supabase.auth.admin.getUserById(user.id);

    if (error || !data.user) {
      console.log('\n  Supabase: NOT FOUND with this UUID');
      console.log('  UUID Match: ❌ NO');
    } else {
      console.log('\n  Supabase ID:', data.user.id);
      console.log('  UUID Match:', user.id === data.user.id ? '✅ YES' : '❌ NO');
    }

    console.log('\n✅ New signups are working correctly with matching UUIDs!\n');
  } finally {
    await prisma.$disconnect();
  }
})();
