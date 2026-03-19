import React from 'react'
import { Link } from 'react-router-dom'

export default function Tasks() {
  const tasks = [
    { id: 1, title: 'PR Matematika', deadline: '2025-03-20' },
    { id: 2, title: 'Membaca Bab 3', deadline: '2025-03-22' },
  ]

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Tugas Saya</h1>
      <ul className="mt-4 space-y-2">
        {tasks.map(task => (
          <li key={task.id} className="border p-3 rounded">
            <Link to={`/student/task/${task.id}`} className="text-primary font-medium">
              {task.title}
            </Link>
            <p className="text-sm text-gray-600">Deadline: {task.deadline}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}