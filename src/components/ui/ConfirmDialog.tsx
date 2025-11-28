import { createContext, useContext, useState, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'

type ConfirmOptions = {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context
}

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)
    return new Promise((resolve) => {
      setResolveRef(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    setIsOpen(false)
    resolveRef?.(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolveRef?.(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {/* 对话框 */}
      {isOpen && options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />
          {/* 对话框内容 */}
          <div className="relative w-full max-w-sm animate-scale-up rounded-3xl bg-white p-6 shadow-2xl">
            {options.danger && (
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            )}
            <h3 className="text-center text-lg font-semibold">{options.title}</h3>
            <p className="mt-2 text-center text-sm text-ios-muted">
              {options.message}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-2xl border border-ios-border py-3 font-medium text-ios-text active:bg-gray-100"
              >
                {options.cancelText || '取消'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 rounded-2xl py-3 font-semibold text-white active:opacity-80 ${
                  options.danger ? 'bg-red-500' : 'bg-ios-primary'
                }`}
              >
                {options.confirmText || '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

