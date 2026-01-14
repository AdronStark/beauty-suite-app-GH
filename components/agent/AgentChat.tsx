"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { MessageCircle, X, Send, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils/cn"

interface Message {
    role: "user" | "model"
    text: string
}

export function AgentChat() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: "model", text: "¡Hola! Soy tu asistente IA de Labery Beauty. ¿En qué puedo ayudarte hoy?" }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // AUTH & ROUTE GUARD
    // Hide if user is a CLIENT or if explicit portal path
    // Also hide if not authenticated yet (optional, but cleaner)
    const isPortal = pathname?.startsWith("/portal")
    const isClientRole = session?.user?.role === "CLIENT"

    if (isPortal || isClientRole) {
        return null
    }

    // Also hide on login page if needed, but layout usually handles that.
    // Assuming this is in RootLayout, we might want to hide it if session is loading or null?
    // Let's decide to show it only when authenticated to be safe, or just rely on role check.
    // If session is undefined (loading), we might see a flash. Let's return null if no session.
    if (!session?.user) return null

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg = input.trim()
        setInput("")
        setMessages(prev => [...prev, { role: "user", text: userMsg }])
        setIsLoading(true)

        try {
            // Prepare history for API (Gemini expects specific format)
            // history: { role: 'user' | 'model', parts: [{ text: string }] }[]
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }))

            const res = await fetch("/app/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg,
                    history: history
                })
            })

            const data = await res.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setMessages(prev => [...prev, { role: "model", text: data.text }])
        } catch (error) {
            console.error("Chat Error:", error)
            toast.error("Error al conectar con el asistente.")
            setMessages(prev => [...prev, { role: "model", text: "Lo siento, hubo un error al procesar tu solicitud." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
                    isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                )}
            >
                {isOpen ? <X className="text-white w-6 h-6" /> : <Sparkles className="text-white w-6 h-6" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[600px] animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full">
                            <Sparkles className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium text-lg">Beauty AI Assistant</h3>
                            <p className="text-blue-100 text-xs">Desarrollado por Gemini</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 min-h-[300px]"
                    >
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex justify-start",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                                    )}
                                >
                                    {/* Basic markdown parsing could go here, for now raw text */}
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Pregunta sobre ofertas, clientes o ayuda..."
                            className="flex-1 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm placeholder-gray-400"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
