import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import StudentDashboard from './pages/student/Dashboard'
import StudentModules from './pages/student/Modules'
import StudentPlayground from './pages/student/Playground'
import StudentTasks from './pages/student/Tasks'
import StudentTaskDetail from './pages/student/TaskDetail'
import StudentQuiz from './pages/student/Quiz'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherUploadModule from './pages/teacher/UploadModule'
import TeacherCreateTask from './pages/teacher/CreateTask'
import ParentDashboard from './pages/parent/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/modules" element={<StudentModules />} />
        <Route path="/student/playground" element={<StudentPlayground />} />
        <Route path="/student/tasks" element={<StudentTasks />} />
        <Route path="/student/task/:id" element={<StudentTaskDetail />} />
        <Route path="/student/quiz/:id" element={<StudentQuiz />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/upload" element={<TeacherUploadModule />} />
        <Route path="/teacher/create-task" element={<TeacherCreateTask />} />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App