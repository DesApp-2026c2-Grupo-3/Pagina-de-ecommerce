import { CircleAlert } from 'lucide-react'

interface ErrorAlertProps {
  message: string
}

function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border-2 border-brand-dark bg-brand-red px-4 py-3 text-white shadow-[4px_4px_0_var(--color-brand-dark)]"
    >
      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm font-bold">{message}</p>
    </div>
  )
}

export default ErrorAlert