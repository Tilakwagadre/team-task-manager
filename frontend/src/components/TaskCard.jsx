import { PriorityBadge } from './StatusBadge'

export default function TaskCard({ task, onClick }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      onClick={() => onClick?.(task)}
      className="glass-card p-4 cursor-pointer group"
    >
      {/* Header: Title + Priority */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-2">
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-surface-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assignee */}
        <div className="flex items-center gap-1.5">
          {task.assignedTo ? (
            <>
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] text-white font-semibold">
                {task.assignedTo.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-xs text-surface-400 truncate max-w-[80px]">
                {task.assignedTo.name}
              </span>
            </>
          ) : (
            <span className="text-xs text-surface-500 italic">Unassigned</span>
          )}
        </div>

        {/* Due date + Overdue badge */}
        <div className="flex items-center gap-1.5">
          {isOverdue && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger/20 text-danger border border-danger/30 animate-pulse">
              OVERDUE
            </span>
          )}
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-danger' : 'text-surface-400'}`}>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
