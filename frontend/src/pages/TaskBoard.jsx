import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import TaskCard from '../components/TaskCard'
import api from '../api/axios'

const COLUMNS = [
  { key: 'TODO', label: 'To Do', color: 'surface-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'primary-400' },
  { key: 'DONE', label: 'Done', color: 'success' },
]

export default function TaskBoard({ tasks = [], projectId, members = [], myRole, currentUserId }) {
  const isAdmin = myRole === 'ADMIN'
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createStatus, setCreateStatus] = useState('TODO')
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', projectId] })
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${col.color}`} />
                  <h3 className="text-sm font-semibold text-surface-300">{col.label}</h3>
                  <span className="text-xs text-surface-500 bg-surface-800 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                {isAdmin && (
                  <button onClick={() => { setCreateStatus(col.key); setShowCreateModal(true) }} className="text-surface-500 hover:text-primary-400 transition-colors cursor-pointer" title="Add task">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
              </div>
              <div className="space-y-3 min-h-[100px]">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-surface-600 text-xs">No tasks</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          members={members}
          defaultStatus={createStatus}
          onClose={() => setShowCreateModal(false)}
          onCreated={invalidate}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={members}
          myRole={myRole}
          currentUserId={currentUserId}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => { invalidate(); }}
        />
      )}
    </div>
  )
}

function CreateTaskModal({ projectId, members, defaultStatus, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [status, setStatus] = useState(defaultStatus)
  const [dueDate, setDueDate] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/api/projects/${projectId}/tasks`, data),
    onSuccess: () => { onCreated(); onClose() },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create task.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority, status,
      dueDate: dueDate || undefined,
      assignedToId: assignedToId || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Create Task</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white cursor-pointer">✕</button>
        </div>
        {error && <div className="mb-4 p-2 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title *" className="w-full px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition" required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 transition">
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 transition">
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 transition" />
            <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 transition">
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-700/50 hover:bg-surface-700 rounded-lg text-surface-300 font-medium transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-lg text-white font-semibold transition-all cursor-pointer">{mutation.isPending ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskDetailModal({ task, members, myRole, currentUserId, onClose, onUpdated }) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState(task.priority)
  const [status, setStatus] = useState(task.status)
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '')
  const [assignedToId, setAssignedToId] = useState(task.assignedToId || '')
  const [error, setError] = useState('')

  const isAdmin = myRole === 'ADMIN'
  const isAssignedToMe = task.assignedToId === currentUserId
  const canEditStatus = isAdmin || isAssignedToMe

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/api/tasks/${task.id}`, data),
    onSuccess: () => { onUpdated(); onClose() },
    onError: (err) => setError(err.response?.data?.message || 'Failed to update task.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/tasks/${task.id}`),
    onSuccess: () => { onUpdated(); onClose() },
    onError: (err) => setError(err.response?.data?.message || 'Failed to delete task.'),
  })

  const handleSave = (e) => {
    e.preventDefault()
    if (isAdmin) {
      updateMutation.mutate({
        title: title.trim(), description: description.trim() || undefined,
        priority, status, dueDate: dueDate || null,
        assignedToId: assignedToId || null,
      })
    } else if (isAssignedToMe) {
      updateMutation.mutate({ status })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Task Details</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white cursor-pointer">✕</button>
        </div>
        {error && <div className="mb-4 p-2 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">{error}</div>}
        <form onSubmit={handleSave} className="space-y-4">
          {!isAdmin && !isAssignedToMe && (
            <div className="text-xs text-warning bg-warning/10 border border-warning/20 p-2 rounded-lg text-center">
              This task is not assigned to you.
            </div>
          )}
          {isAdmin ? (
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition" required />
          ) : (
            <div className="w-full px-3 py-2.5 bg-surface-800/30 border border-surface-700 rounded-lg text-white">{title}</div>
          )}

          {isAdmin ? (
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition resize-none" placeholder="Description" />
          ) : (
            <div className="w-full px-3 py-2.5 bg-surface-800/30 border border-surface-700 rounded-lg text-white min-h-[44px]">{description || <span className="text-surface-500 italic">No description</span>}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {isAdmin ? (
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 transition">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select>
            ) : (
              <div className="px-3 py-2.5 bg-surface-800/30 border border-surface-700 rounded-lg text-white text-sm">{priority}</div>
            )}
            
            {canEditStatus ? (
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 transition">
                <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option>
              </select>
            ) : (
              <div className="px-3 py-2.5 bg-surface-800/30 border border-surface-700 rounded-lg text-white text-sm">{status}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isAdmin ? (
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 transition" />
            ) : (
              <div className="px-3 py-2.5 bg-surface-800/30 border border-surface-700 rounded-lg text-white text-sm">{dueDate || <span className="text-surface-500 italic">No due date</span>}</div>
            )}
            
            {isAdmin ? (
              <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 transition">
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
              </select>
            ) : (
              <div className="px-3 py-2.5 bg-surface-800/30 border border-surface-700 rounded-lg text-white text-sm">{members.find((m) => m.user.id === assignedToId)?.user.name || <span className="text-surface-500 italic">Unassigned</span>}</div>
            )}
          </div>
          <div className="text-xs text-surface-500">
            Created by {task.createdBy?.name} · {new Date(task.createdAt).toLocaleDateString()}
          </div>
          <div className="flex gap-3 pt-2">
            {isAdmin && (
              <button type="button" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="py-2.5 px-4 bg-danger/10 hover:bg-danger/20 border border-danger/20 rounded-lg text-danger text-sm font-medium transition-colors cursor-pointer">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="py-2.5 px-4 bg-surface-700/50 hover:bg-surface-700 rounded-lg text-surface-300 font-medium transition-colors cursor-pointer">Cancel</button>
            {canEditStatus && (
              <button type="submit" disabled={updateMutation.isPending} className="py-2.5 px-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-lg text-white font-semibold transition-all cursor-pointer">
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
