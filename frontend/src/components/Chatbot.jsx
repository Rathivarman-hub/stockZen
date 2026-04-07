import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2, Sparkles, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your SmartStock Assistant. How can I help you manage your inventory today?", sender: 'bot', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  const { token } = useAuth();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !token) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user', time: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const { data } = await axios.post(`${API_URL}/api/chatbot`, 
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: data.message, 
        sender: 'bot', 
        time: new Date(),
        data: data.data 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "I'm having trouble connecting to the server. Please try again later.", 
        sender: 'bot', 
        time: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
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
          <div className="chatbot-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary p-2 rounded-circle">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h6 className="mb-0 fw-bold">SmartStock AI</h6>
                <div className="d-flex align-items-center gap-1">
                  <span className="online-indicator"></span>
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>Online Assistant</span>
                </div>
              </div>
            </div>
          </div>

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

          <form className="chatbot-input" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Type a command (e.g. 'Show low stock')" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
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

        .active .toggle-inner {
          transform: rotate(-180deg);
        }

        .icon-pulse {
          animation: attractivePulse 2s infinite ease-in-out;
        }

        @keyframes attractivePulse {
          0% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 0px var(--accent-color)); }
          50% { transform: scale(1.15); opacity: 0.8; filter: drop-shadow(0 0 10px rgba(255,255,255,0.8)); }
          100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 0px var(--accent-color)); }
        }

        .pulse-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 4px solid var(--accent-color);
          animation: ringPulse 2s infinite;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes ringPulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .chatbot-panel {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 400px;
          height: 600px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chatbot-header {
          padding: 20px;
          border-bottom: 1px solid var(--panel-border);
          background: linear-gradient(to right, rgba(0, 102, 255, 0.1), transparent);
        }

        .online-indicator {
          width: 10px;
          height: 10px;
          background: #10B981;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 10px #10B981;
        }

        .chatbot-messages {
          flex: 1;
          padding: 25px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          scroll-behavior: smooth;
        }

        .message-wrapper {
          max-width: 90%;
          display: flex;
          flex-direction: column;
        }

        .message-bubble {
          padding: 14px 18px;
          border-radius: 20px;
          font-size: 0.95rem;
          line-height: 1.5;
          letter-spacing: 0.2px;
        }

        .bot .message-bubble {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-main);
          border-bottom-left-radius: 4px;
        }

        .user .message-bubble {
          background: linear-gradient(135deg, var(--accent-color), #004ecc);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px rgba(0, 102, 255, 0.2);
        }

        .message-time {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 6px;
          padding: 0 8px;
          opacity: 0.6;
        }

        .chatbot-input {
          padding: 20px;
          border-top: 1px solid var(--panel-border);
          display: flex;
          gap: 12px;
          background: rgba(0, 0, 0, 0.2);
        }

        .chatbot-input input {
          flex: 1;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 18px;
          color: var(--text-main);
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chatbot-input input:focus {
          outline: none;
          border-color: var(--accent-color);
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
        }

        .chatbot-input button {
          background: transparent;
          border: none;
          color: var(--accent-color);
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.3s, transform 0.3s;
        }

        .chatbot-input button:hover:not(:disabled) {
          opacity: 1;
          transform: scale(1.1);
        }

        .chatbot-input button:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }

        /* Typing Animation */
        .typing {
          display: flex;
          gap: 4px;
          padding: 12px 20px;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: typingPulse 1.5s infinite ease-in-out;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        @media (max-width: 480px) {
          .chatbot-panel {
            width: 300px;
            height: 400px;
            bottom: 65px;
            right: -10px;
          }
          .chatbot-wrapper {
            bottom: 20px;
            right: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
