import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { StyleGuidePage } from './pages/StyleGuidePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { MyQuizzesPage } from './pages/quizzes/MyQuizzesPage';
import { QuizBuilderPage } from './pages/quizzes/QuizBuilderPage';
import { QuizDetailPage } from './pages/quizzes/QuizDetailPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { GameReportPage } from './pages/reports/GameReportPage';
import { JoinGamePage } from './pages/game/JoinGamePage';
import { PlayGamePage } from './pages/game/PlayGamePage';
import { HostGamePage } from './pages/game/HostGamePage';
import { RequireAuth } from './components/auth/RequireAuth';
import { RedirectIfAuthed } from './components/auth/RedirectIfAuthed';

/** Application routes. Feature routes (dashboard, quiz builder, game…) land in later phases. */
export default function App() {
  return (
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
