import { AnimatePresence, motion } from 'framer-motion'

export default function ConfirmDialog({
  open,
  title = 'Please Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false
}) {
  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/45 p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        >
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="mt-2 text-sm font-medium text-slate-600">{message}</p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
