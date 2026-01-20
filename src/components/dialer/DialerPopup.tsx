'use client'

import { useState, useEffect } from 'react'
import { Phone, Delete, User, MoreVertical, Mic, Video, Volume2, Notebook, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DialerPopupProps {
    isOpen: boolean;
    onClose: () => void;
    initialNumber?: string;
}

export default function DialerPopup({ isOpen, onClose, initialNumber = '' }: DialerPopupProps) {
    const [displayNumber, setDisplayNumber] = useState(initialNumber)
    const [activeTab, setActiveTab] = useState<'keypad' | 'recents' | 'contacts'>('keypad')
    const [isCallActive, setIsCallActive] = useState(false)
    const [callDuration, setCallDuration] = useState('00:00')

    useEffect(() => {
        if (isOpen) {
            setDisplayNumber(initialNumber)
        }
    }, [isOpen, initialNumber])

    if (!isOpen) return null;

    const handleDigitPress = (digit: string) => {
        if (displayNumber.length < 15) {
            setDisplayNumber(prev => prev + digit)
        }
    }

    const handleDelete = () => {
        setDisplayNumber(prev => prev.slice(0, -1))
    }

    const handleCall = () => {
        if (!displayNumber) {
            toast.error('Please enter a number')
            return
        }
        setIsCallActive(true)
        toast.success(`Calling ${displayNumber}...`)
    }

    const handleEndCall = () => {
        setIsCallActive(false)
        toast.info('Call ended')
        // Optional: Close popup after call ends?
        // onClose() 
    }

    const digits = [
        { value: '1', label: '' },
        { value: '2', label: 'ABC' },
        { value: '3', label: 'DEF' },
        { value: '4', label: 'GHI' },
        { value: '5', label: 'JKL' },
        { value: '6', label: 'MNO' },
        { value: '7', label: 'PQRS' },
        { value: '8', label: 'TUV' },
        { value: '9', label: 'WXYZ' },
        { value: '*', label: '' },
        { value: '0', label: '+' },
        { value: '#', label: '' },
    ]

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative w-[380px] h-[800px] max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-[6px] border-slate-900/5 dark:border-slate-800 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button specific to popup */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Phone Header */}
                <div className="pt-6 pb-2 px-6 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">Phone</div>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 mb-4">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                        {(['keypad', 'recents', 'contacts'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-all duration-300",
                                    activeTab === tab
                                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-100"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative">
                    {/* Keypad View */}
                    <div className={cn("absolute inset-0 flex flex-col transition-opacity duration-300", activeTab === 'keypad' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
                        {/* Display Screen */}
                        <div className="h-[25%] flex flex-col items-center justify-center p-6 space-y-2">
                            <span className={cn(
                                "text-4xl font-light text-slate-900 dark:text-white transition-all tracking-tight",
                                displayNumber.length > 10 && "text-3xl",
                                displayNumber.length > 15 && "text-2xl"
                            )}>
                                {displayNumber || <span className="text-slate-300 dark:text-slate-700">...</span>}
                            </span>
                            {displayNumber && (
                                <button
                                    className="text-blue-500 text-xs font-semibold hover:text-blue-600 tracking-wide uppercase transition-colors"
                                >
                                    Add to Contacts
                                </button>
                            )}
                        </div>

                        {/* Numpad */}
                        <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/30 rounded-t-[2.5rem] p-6 pb-8 backdrop-blur-sm">
                            <div className="grid grid-cols-3 gap-x-6 gap-y-5 h-full content-center">
                                {digits.map((digit) => (
                                    <button
                                        key={digit.value}
                                        onClick={() => handleDigitPress(digit.value)}
                                        className="group flex flex-col items-center justify-center w-16 h-16 rounded-full hover:bg-white dark:hover:bg-slate-700 active:bg-blue-50 dark:active:bg-slate-600 transition-all duration-200 mx-auto"
                                    >
                                        <span className="text-2xl font-medium text-slate-700 dark:text-slate-200 group-active:scale-90 transition-transform">{digit.value}</span>
                                        {digit.label && <span className="text-[9px] text-slate-400 font-bold tracking-widest -mt-1">{digit.label}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="h-24 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center gap-10 pb-4">
                            <div className="w-14 flex justify-center">
                                {displayNumber && (
                                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-3 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-all">
                                        <Video className="w-6 h-6" />
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => handleCall()}
                                className="w-16 h-16 bg-gradient-to-tr from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300 text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-green-500/30 transform active:scale-95 transition-all duration-200"
                            >
                                <Phone className="w-8 h-8 fill-current" />
                            </button>

                            <div className="w-14 flex justify-center">
                                {displayNumber && (
                                    <button
                                        onClick={handleDelete}
                                        onContextMenu={(e) => {
                                            e.preventDefault()
                                            setDisplayNumber('')
                                        }}
                                        className="text-slate-400 hover:text-red-500 p-3 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-all"
                                    >
                                        <Delete className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Call Overlay */}
                {isCallActive && (
                    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center text-4xl font-bold border-4 border-slate-700/50 shadow-2xl relative">
                                    {displayNumber[0]}
                                    <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse"></div>
                                    <div className="absolute -inset-2 rounded-full border border-white/5 animate-ping"></div>
                                </div>
                                <div className="text-center space-y-1">
                                    <div className="text-2xl font-semibold text-white tracking-tight">{displayNumber}</div>
                                    <div className="text-slate-400 font-medium">{callDuration} • Calling...</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                                {[
                                    { icon: Mic, label: 'Mute' },
                                    { icon: Volume2, label: 'Speaker' },
                                    { icon: Video, label: 'Video' },
                                    { icon: Notebook, label: 'Note' },
                                    { icon: User, label: 'Add' },
                                    { icon: MoreVertical, label: 'More' },
                                ].map((opt, i) => (
                                    <button key={i} className="flex flex-col items-center gap-2 group">
                                        <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 group-hover:bg-slate-700 group-hover:border-slate-600 flex items-center justify-center transition-all">
                                            <opt.icon className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pb-10 flex justify-center">
                            <button
                                onClick={handleEndCall}
                                className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/20 transform hover:scale-105 active:scale-95 transition-all"
                            >
                                <Phone className="w-8 h-8 fill-current rotate-[135deg]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
