export default function StatusBadge({ status }) {
  const config = {
    TODO: {
      label: 'To Do',
      className: 'bg-surface-700/60 text-surface-300 border-surface-600',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      className: 'bg-primary-500/15 text-primary-400 border-primary-500/30',
    },
    DONE: {
      label: 'Done',
      className: 'bg-success/15 text-success border-success/30',
    },
  }

  const { label, className } = config[status] || config.TODO

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const config = {
    LOW: {
      label: 'Low',
      className: 'bg-success/15 text-success border-success/30',
    },
    MEDIUM: {
      label: 'Medium',
      className: 'bg-warning/15 text-warning border-warning/30',
    },
    HIGH: {
      label: 'High',
      className: 'bg-danger/15 text-danger border-danger/30',
    },
  }

  const { label, className } = config[priority] || config.MEDIUM

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}
