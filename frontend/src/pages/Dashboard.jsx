import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import api from '../api/axios'

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/api/projects').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowModal(false)
      setProjectName('')
      setProjectDesc('')
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create project.')
    },
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!projectName.trim()) return
    createMutation.mutate({ name: projectName.trim(), description: projectDesc.trim() || undefined })
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Projects</h1>
            <p className="text-surface-400 mt-1">Manage and organize your team's work</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 rounded-xl text-white font-medium transition-all shadow-lg shadow-primary-500/20 cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Project
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && projects?.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            <h3 className="text-lg font-semibold text-surface-300 mb-2">No projects yet</h3>
            <p className="text-surface-500 mb-6">Create your first project to get started</p>
            <button onClick={() => setShowModal(true)} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 rounded-xl text-white font-medium transition-colors cursor-pointer">Create Project</button>
          </div>
        )}

        {!isLoading && projects?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project, i) => (
              <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="glass-card p-6 cursor-pointer animate-slide-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 border border-primary-500/20 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
                {project.description && <p className="text-sm text-surface-400 mb-4 line-clamp-2">{project.description}</p>}
                <div className="flex items-center gap-4 mt-auto pt-4 border-t border-surface-700/50">
                  <span className="text-xs text-surface-400">{project._count?.members || 0} members</span>
                  <span className="text-xs text-surface-400">{project._count?.tasks || 0} tasks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">New Project</h2>
              <button onClick={() => { setShowModal(false); setError('') }} className="text-surface-400 hover:text-white transition-colors cursor-pointer">✕</button>
            </div>
            {error && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Project Name *</label>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="My Awesome Project" className="w-full px-4 py-3 bg-surface-800/60 border border-surface-700 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-all" required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
                <textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder="Brief description..." rows={3} className="w-full px-4 py-3 bg-surface-800/60 border border-surface-700 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-all resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-surface-700/50 hover:bg-surface-700 rounded-xl text-surface-300 font-medium transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 disabled:opacity-50 rounded-xl text-white font-semibold transition-all cursor-pointer">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
