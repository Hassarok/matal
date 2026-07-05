import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { StyleGuidePage } from './pages/StyleGuidePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyQuizzesPage } from './pages/quizzes/MyQuizzesPage';
import { QuizBuilderPage } from './pages/quizzes/QuizBuilderPage';
import { RequireAuth } from './components/auth/RequireAuth';
import { RedirectIfAuthed } from './components/auth/RedirectIfAuthed';

/** Application routes. Feature routes (dashboard, quiz builder, game…) land in later phases. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/style-guide" element={<StyleGuidePage />} />

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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/quizzes" element={<MyQuizzesPage />} />
        <Route path="/quizzes/new" element={<QuizBuilderPage />} />
        <Route path="/quizzes/:id/edit" element={<QuizBuilderPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
