import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient, UserRole } from '@prisma/client';

/**
 * Idempotent database seed. Safe to run repeatedly — existing users are left
 * untouched. Passwords are hashed with Node's built-in scrypt (no native
 * dependencies); Phase 2 formalises this behind a dedicated PasswordService.
 *
 * Encoded hash format: `scrypt$<saltHex>$<derivedKeyHex>`.
 */
const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

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
    email: 'host@matal.dev',
    username: 'demo_host',
    displayName: 'Demo Host',
    role: UserRole.HOST,
    password: 'ChangeMe123',
    bio: 'A demo host account for exploring MATAL.',
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
        passwordHash: hashPassword(user.password),
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
