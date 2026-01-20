'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function FloatingChat() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '¡Hola! Soy tu asistente virtual. Puedo ayudarte a utilizar la aplicación o darte información sobre tus datos (ofertas, fórmulas, etc.). ¿En qué puedo ayudarte hoy?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!res.ok) throw new Error('Error en la respuesta del asistente');

            const data = await res.json();

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || 'Lo siento, no he podido procesar tu respuesta.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Disculpa, ha ocurrido un error al conectar con el servidor. Inténtalo de nuevo.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!session) return null;

    return (
        <>
            {/* FLOATING BUTTON (Only if closed) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                        cursor: 'pointer',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Sparkles size={28} />
                </button>
            )}

            {/* CHAT WINDOW */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: isExpanded ? '600px' : '400px',
                    height: isExpanded ? '80vh' : '600px',
                    maxHeight: '90vh',
                    maxWidth: 'calc(100vw - 4rem)',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 9999,
                    border: '1px solid #e2e8f0',
                    transition: 'width 0.3s ease, height 0.3s ease',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: '#eff6ff', color: 'var(--color-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Assistant</h3>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Powered by Gemini</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                title={isExpanded ? "Reducir" : "Ampliar"}
                            >
                                {isExpanded ? <ChevronDown size={20} /> : <MessageSquare size={20} />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        background: '#f8fafc',
                        padding: '1rem',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}
                            >
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                                    borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                                    background: msg.role === 'user' ? 'var(--color-primary)' : 'white',
                                    color: msg.role === 'user' ? 'white' : '#1e293b',
                                    boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                                    border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                                    lineHeight: 1.5,
                                    fontSize: '0.95rem'
                                }}>
                                    {msg.content}
                                </div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: '#94a3b8',
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    padding: '0 4px'
                                }}>
                                    {msg.role === 'user' ? 'Tú' : 'AI'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '6px', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                <Loader2 size={14} className="animate-spin" /> Pensando...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{
                        padding: '1rem',
                        background: 'white',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe tu pregunta..."
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                borderRadius: '24px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                fontSize: '0.95rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: input.trim() ? 'var(--color-primary)' : '#e2e8f0',
                                color: 'white',
                                border: 'none',
                                cursor: input.trim() ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
