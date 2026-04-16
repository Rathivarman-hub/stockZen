import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, Sparkles, XCircle, Mic, MicOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm SmartStock AI — your inventory intelligence assistant. I know your live stock data and can answer questions like \"What's my most valuable item?\" or \"Am I running low on anything?\"", sender: 'bot', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const recognitionRef = useRef(null);
  const { token } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle auto-close on click outside
  useEffect(() => {
    const handleClose = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, [isOpen]);

  // ─── Voice Recognition Setup ─────────────────────────────────────────────────
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported by your browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend   = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ─── Send Message ─────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !token) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user', time: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/chatbot`,
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: data.message,
        sender: 'bot',
        time: new Date(),
        data: data.data,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to the server. Please try again later.",
        sender: 'bot',
        time: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── Quick Prompt Chips ───────────────────────────────────────────────────────
  const QUICK_PROMPTS = ['Inventory summary', 'Show low stock', 'Most valuable items', 'Out of stock'];

  return (
    <div className="chatbot-wrapper" ref={panelRef}>
      {/* Floating Button */}
      <button
        className={`chatbot-toggle btn-primary-glow ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle SmartStock AI Chat"
      >
        <div className="toggle-inner">
          {isOpen ? <XCircle size={28} className="icon-rotate" /> : <Sparkles size={28} className="icon-pulse" />}
        </div>
        {!isOpen && <div className="pulse-ring"></div>}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel glass-panel animate-fade-up">
          {/* Header */}
          <div className="chatbot-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary p-2 rounded-circle">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h6 className="mb-0 fw-bold">SmartStock AI</h6>
                <div className="d-flex align-items-center gap-1">
                  <span className="online-indicator"></span>
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>Context-Aware · Live Data</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="quick-prompts">
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                className="quick-chip"
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.sender} ${msg.sender === 'bot' ? 'animate-fade-left' : 'animate-fade-right'}`}>
                <div className="message-bubble">
                  <p className="mb-0">{msg.text}</p>
                  {msg.data && Array.isArray(msg.data) && (
                    <ul className="mt-2 mb-0 small ps-3">
                      {msg.data.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  )}
                </div>
                <div className="message-time">{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
            {isTyping && (
              <div className="message-wrapper bot animate-fade-left">
                <div className="message-bubble typing">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chatbot-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder={isListening ? "Listening…" : "Ask about your inventory…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={isListening ? { borderColor: 'var(--accent-color)', boxShadow: '0 0 0 3px rgba(0,102,255,0.15)' } : {}}
            />
            {/* Voice button */}
            <button
              type="button"
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleVoice}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button type="submit" disabled={!input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        .chatbot-wrapper {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1200;
        }

        .chatbot-toggle {
          width: 64px;
          height: 64px;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
          position: relative;
          background: linear-gradient(135deg, var(--accent-color), #004ecc) !important;
          box-shadow: 0 8px 25px rgba(0, 102, 255, 0.4);
        }

        .chatbot-toggle.active {
          transform: rotate(180deg);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        }

        .toggle-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.5s;
        }

        .active .toggle-inner { transform: rotate(-180deg); }

        .icon-pulse {
          animation: attractivePulse 2s infinite ease-in-out;
        }

        @keyframes attractivePulse {
          0%   { transform: scale(1);    opacity: 1;   filter: drop-shadow(0 0 0px var(--accent-color)); }
          50%  { transform: scale(1.15); opacity: 0.8; filter: drop-shadow(0 0 10px rgba(255,255,255,0.8)); }
          100% { transform: scale(1);    opacity: 1;   filter: drop-shadow(0 0 0px var(--accent-color)); }
        }

        .pulse-ring {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 4px solid var(--accent-color);
          animation: ringPulse 2s infinite;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes ringPulse {
          0%   { transform: scale(0.9); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0;   }
        }

        .chatbot-panel {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 420px;
          height: 640px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--panel-border);
        }

        .chatbot-header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--panel-border);
          background: linear-gradient(to right, rgba(0,102,255,0.1), transparent);
          flex-shrink: 0;
        }

        .online-indicator {
          width: 8px; height: 8px;
          background: #10B981;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #10B981;
        }

        /* Quick Prompt Chips */
        .quick-prompts {
          display: flex;
          gap: 6px;
          padding: 10px 16px;
          overflow-x: auto;
          border-bottom: 1px solid var(--panel-border);
          flex-shrink: 0;
          scrollbar-width: none;
        }
        .quick-prompts::-webkit-scrollbar { display: none; }

        .quick-chip {
          background: rgba(var(--accent-color-rgb), 0.1);
          color: var(--accent-color);
          border: 1px solid rgba(var(--accent-color-rgb), 0.25);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 0.72rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quick-chip:hover {
          background: rgba(var(--accent-color-rgb), 0.2);
          transform: translateY(-1px);
        }

        .chatbot-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
        }

        .message-wrapper {
          max-width: 90%;
          display: flex;
          flex-direction: column;
        }

        .message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 0.9rem;
          line-height: 1.5;
          letter-spacing: 0.2px;
        }

        .bot .message-bubble {
          background: rgba(120,120,128,0.1);
          border: 1px solid var(--panel-border);
          color: var(--text-main);
          border-bottom-left-radius: 4px;
        }
        body.light-theme .bot .message-bubble { background: rgba(0,0,0,0.05); }

        .user .message-bubble {
          background: linear-gradient(135deg, var(--accent-color), #004ecc);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px rgba(0,102,255,0.2);
          align-self: flex-end;
        }

        .user { align-items: flex-end; }

        .message-time {
          font-size: 0.68rem;
          color: var(--text-muted);
          margin-top: 5px;
          padding: 0 6px;
          opacity: 0.6;
        }

        /* Input Area */
        .chatbot-input {
          padding: 14px 16px;
          border-top: 1px solid var(--panel-border);
          display: flex;
          gap: 8px;
          background: rgba(0,0,0,0.15);
          flex-shrink: 0;
        }
        body.light-theme .chatbot-input { background: rgba(0,0,0,0.03); }

        .chatbot-input input {
          flex: 1;
          background: rgba(255,255,255,0.07);
          border: 1px solid var(--panel-border);
          border-radius: 12px;
          padding: 10px 16px;
          color: var(--text-main);
          font-size: 0.875rem;
          transition: all 0.3s;
        }
        body.light-theme .chatbot-input input { background: #fff; }

        .chatbot-input input:focus {
          outline: none;
          border-color: var(--accent-color);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 3px rgba(0,102,255,0.1);
        }
        body.light-theme .chatbot-input input:focus { background: #fff; }

        .chatbot-input button {
          background: transparent;
          border: none;
          color: var(--accent-color);
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.3s, transform 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .chatbot-input button:hover:not(:disabled) { opacity: 1; transform: scale(1.1); }
        .chatbot-input button:disabled { color: var(--text-muted); cursor: not-allowed; }

        /* Voice button */
        .voice-btn {
          background: transparent !important;
          border: 1px solid var(--panel-border) !important;
          color: var(--text-muted) !important;
          transition: all 0.25s !important;
        }
        .voice-btn:hover { border-color: var(--accent-color) !important; color: var(--accent-color) !important; }
        .voice-btn.listening {
          background: rgba(239,68,68,0.1) !important;
          border-color: #EF4444 !important;
          color: #EF4444 !important;
          animation: micPulse 1s infinite;
        }
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }

        /* Typing dots */
        .typing { display: flex; gap: 4px; padding: 12px 18px; }
        .typing-dot {
          width: 6px; height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: typingPulse 1.5s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingPulse {
          0%, 100% { transform: scale(1);   opacity: 0.4; }
          50%       { transform: scale(1.3); opacity: 1; }
        }

        @media (max-width: 480px) {
          .chatbot-panel {
            width: 310px;
            height: 480px;
            bottom: 70px;
            right: -5px;
          }
          .chatbot-wrapper { bottom: 20px; right: 20px; }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
