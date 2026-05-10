import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar({ projectName }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: App name + project breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-bold text-white hover:text-primary-400 transition-colors"
          >
            <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            TaskFlow
          </Link>
          {projectName && (
            <>
              <svg className="w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-surface-300 font-medium truncate max-w-[200px]">{projectName}</span>
            </>
          )}
        </div>

        {/* Right: User info + logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="text-sm text-surface-300 hidden sm:block">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm text-surface-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
