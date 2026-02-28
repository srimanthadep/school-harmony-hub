import React, { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
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

// --- OpenAI Initialization ---
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const openaiClient = OPENAI_API_KEY
    ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true })
    : null;

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

// --- ChatGPT Logo SVG ---
function ChatGPTLogo({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L7.044 23.86a7.504 7.504 0 0 1-2.747-10.24zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l8.048 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.647-1.13zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v4.999l-4.331 2.5-4.331-2.5V18z" fill="currentColor"/>
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
    const [aiProvider, setAiProvider] = useState<'gemini' | 'chatgpt'>('gemini');
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

            if (aiProvider === 'chatgpt') {
                // --- ChatGPT / OpenAI ---
                if (!OPENAI_API_KEY || !openaiClient) {
                    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env.local file.');
                }

                const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                    { role: 'system', content: systemPrompt },
                    ...newMessages.map(m => ({
                        role: m.role === 'model' ? 'assistant' as const : 'user' as const,
                        content: m.text
                    }))
                ];

                const completion = await openaiClient.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: openaiMessages,
                    max_tokens: 1024,
                    temperature: 0.7
                });

                const responseText = completion.choices[0]?.message?.content || 'No response received.';
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
                setError(aiProvider === 'chatgpt'
                    ? '⚠️ Invalid API key. Please check your VITE_OPENAI_API_KEY in .env.local'
                    : '⚠️ Invalid API key. Please check your VITE_GEMINI_API_KEY in .env.local');
            } else if (msg.includes('API key not configured')) {
                setError(aiProvider === 'chatgpt'
                    ? '⚠️ API key not configured. Please add VITE_OPENAI_API_KEY to .env.local'
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
                                    {aiProvider === 'chatgpt' ? <ChatGPTLogo size={20} /> : <GeminiLogo size={20} />}
                                </div>
                                <div>
                                    <div className="gemini-header-title">SchoolBot</div>
                                    <div className="gemini-header-sub">
                                        <span className="gemini-dot" />
                                        {aiProvider === 'chatgpt' ? 'Powered by ChatGPT' : 'Powered by Gemini AI'}
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
                                        className={`ai-provider-btn${aiProvider === 'chatgpt' ? ' ai-provider-btn--active' : ''}`}
                                        onClick={() => setAiProvider('chatgpt')}
                                        aria-label="Switch to ChatGPT"
                                    >
                                        <ChatGPTLogo size={13} />
                                        <span>ChatGPT</span>
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
                                            {aiProvider === 'chatgpt' ? <ChatGPTLogo size={14} /> : <GeminiLogo size={14} />}
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
                                            {aiProvider === 'chatgpt' ? <ChatGPTLogo size={14} /> : <GeminiLogo size={14} />}
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
                        <div className="gemini-footer">{aiProvider === 'chatgpt' ? 'ChatGPT' : 'Gemini'} may make mistakes. Always verify critical data.</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
