import { CircleAlert } from 'lucide-react'

interface ErrorAlertProps {
  message: string
}

function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null

  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border-2 border-brand-red/40 bg-brand-red/5 px-4 py-3">
      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
      <p className="text-sm font-semibold text-brand-red">{message}</p>
    </div>
  )
}

export default ErrorAlert