/**
 * Fix UUID mismatches between Supabase auth and Prisma database
 * This script updates Prisma user IDs to match Supabase auth IDs
 */
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUUIDMismatches() {
  try {
    console.log('\n=== Fixing UUID Mismatches ===\n');

    // Get all users from Supabase auth
    const { data: { users: supabaseUsers }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Failed to fetch Supabase users:', error);
      return;
    }

    console.log(`Found ${supabaseUsers.length} users in Supabase auth\n`);

    let fixedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    for (const supabaseUser of supabaseUsers) {
      const email = supabaseUser.email;
      const supabaseId = supabaseUser.id;

      console.log(`Processing: ${email}`);
      console.log(`  Supabase ID: ${supabaseId}`);

      // Check if user exists in Prisma with this ID
      const userByIdMatch = await prisma.user.findUnique({
        where: { id: supabaseId },
      });

      if (userByIdMatch) {
        console.log(`  ✅ ID already matches - skipping`);
        skippedCount++;
        continue;
      }

      // Check if user exists in Prisma by email
      const userByEmail = await prisma.user.findUnique({
        where: { email: email },
      });

      if (userByEmail) {
        // UUID mismatch - need to update
        console.log(`  ⚠️  UUID mismatch detected!`);
        console.log(`     Prisma has: ${userByEmail.id}`);
        console.log(`     Supabase has: ${supabaseId}`);

        try {
          // We need to delete the old user and recreate with correct ID
          // First, get all the user's data
          const userData = {
            email: userByEmail.email,
            name: userByEmail.name,
            createdAt: userByEmail.createdAt,
            updatedAt: userByEmail.updatedAt,
          };

          console.log(`  🔄 Updating user ID to match Supabase...`);

          // Delete old user (this will cascade delete related records due to foreign keys)
          await prisma.user.delete({
            where: { id: userByEmail.id },
          });

          // Create new user with correct Supabase ID
          await prisma.user.create({
            data: {
              id: supabaseId,
              ...userData,
            },
          });

          console.log(`  ✅ Fixed UUID mismatch for ${email}`);
          fixedCount++;
        } catch (updateError) {
          console.error(`  ❌ Failed to fix UUID for ${email}:`, updateError.message);
        }
      } else {
        // User doesn't exist in Prisma at all - create it
        console.log(`  ❌ User missing from Prisma - creating...`);

        try {
          const name = supabaseUser.user_metadata?.name ||
                      supabaseUser.email?.split('@')[0] ||
                      'User';

          await prisma.user.create({
            data: {
              id: supabaseId,
              email: email,
              name: name,
            },
          });

          console.log(`  ✅ Created missing user: ${email}`);
          createdCount++;
        } catch (createError) {
          console.error(`  ❌ Failed to create user ${email}:`, createError.message);
        }
      }

      console.log('');
    }

    console.log('\n=== Summary ===');
    console.log(`Total users processed: ${supabaseUsers.length}`);
    console.log(`Already matching: ${skippedCount}`);
    console.log(`UUID mismatches fixed: ${fixedCount}`);
    console.log(`Missing users created: ${createdCount}`);
    console.log('\n✅ UUID sync complete!\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUUIDMismatches();
