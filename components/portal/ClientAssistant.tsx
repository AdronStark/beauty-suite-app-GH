'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Phone, Briefcase, ChevronRight } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'options'; // 'options' for buttons like "Talk to Sales"
    options?: { label: string; action: string }[];
}

export default function ClientAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '¡Hola! Soy tu asistente virtual de Labery. ¿En qué puedo ayudarte hoy?',
            type: 'options',
            options: [
                { label: 'Mis Pedidos', action: 'status_orders' },
                { label: 'Mis Proyectos', action: 'status_projects' },
                { label: 'Hablar con un Agente', action: 'human_handoff' }
            ]
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (text: string, action?: string) => {
        if (!text.trim() && !action) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/portal/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, action }),
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                type: data.type || 'text',
                options: data.options
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Lo siento, tuve un problema al procesar tu solicitud. Inténtalo de nuevo.'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleOptionClick = (option: { label: string; action: string }) => {
        handleSendMessage(option.label, option.action);
    };

    return (
        <>
            {/* TOGGLE BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    background: 'linear-gradient(135deg, #3E6AD8 0%, #2563EB 100%)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(62, 106, 216, 0.3)',
                    cursor: 'pointer',
                    zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </button>

            {/* CHAT WINDOW */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '7rem',
                    right: '2rem',
                    width: '380px',
                    height: '600px',
                    maxHeight: 'calc(100vh - 9rem)',
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    {/* HEADER */}
                    <div style={{
                        padding: '16px',
                        background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg) 100%)',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: 'var(--color-primary)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Bot size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-heading)', margin: 0 }}>Asistente Labery</h3>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
                                    En línea ahora
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MESSAGES */}
                    <div style={{
                        flexGrow: 1,
                        padding: '1.25rem',
                        overflowY: 'auto',
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                        background: '#ffffff'
                    }}>
                        {messages.map((msg) => (
                            <div key={msg.id} style={{
                                display: 'flex',
                                flexDirection: 'column', // Prepare for options below text
                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                gap: '0.5rem'
                            }}>
                                <div style={{
                                    maxWidth: '85%',
                                    padding: '0.875rem 1.125rem',
                                    borderRadius: '12px',
                                    borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                                    borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg)',
                                    color: msg.role === 'user' ? 'white' : 'var(--color-text-heading)',
                                    fontSize: '0.925rem',
                                    lineHeight: 1.5,
                                    boxShadow: msg.role === 'assistant' ? 'none' : 'var(--shadow-sm)',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {msg.content}
                                </div>

                                {/* OPTIONS (Quick Actions) */}
                                {msg.type === 'options' && msg.options && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        {msg.options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionClick(opt)}
                                                style={{
                                                    background: 'white',
                                                    border: '1px solid var(--color-border)',
                                                    color: 'var(--color-primary)',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = 'var(--color-secondary)';
                                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'white';
                                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                                }}
                                            >
                                                {opt.label} <ChevronRight size={14} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem', marginLeft: '0.5rem' }}>
                                <div className="typing-dot" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                                <div className="typing-dot" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }}></div>
                                <div className="typing-dot" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }}></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* INPUT AREA */}
                    <div style={{
                        padding: '1rem',
                        borderTop: '1px solid #e2e8f0',
                        background: 'white'
                    }}>
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
                            style={{
                                display: 'flex',
                                gap: '0.75rem',
                                background: '#f8fafc',
                                padding: '0.5rem',
                                borderRadius: '99px',
                                border: '1px solid #e2e8f0'
                            }}
                        >
                            <input
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder="Escribe tu consulta..."
                                style={{
                                    flexGrow: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    color: '#1e293b'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: inputValue.trim() ? '#3E6AD8' : '#cbd5e1',
                                    color: 'white',
                                    border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: inputValue.trim() ? 'pointer' : 'default',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Global Styles for Animations */}
            <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
        </>
    );
}
