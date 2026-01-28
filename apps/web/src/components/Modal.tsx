import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export default function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
    if (!isOpen) return null

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw]'
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`relative bg-card rounded-[2.5rem] border border-app shadow-2xl shadow-black/20 w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-scale-in overflow-hidden transition-colors duration-300`}>
                {/* Premium Gradient Accent */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

                {/* Header */}
                <div className="flex items-center justify-between p-8 pb-4 relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-app tracking-tighter leading-none uppercase">{title}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="h-1 w-10 bg-blue-600 rounded-full"></div>
                            <div className="h-1 w-1.5 bg-blue-600/20 rounded-full"></div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-app hover:bg-rose-500 hover:text-white hover:shadow-xl rounded-2xl border border-app transition-all text-muted group active:scale-95"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 pb-8 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>

                {/* Subtle Footer */}
                <div className="px-8 py-4 bg-app/50 border-t border-app flex items-center justify-center">
                    <div className="w-16 h-1 bg-muted/20 rounded-full"></div>
                </div>
            </div>
        </div>
    )
}
