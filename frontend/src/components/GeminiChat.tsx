import React, { useState, useRef, useEffect } from 'react';
// import MistralAI if needed, but we'll use consistent fetch for simplicity and less dependencies
import { motion, AnimatePresence } from 'framer-motion';
import API from '../utils/api';

// --- Types ---
interface Message {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

interface GeminiContext {
    studentData?: any;
    staffData?: any;
    attendanceData?: any;
    financialSummary?: any;
}

// --- Gemini API Key ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// --- Mistral AI Configuration ---
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || '';
const MISTRAL_MODEL = 'mistral-large-latest'; // or 'mistral-small-latest' for cheaper use

// Use gemini-2.5-flash — latest model with best performance and quota
const MODEL_NAME = 'gemini-2.5-flash';

const BASE_SYSTEM_PROMPT = `You are SchoolBot, an intelligent AI assistant for Oxford School, Chityala's Fee Management System.

IMPORTANT: Answer ONLY based on the REAL SCHOOL DATA provided below. Do NOT make up or imagine any data.
- If data is not provided or you don't have information, say "I don't have this information in the system"
- Always cite specific numbers, names, and facts from the provided data
- Be accurate and honest about what data is available in the system

You help with:
- Fee collections, pending dues, and payment history
- Student information and management
- Staff and salary information
- Attendance tracking
- Reports and data analysis
- System usage guidance

Keep answers concise, helpful, and professional. Use bullet points where helpful.
Always be friendly and supportive.`;

// --- Gemini Logo SVG ---
function GeminiLogo({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 28C14 26.0633 13.6267 24.2433 12.88 22.54C12.1567 20.8367 11.165 19.355 9.905 18.095C8.645 16.835 7.16333 15.8433 5.46 15.12C3.75667 14.3733 1.93667 14 0 14C1.93667 14 3.75667 13.6383 5.46 12.915C7.16333 12.1683 8.645 11.165 9.905 9.905C11.165 8.645 12.1567 7.16333 12.88 5.46C13.6267 3.75667 14 1.93667 14 0C14 1.93667 14.3617 3.75667 15.085 5.46C15.8317 7.16333 16.835 8.645 18.095 9.905C19.355 11.165 20.8367 12.1683 22.54 12.915C24.2433 13.6383 26.0633 14 28 14C26.0633 14 24.2433 14.3733 22.54 15.12C20.8367 15.8433 19.355 16.835 18.095 18.095C16.835 19.355 15.8317 20.8367 15.085 22.54C14.3617 24.2433 14 26.0633 14 28Z" fill="url(#gemini_gradient)" />
            <defs>
                <linearGradient id="gemini_gradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="50%" stopColor="#9B72CB" />
                    <stop offset="100%" stopColor="#D96570" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// --- Mistral Logo SVG ---
function MistralLogo({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 20L50 40L90 20L50 60L10 20Z" fill="currentColor" />
            <path d="M10 80L50 60L90 80L50 40L10 80Z" fill="currentColor" fillOpacity="0.8" />
        </svg>
    );
}

// --- Markdown-lite renderer ---
function renderMarkdown(text: string) {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.startsWith('### ')) {
            elements.push(<h4 key={i} style={{ margin: '10px 0 4px', fontSize: 13, fontWeight: 700 }}>{line.slice(4)}</h4>);
        } else if (line.startsWith('## ')) {
            elements.push(<h3 key={i} style={{ margin: '10px 0 4px', fontSize: 14, fontWeight: 700 }}>{line.slice(3)}</h3>);
        } else if (line.startsWith('**') && line.endsWith('**')) {
            elements.push(<strong key={i} style={{ display: 'block', marginBottom: 2 }}>{line.slice(2, -2)}</strong>);
        } else if (line.match(/^[-*•]\s/)) {
            elements.push(
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 1 }}>•</span>
                    <span>{renderInline(line.slice(2))}</span>
                </div>
            );
        } else if (line.trim() === '') {
            elements.push(<div key={i} style={{ height: 6 }} />);
        } else {
            elements.push(<p key={i} style={{ margin: '2px 0', lineHeight: 1.6 }}>{renderInline(line)}</p>);
        }
        i++;
    }
    return elements;
}

function renderInline(text: string): React.ReactNode {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return (
                <code key={idx} style={{
                    background: 'rgba(0,0,0,0.1)', padding: '1px 5px',
                    borderRadius: 4, fontSize: '0.9em', fontFamily: 'monospace'
                }}>{part.slice(1, -1)}</code>
            );
        }
        return part;
    });
}

// --- Main Chat Component ---
export default function GeminiChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [aiProvider, setAiProvider] = useState<'gemini' | 'mistral'>('gemini');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            text: "👋 Hi! I'm **SchoolBot**, your AI assistant for Oxford School. I can help you with fee management, student records, reports, staff information, and more!\n\nWhat would you like to know?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [geminiContext, setGeminiContext] = useState<GeminiContext | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch real data from backend when component mounts
    useEffect(() => {
        const fetchContext = async () => {
            try {
                const response = await API.get('/gemini/context');
                setGeminiContext(response.data);
            } catch (err: any) {
                console.error('Error fetching Gemini context:', err);
                // Non-critical error, chat can still work without context
            }
        };
        fetchContext();
    }, []);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Build conversation history for multi-turn context (Gemini format)
    const buildHistory = (msgs: Message[]) => msgs.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
    }));

    // Build system prompt enriched with real school data
    const buildSystemPromptWithContext = () => {
        let prompt = BASE_SYSTEM_PROMPT;
        if (!geminiContext) return prompt;

        prompt += `\n\n===== REAL SCHOOL DATA (Current) =====\n`;

        if (geminiContext.studentData) {
            prompt += `\nSTUDENT DATA:\n`;
            prompt += `- Total Students: ${geminiContext.studentData.total}\n`;
            prompt += `- Fee Status: Paid (${geminiContext.studentData.byFeeStatus?.paid || 0}), Partial (${geminiContext.studentData.byFeeStatus?.partial || 0}), Unpaid (${geminiContext.studentData.byFeeStatus?.unpaid || 0}), Zero Fee (${geminiContext.studentData.byFeeStatus?.zero || 0})\n`;
            if (geminiContext.studentData.studentsWithZeroFee?.length > 0) {
                prompt += `- Students with Zero Tuition Fee (${geminiContext.studentData.studentsWithZeroFee.length}): ${geminiContext.studentData.studentsWithZeroFee.map((s: any) => s.name).join(', ')}\n`;
            }
        }

        if (geminiContext.financialSummary) {
            prompt += `\nFINANCIAL SUMMARY:\n`;
            prompt += `- Total Fee Collected: ₹${geminiContext.financialSummary.totalFeeCollected || 0}\n`;
            prompt += `- Total Fee Pending: ₹${geminiContext.financialSummary.totalFeePending || 0}\n`;
            prompt += `- Collection Rate: ${geminiContext.financialSummary.percentageCollected || 0}%\n`;
        }

        if (geminiContext.staffData) {
            prompt += `\nSTAFF DATA:\n`;
            prompt += `- Total Staff: ${geminiContext.staffData.total}\n`;
            if (geminiContext.staffData.list?.length > 0) {
                prompt += `- Staff: ${geminiContext.staffData.list.map((s: any) => `${s.name} (${s.role})`).join(', ')}\n`;
            }
        }

        if (geminiContext.attendanceData?.today) {
            prompt += `\nTODAY'S ATTENDANCE:\n`;
            prompt += `- Students Present: ${geminiContext.attendanceData.today.studentPresent}\n`;
            prompt += `- Students Absent: ${geminiContext.attendanceData.today.studentAbsent}\n`;
            prompt += `- Staff Present: ${geminiContext.attendanceData.today.staffPresent}\n`;
        }

        prompt += `\n=====================================\n`;
        return prompt;
    };

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMsg: Message = { role: 'user', text: trimmed, timestamp: new Date() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        setError('');

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            const systemPrompt = buildSystemPromptWithContext();

            if (aiProvider === 'mistral') {
                // --- Mistral AI ---
                if (!MISTRAL_API_KEY) {
                    throw new Error('Mistral API key not configured. Please add VITE_MISTRAL_API_KEY to your .env.local file.');
                }

                const mistralMessages = [
                    { role: 'system', content: systemPrompt },
                    ...newMessages.map(m => ({
                        role: m.role === 'model' ? 'assistant' : 'user',
                        content: m.text
                    }))
                ];

                const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${MISTRAL_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: MISTRAL_MODEL,
                        messages: mistralMessages,
                        max_tokens: 1024,
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData?.error?.message || `Mistral API ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const responseText = data?.choices?.[0]?.message?.content || 'No response received.';
                setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
            } else {
                // --- Gemini ---
                if (!GEMINI_API_KEY) {
                    throw new Error('API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
                }

                // Use v1 API with gemini-2.5-flash
                const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

                const contents = [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt + '\n\nUser Question: ' + newMessages[newMessages.length - 1].text }]
                    },
                    ...buildHistory(newMessages.slice(0, -1))
                ];

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: contents,
                        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
                    })
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    const errMsg = errData?.error?.message || res.statusText;
                    console.error('Gemini API error details:', { status: res.status, error: errData });
                    if (res.status === 429) throw new Error('429 ' + errMsg);
                    if (res.status === 404) throw new Error('404 Model not found: ' + MODEL_NAME);
                    if (res.status === 400) throw new Error('400 Bad request: ' + errMsg);
                    if (res.status === 403) throw new Error('403 API key invalid or not authorized');
                    throw new Error(errData?.error?.message || `HTTP ${res.status}: ${errMsg}`);
                }

                const data = await res.json();
                const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
                setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
            }
        } catch (err: any) {
            const msg = err?.message || '';
            if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
                setError('⚠️ API quota exceeded. Please wait a minute and try again.');
            } else if (msg.includes('404')) {
                setError('⚠️ Model not found. The API key or model may be invalid.');
            } else if (msg.includes('403') || msg.toLowerCase().includes('api key')) {
                setError(aiProvider === 'mistral'
                    ? '⚠️ Invalid API key. Please check your VITE_MISTRAL_API_KEY in .env.local'
                    : '⚠️ Invalid API key. Please check your VITE_GEMINI_API_KEY in .env.local');
            } else if (msg.includes('API key not configured')) {
                setError(aiProvider === 'mistral'
                    ? '⚠️ API key not configured. Please add VITE_MISTRAL_API_KEY to .env.local'
                    : '⚠️ API key not configured. Please add VITE_GEMINI_API_KEY to .env.local');
            } else {
                setError('❌ Failed to get response: ' + (msg || 'Unknown error'));
            }
            console.error('AI chat error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'model',
            text: "Chat cleared! 🗑️ How can I help you?",
            timestamp: new Date()
        }]);
        setError('');
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const quickQuestions = [
        "How to record a fee payment?",
        "Explain the dashboard stats",
        "How to promote students?",
        "How to generate a salary slip?"
    ];

    return (
        <>
            {/* Floating Button */}
            <motion.button
                id="gemini-chat-btn"
                className="gemini-fab"
                onClick={() => setIsOpen(o => !o)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Ask SchoolBot (AI)"
                aria-label="Open Gemini AI chat"
            >
                <motion.img
                    src="/gemini-logo.png"
                    alt="Gemini AI"
                    animate={{
                        scale: [1, 1.12, 1],
                        rotate: [0, 8, -8, 0]
                    }}
                    transition={{
                        scale: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
                    }}
                    style={{ width: 38, height: 38, objectFit: 'contain' }}
                />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="gemini-chat-window"
                        initial={{ opacity: 0, scale: 0.85, y: 20, originX: 0, originY: 1 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    >
                        {/* Header */}
                        <div className="gemini-header">
                            <div className="gemini-header-info">
                                <div className="gemini-header-logo">
                                    {aiProvider === 'mistral' ? <MistralLogo size={20} /> : <GeminiLogo size={20} />}
                                </div>
                                <div>
                                    <div className="gemini-header-title">SchoolBot</div>
                                    <div className="gemini-header-sub">
                                        <span className="gemini-dot" />
                                        {aiProvider === 'mistral' ? 'Powered by Mistral AI' : 'Powered by Gemini AI'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {/* AI Provider Toggle */}
                                <div className="ai-provider-toggle" title="Switch AI provider">
                                    <button
                                        className={`ai-provider-btn${aiProvider === 'gemini' ? ' ai-provider-btn--active' : ''}`}
                                        onClick={() => setAiProvider('gemini')}
                                        aria-label="Switch to Gemini"
                                    >
                                        <GeminiLogo size={13} />
                                        <span>Gemini</span>
                                    </button>
                                    <button
                                        className={`ai-provider-btn${aiProvider === 'mistral' ? ' ai-provider-btn--active' : ''}`}
                                        onClick={() => setAiProvider('mistral')}
                                        aria-label="Switch to Mistral"
                                    >
                                        <MistralLogo size={13} />
                                        <span>Mistral</span>
                                    </button>
                                </div>
                                <button
                                    className="gemini-icon-btn"
                                    onClick={clearChat}
                                    title="Clear conversation"
                                    aria-label="Clear chat"
                                >🗑️</button>
                                <button
                                    className="gemini-icon-btn"
                                    onClick={() => setIsOpen(false)}
                                    title="Close"
                                    aria-label="Close chat"
                                >✕</button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="gemini-messages">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    className={`gemini-msg gemini-msg-${msg.role}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {msg.role === 'model' && (
                                        <div className="gemini-avatar">
                                            {aiProvider === 'mistral' ? <MistralLogo size={14} /> : <GeminiLogo size={14} />}
                                        </div>
                                    )}
                                    <div className="gemini-bubble">
                                        <div className="gemini-bubble-text">
                                            {renderMarkdown(msg.text)}
                                        </div>
                                        <div className="gemini-bubble-time">{formatTime(msg.timestamp)}</div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading indicator */}
                            {loading && (
                                <motion.div
                                    className="gemini-msg gemini-msg-model"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="gemini-avatar">
                                        {aiProvider === 'mistral' ? <MistralLogo size={14} /> : <GeminiLogo size={14} />}
                                    </div>
                                    <div className="gemini-bubble">
                                        <div className="gemini-typing">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="gemini-error">{error}</div>
                            )}

                            {/* Quick questions (only at start) */}
                            {messages.length === 1 && !loading && (
                                <div className="gemini-quick-qs">
                                    <div className="gemini-quick-label">Quick questions:</div>
                                    {quickQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            className="gemini-quick-btn"
                                            onClick={() => { setInput(q); inputRef.current?.focus(); }}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="gemini-input-area">
                            <div className="gemini-input-pill">
                                <textarea
                                    ref={inputRef}
                                    className="gemini-input"
                                    placeholder="Message SchoolBot..."
                                    value={input}
                                    onChange={e => {
                                        setInput(e.target.value);
                                        // auto-grow
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
                                    }}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                    disabled={loading}
                                />
                                <motion.button
                                    className={`gemini-send-btn${(!input.trim() && !loading) ? ' gemini-send-btn--disabled' : ''}`}
                                    onClick={sendMessage}
                                    disabled={loading || !input.trim()}
                                    whileHover={input.trim() ? { scale: 1.08 } : {}}
                                    whileTap={input.trim() ? { scale: 0.92 } : {}}
                                    aria-label="Send message"
                                >
                                    {loading ? (
                                        <span className="gemini-send-spinner" />
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                        </svg>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                        <div className="gemini-footer">{aiProvider === 'mistral' ? 'Mistral' : 'Gemini'} may make mistakes. Always verify critical data.</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
