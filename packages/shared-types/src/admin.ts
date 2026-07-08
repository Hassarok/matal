import type { UserRole } from './enums';
import type { QuizVisibility } from './enums';

/** Platform-wide totals for the admin overview. */
export interface AdminStats {
  totalUsers: number;
  totalQuizzes: number;
  totalGames: number;
  totalQuestions: number;
}

/** A user row in the admin user-management table. */
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  quizCount: number;
  gameCount: number;
}

/** A quiz row in the admin moderation table (across all owners). */
export interface AdminQuizItem {
  id: string;
  title: string;
  visibility: QuizVisibility;
  questionCount: number;
  ownerId: string;
  ownerName: string;
  createdAt: string;
}
