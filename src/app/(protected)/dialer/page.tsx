'use client'

import { useState } from 'react'
import { Phone, Delete, User, Search, MoreVertical, Mic, Video, Volume2, Notebook, Save, Clock, Star, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function DialerPage() {
    const [displayNumber, setDisplayNumber] = useState('')
    const [activeTab, setActiveTab] = useState<'keypad' | 'recents' | 'contacts'>('keypad')
    const [isCallActive, setIsCallActive] = useState(false)
    const [callDuration, setCallDuration] = useState('00:00')
    const [note, setNote] = useState('')

    const handleDigitPress = (digit: string) => {
        if (displayNumber.length < 15) {
            setDisplayNumber(prev => prev + digit)
        }
    }

    const handleDelete = () => {
        setDisplayNumber(prev => prev.slice(0, -1))
    }

    const handleCall = (number?: string) => {
        const numToCall = number || displayNumber
        if (!numToCall) {
            toast.error('Please enter a number')
            return
        }
        setIsCallActive(true)
        toast.success(`Calling ${numToCall}...`)
    }

    const handleEndCall = () => {
        setIsCallActive(false)
        toast.info('Call ended')
    }

    const saveNote = () => {
        if (!note.trim()) return
        toast.success('Note saved successfully')
        setNote('')
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

    const contacts = [
        { id: 1, name: 'Alice Smith', number: '(555) 123-4567', type: 'Mobile' },
        { id: 2, name: 'Bob Johnson', number: '(555) 987-6543', type: 'Work' },
        { id: 3, name: 'Charlie Brown', number: '(555) 456-7890', type: 'Home' },
        { id: 4, name: 'David Wilson', number: '(555) 234-5678', type: 'Mobile' },
        { id: 5, name: 'Eva Green', number: '(555) 876-5432', type: 'Work' },
    ]

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6 p-6 overflow-hidden bg-slate-50 dark:bg-[#0B1120]">

            {/* Left Panel: Contacts List (As requested: "Contact No") */}
            <div className="w-72 hidden xl:flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-200">Contacts</h2>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-blue-500">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/10 transition-all border border-transparent focus:border-blue-500/20"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {contacts.map((contact) => (
                        <div
                            key={contact.id}
                            onClick={() => {
                                setDisplayNumber(contact.number)
                                toast.info(`Selected ${contact.name}`)
                            }}
                            className="group flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-inner">
                                {contact.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 dark:text-slate-200 truncate">{contact.name}</div>
                                <div className="text-xs text-slate-500 truncate">{contact.number}</div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleCall(contact.number)
                                }}
                                className="w-8 h-8 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-500 hover:text-white"
                            >
                                <Phone className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Center Panel: The Dialer (Phone UI) */}
            <div className="flex-none w-[380px] flex flex-col mx-auto xl:mx-0">
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-[6px] border-slate-900/5 dark:border-slate-800 overflow-hidden relative">

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

            {/* Right Panel: Notepad (As requested: "Notepad") */}
            <div className="flex-1 min-w-[300px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-yellow-50/50 dark:bg-yellow-900/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                            <Notebook className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Notepad</h2>
                            <p className="text-xs text-slate-500">Take notes during calls</p>
                        </div>
                    </div>
                    <button
                        onClick={saveNote}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                        <Save className="w-3 h-3" />
                        Save
                    </button>
                </div>

                <div className="flex-1 p-4 bg-yellow-50/10 dark:bg-slate-900 relative">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Start typing your call notes here..."
                        className="w-full h-full bg-transparent resize-none outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 text-sm leading-relaxed custom-scrollbar"
                    />
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_24px,rgba(0,0,0,0.05)_25px)] dark:bg-[linear-gradient(transparent_24px,rgba(255,255,255,0.05)_25px)] bg-[length:100%_25px] opacity-50"></div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-400 flex justify-between">
                        <span>{note.length} characters</span>
                        <span>Last saved: Just now</span>
                    </div>
                </div>
            </div>

            {/* Far Right Panel: Stats (Existing) */}
            <div className="w-72 hidden 2xl:block flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        Quick Stats
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Calls Today</div>
                            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">12</div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/30">
                            <div className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider mb-1">Talk Time</div>
                            <div className="text-3xl font-bold text-green-700 dark:text-green-300">45m</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Speed Dial
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <button key={i} className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-2 group">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <User className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">Slot {i}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
