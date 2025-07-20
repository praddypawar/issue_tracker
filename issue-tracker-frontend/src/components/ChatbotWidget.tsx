import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

const ASK_CHATBOT = gql`
  mutation AskChatbot($question: String!) {
    askChatbot(question: $question)
  }
`;

const ChatbotWidget: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
    const [askChatbot, { loading }] = useMutation(ASK_CHATBOT);

    const handleSend = async () => {
        if (!input.trim()) return;
        setMessages((msgs) => [...msgs, { role: 'user', text: input }]);
        setInput('');
        try {
            const { data } = await askChatbot({ variables: { question: input } });
            setMessages((msgs) => [...msgs, { role: 'bot', text: data.askChatbot }]);
        } catch (e) {
            setMessages((msgs) => [...msgs, { role: 'bot', text: 'Sorry, something went wrong.' }]);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
            {open ? (
                <div className="bg-white shadow-xl rounded-lg w-80 max-h-[70vh] flex flex-col border border-gray-200">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-indigo-600 rounded-t-lg">
                        <span className="text-white font-semibold">Project Chatbot</span>
                        <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200">×</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {messages.length === 0 && (
                            <div className="text-gray-400 text-sm">Ask about issues, tags, users, or assignments!</div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                                <span className={msg.role === 'user' ? 'inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg mb-1' : 'inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-lg mb-1'}>
                                    {msg.text}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center border-t p-2 bg-gray-50">
                        <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="Type your question..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            disabled={loading || !input.trim()}
                        >
                            {loading ? '...' : 'Send'}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setOpen(true)}
                    className="bg-indigo-600 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-2xl hover:bg-indigo-700 focus:outline-none"
                    title="Ask Project Chatbot"
                >
                    💬
                </button>
            )}
        </div>
    );
};

export default ChatbotWidget; 