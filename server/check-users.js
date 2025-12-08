/**
 * Quick script to check users in database vs Supabase
 */
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  try {
    console.log('\n=== Checking Database Users ===\n');

    // Get all users from Prisma
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    console.log(`Found ${dbUsers.length} users in Prisma database:\n`);

    for (const user of dbUsers) {
      console.log(`- ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Created: ${user.createdAt}`);

      // Check if this user exists in Supabase with same UUID
      const { data: supabaseUser, error } = await supabase.auth.admin.getUserById(user.id);

      if (error || !supabaseUser) {
        console.log(`  ⚠️  NOT FOUND in Supabase auth with this ID`);

        // Try to find by email
        const { data: { users: emailMatch } } = await supabase.auth.admin.listUsers();
        const matchByEmail = emailMatch.find(u => u.email === user.email);

        if (matchByEmail) {
          console.log(`  ❌ UUID MISMATCH! Supabase has ${matchByEmail.id} for ${user.email}`);
        }
      } else {
        console.log(`  ✅ Matches Supabase auth`);
      }
      console.log('');
    }

    // Get all users from Supabase auth
    const { data: { users: supabaseUsers } } = await supabase.auth.admin.listUsers();

    console.log(`\n=== Supabase Auth Users (${supabaseUsers.length}) ===\n`);

    for (const supabaseUser of supabaseUsers.slice(0, 20)) {
      console.log(`- ${supabaseUser.email}`);
      console.log(`  ID: ${supabaseUser.id}`);
      console.log(`  Created: ${supabaseUser.created_at}`);

      // Check if exists in Prisma
      const dbUser = await prisma.user.findUnique({
        where: { id: supabaseUser.id },
      });

      if (!dbUser) {
        console.log(`  ⚠️  NOT FOUND in Prisma database with this ID`);

        // Try to find by email
        const dbUserByEmail = await prisma.user.findUnique({
          where: { email: supabaseUser.email },
        });

        if (dbUserByEmail) {
          console.log(`  ❌ UUID MISMATCH! Prisma has ${dbUserByEmail.id} for ${supabaseUser.email}`);
        } else {
          console.log(`  ❌ Missing from Prisma database entirely`);
        }
      } else {
        console.log(`  ✅ Matches Prisma database`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
