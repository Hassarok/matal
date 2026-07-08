import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth';
import { RedirectIfAuthed } from './components/auth/RedirectIfAuthed';
import { FullPageLoader } from './components/FullPageLoader';
import { UserRole } from '@matal/shared-types';

// Route-level code splitting: each page is its own chunk, so the initial load
// only ships the landing page + shared runtime. Lazy accepts named exports via
// the `.then(m => ({ default: m.X }))` shim.
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const StyleGuidePage = lazy(() =>
  import('./pages/StyleGuidePage').then((m) => ({ default: m.StyleGuidePage })),
);
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const MyQuizzesPage = lazy(() =>
  import('./pages/quizzes/MyQuizzesPage').then((m) => ({ default: m.MyQuizzesPage })),
);
const QuizBuilderPage = lazy(() =>
  import('./pages/quizzes/QuizBuilderPage').then((m) => ({ default: m.QuizBuilderPage })),
);
const QuizDetailPage = lazy(() =>
  import('./pages/quizzes/QuizDetailPage').then((m) => ({ default: m.QuizDetailPage })),
);
const ReportsPage = lazy(() =>
  import('./pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const GameReportPage = lazy(() =>
  import('./pages/reports/GameReportPage').then((m) => ({ default: m.GameReportPage })),
);
const JoinGamePage = lazy(() =>
  import('./pages/game/JoinGamePage').then((m) => ({ default: m.JoinGamePage })),
);
const PlayGamePage = lazy(() =>
  import('./pages/game/PlayGamePage').then((m) => ({ default: m.PlayGamePage })),
);
const HostGamePage = lazy(() =>
  import('./pages/game/HostGamePage').then((m) => ({ default: m.HostGamePage })),
);
const AdminPage = lazy(() =>
  import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
);

/** Application routes. Pages are lazy-loaded for a lean initial bundle. */
export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/style-guide" element={<StyleGuidePage />} />

        {/* Public live-game entry (players need no account) */}
        <Route path="/join" element={<JoinGamePage />} />
        <Route path="/play/:pin" element={<PlayGamePage />} />

        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <RegisterPage />
            </RedirectIfAuthed>
          }
        />

        {/* Authenticated routes */}
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/quizzes" element={<MyQuizzesPage />} />
          <Route path="/quizzes/new" element={<QuizBuilderPage />} />
          <Route path="/quizzes/:id" element={<QuizDetailPage />} />
          <Route path="/quizzes/:id/edit" element={<QuizBuilderPage />} />
          <Route path="/host/:quizId" element={<HostGamePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/games/:id" element={<GameReportPage />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<RequireAuth role={UserRole.Admin} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
