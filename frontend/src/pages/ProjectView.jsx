import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Navbar from '../components/Navbar'
import ProjectSidebar from '../components/ProjectSidebar'
import TaskBoard from './TaskBoard'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'

export default function ProjectView() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('tasks')

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/api/projects/${id}`).then((r) => r.data),
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/api/projects/${id}/tasks`).then((r) => r.data),
  })

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard', id],
    queryFn: () => api.get(`/api/projects/${id}/dashboard`).then((r) => r.data),
    enabled: activeTab === 'dashboard',
  })

  // STEP A: Fetch and store the current user's role per project
  const myRole = project?.members?.find(m => m.user.id === user?.id)?.role ?? 'MEMBER';
  const isAdmin = myRole === 'ADMIN';

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate('/dashboard')
    },
  })

  if (loadingProject) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar projectName={project?.name} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8 animate-fade-in">
          <ProjectSidebar project={project} currentUserId={user?.id} myRole={myRole} />
          <div className="flex-1 min-w-0">
            {/* Tabs + Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-1 bg-surface-800/50 p-1 rounded-xl">
                {['tasks', 'dashboard'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tab ? 'bg-primary-600 text-white shadow-lg' : 'text-surface-400 hover:text-white'}`}>
                    {tab === 'tasks' ? 'Tasks' : 'Dashboard'}
                  </button>
                ))}
              </div>
              {isAdmin && (
                <button onClick={() => { if (confirm('Delete this project and all its data?')) deleteMutation.mutate() }} className="text-xs text-surface-500 hover:text-danger transition-colors cursor-pointer">Delete Project</button>
              )}
            </div>

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <TaskBoard tasks={tasks} projectId={id} members={project?.members || []} myRole={myRole} currentUserId={user?.id} />
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && dashboard && (
              <DashboardStats dashboard={dashboard} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function DashboardStats({ dashboard }) {
  const [showOverdue, setShowOverdue] = useState(false)
  const statusCards = [
    { label: 'Total Tasks', value: dashboard.totalTasks, color: 'from-primary-500/20 to-primary-700/20', border: 'border-primary-500/20', text: 'text-primary-400' },
    { label: 'To Do', value: dashboard.byStatus.TODO, color: 'from-surface-600/20 to-surface-700/20', border: 'border-surface-500/20', text: 'text-surface-300' },
    { label: 'In Progress', value: dashboard.byStatus.IN_PROGRESS, color: 'from-warning/10 to-warning/5', border: 'border-warning/20', text: 'text-warning' },
    { label: 'Done', value: dashboard.byStatus.DONE, color: 'from-success/10 to-success/5', border: 'border-success/20', text: 'text-success' },
  ]

  const chartData = dashboard.byUser.map((u) => ({ name: u.name, tasks: u.taskCount }))
  const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card) => (
          <div key={card.label} className={`glass-card p-5 bg-gradient-to-br ${card.color} border ${card.border}`}>
            <p className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.text}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Overdue Card */}
      <div className={`glass-card p-5 border ${dashboard.overdue.length > 0 ? 'border-danger/30 bg-danger/5' : 'border-surface-700'}`}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowOverdue(!showOverdue)}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-semibold text-surface-200">Overdue Tasks</span>
          </div>
          <span className={`text-2xl font-bold ${dashboard.overdue.length > 0 ? 'text-danger' : 'text-success'}`}>{dashboard.overdue.length}</span>
        </div>
        {showOverdue && dashboard.overdue.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-surface-700/50 pt-4">
            {dashboard.overdue.map((task) => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <span className="text-surface-300">{task.title}</span>
                <span className="text-xs text-danger">{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks per User Chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">Tasks per Member</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 50)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
              <Bar dataKey="tasks" radius={[0, 6, 6, 0]} barSize={24}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
