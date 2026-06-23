import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'
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
          <Route path="/" element={<HomePage />} />
          <Route path="/lesson/:lessonId" element={<LessonRoute />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
