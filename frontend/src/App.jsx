// App.jsx — FINAL dengan semua komponen aksesibilitas
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
import StudentDashboard from './pages/student/Dashboard'
import StudentModules from './pages/student/Modules'
import StudentPlayground from './pages/student/Playground'
import StudentTasks from './pages/student/Tasks'
import StudentTaskDetail from './pages/student/TaskDetail'
import StudentQuiz from './pages/student/Quiz'
import StudentCollaboration from './pages/student/Collaboration'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherUploadModule from './pages/teacher/UploadModule'
import TeacherCreateTask from './pages/teacher/CreateTask'
import TeacherChat from './pages/teacher/Chat'
import TeacherCollaboration from './pages/teacher/Collaboration'
import ParentDashboard from './pages/parent/Dashboard'
import ParentChat from './pages/parent/Chat'

// ── Aksesibilitas ──────────────────────────────────────────────
import AccessibilityProvider from './components/AccessibilityProvider'
import AccessibilityToolbar  from './components/AccessibilityToolbar'
import AACPanel              from './components/AACPanel'
import GestureCamera         from './components/GestureCamera'      // BARU: tunawicara
import VoiceNavigator        from './components/VoiceNavigator'     // BARU: tunanetra
import DeafVisualAlert       from './components/DeafVisualAlert'    // BARU: tunarungu
// ──────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />

          {/* Siswa */}
          <Route path="/student/dashboard"     element={<StudentDashboard />} />
          <Route path="/student/modules"       element={<StudentModules />} />
          <Route path="/student/playground"    element={<StudentPlayground />} />
          <Route path="/student/tasks"         element={<StudentTasks />} />
          <Route path="/student/task/:id"      element={<StudentTaskDetail />} />
          <Route path="/student/quiz/:id"      element={<StudentQuiz />} />
          <Route path="/student/collaboration" element={<StudentCollaboration />} />

          {/* Guru */}
          <Route path="/teacher/dashboard"     element={<TeacherDashboard />} />
          <Route path="/teacher/upload"        element={<TeacherUploadModule />} />
          <Route path="/teacher/create-task"   element={<TeacherCreateTask />} />
          <Route path="/teacher/chat"          element={<TeacherChat />} />
          <Route path="/teacher/collaboration" element={<TeacherCollaboration />} />

          {/* Orang Tua */}
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent/chat"      element={<ParentChat />} />
        </Routes>

        {/*
          Semua komponen di bawah ini adalah FLOATING — tidak mengubah
          layout halaman manapun. Masing-masing cek disability_type
          secara internal dan tidak render jika tidak relevan.
        */}

        {/* Semua disability: toolbar ♿ */}
        <AccessibilityToolbar />

        {/* Tunawicara: panel AAC simbol + kamera gesture */}
        <AACPanel />
        <GestureCamera />

        {/* Tunanetra: voice navigator yang benar-benar eksekusi perintah */}
        <VoiceNavigator />

        {/* Tunarungu: subtitle real-time + visual alert stack */}
        <DeafVisualAlert />

      </AccessibilityProvider>
    </BrowserRouter>
  )
}

export default App