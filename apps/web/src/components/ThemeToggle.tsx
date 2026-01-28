import { useThemeStore } from '../store/themeStore'
import { Moon, Sun, Palette } from 'lucide-react'

export default function ThemeToggle() {
    const { theme, setTheme } = useThemeStore()

    const modes = [
        { id: 'dark', icon: Moon, label: 'Dark' },
        { id: 'light', icon: Sun, label: 'Normal' },
        { id: 'blue', icon: Palette, label: 'Blue' },
    ]

    return (
        <div className="relative flex items-center bg-gray-100 rounded-xl p-1 w-[120px] h-10 border border-gray-200 shadow-inner overflow-hidden font-outfit">
            {/* Sliding Background */}
            <div
                className="absolute top-1 bottom-1 w-[36px] bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out border border-gray-100"
                style={{
                    left: theme === 'dark' ? '4px' : theme === 'light' ? '42px' : '80px'
                }}
            />

            {/* Buttons */}
            {modes.map((mode) => {
                const Icon = mode.icon
                const isActive = theme === mode.id
                return (
                    <button
                        key={mode.id}
                        onClick={() => setTheme(mode.id as any)}
                        className={`relative z-10 flex-1 flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
                        title={mode.label}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="text-[6px] font-black uppercase tracking-tighter mt-0.5">{mode.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
