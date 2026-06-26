import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'
import { ProgressPage } from './pages/ProgressPage'
import { PracticePage } from './pages/PracticePage'
import { ReviewPage } from './pages/ReviewPage'
import './index.css'
import './App.css'

function LessonRoute() {
  const { lessonId } = useParams<{ lessonId: string }>()
  // Remount on lesson change so per-lesson state never leaks between lessons.
  return <LessonPage key={lessonId} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/practice/:conceptId" element={<PracticePage />} />
            <Route path="/lesson/:lessonId" element={<LessonRoute />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
