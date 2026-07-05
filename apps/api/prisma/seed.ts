import { hash } from '@node-rs/argon2';
import { PrismaClient, UserRole } from '@prisma/client';

/**
 * Idempotent database seed. Safe to run repeatedly — existing users are left
 * untouched. Passwords are hashed with Argon2id (same as the runtime
 * PasswordService).
 */
const prisma = new PrismaClient();

interface SeedUser {
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  password: string;
  bio?: string;
}

const seedUsers: SeedUser[] = [
  {
    email: 'admin@matal.dev',
    username: 'matal_admin',
    displayName: 'MATAL Admin',
    role: UserRole.ADMIN,
    password: 'ChangeMe123',
    bio: 'Platform administrator (development seed).',
  },
  {
    email: 'user@matal.dev',
    username: 'demo_user',
    displayName: 'Demo User',
    role: UserRole.USER,
    password: 'ChangeMe123',
    bio: 'A demo account for exploring MATAL.',
  },
];

async function main(): Promise<void> {
  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        bio: user.bio,
        emailVerified: true,
        passwordHash: await hash(user.password),
      },
    });
    console.log(`✓ Seeded ${user.role.toLowerCase()}: ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
