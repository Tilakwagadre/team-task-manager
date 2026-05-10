import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

export default function ProjectSidebar({ project, currentUserId, myRole }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const isAdmin = myRole === 'ADMIN'

  const addMemberMutation = useMutation({
    mutationFn: (data) => api.post(`/api/projects/${project.id}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      setEmail('')
      setRole('MEMBER')
      setError('')
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to add member.')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => api.delete(`/api/projects/${project.id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] })
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to remove member.')
    },
  })

  const handleAddMember = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    addMemberMutation.mutate({ email: email.trim(), role })
  }

  return (
    <aside className="w-72 shrink-0 space-y-6">
      {/* Project Info */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-bold text-white mb-1">{project?.name}</h2>
        {project?.description && (
          <p className="text-sm text-surface-400">{project.description}</p>
        )}
      </div>

      {/* Members */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">
          Members ({project?.members?.length || 0})
        </h3>
        <div className="space-y-3">
          {project?.members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs text-white font-semibold">
                  {member.user.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white leading-tight">{member.user.name}</p>
                  <p className="text-[10px] text-surface-500">{member.role}</p>
                </div>
              </div>
              {isAdmin && member.user.id !== currentUserId && (
                <button
                  onClick={() => removeMemberMutation.mutate(member.user.id)}
                  className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-danger transition-all p-1 cursor-pointer"
                  title="Remove member"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Form (Admin only) */}
      {isAdmin && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">
            Add Member
          </h3>
          {error && (
            <div className="mb-3 p-2 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">
              {error}
            </div>
          )}
          <form onSubmit={handleAddMember} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@email.com"
              className="w-full px-3 py-2 bg-surface-800/60 border border-surface-700 rounded-lg text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-surface-800/60 border border-surface-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="submit"
              disabled={addMemberMutation.isPending}
              className="w-full py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer"
            >
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      )}
    </aside>
  )
}
