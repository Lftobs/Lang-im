import { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import MessageBubble from './component/MessageBubble';
import './App.css';
import { detectLanguage, summarizeText, translateText } from './utils/lib';
import { toast, ToastContainer } from 'react-toastify';

type Message = {
  id: string;
  text: string;
  language?: string;
  dectectedLanguage?: string;
  selectedLanguage?: string;
  summary?: string;
  translation?: string;
};

type Chat = {
  id: string;
  messages: Message[];
  timestamp: number;
};

export default function TextProcessor() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat>({ id: Date.now().toString(), messages: [], timestamp: Date.now() });
  const [selectedLanguage, setSelectedLanguage] = useState<string>('es');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>('');
  const savedChats: Chat[] = JSON.parse(localStorage.getItem('savedChat') || '[]');


  useEffect(() => {
    if (!("ai" in self)) {
      toast.warn("This browser environment doesn't support the required AI capabilities.");
    }
    let chats = localStorage.getItem('savedChat');
    if (chats) {
      const parsedChats = JSON.parse(chats);
      const lastItem = parsedChats[parsedChats.length - 1];
      setMessages(lastItem?.messages);
      setActive(lastItem?.id);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = { id: Date.now().toString(), text: inputText };
    setMessages(prev => [...prev, newMessage]);
    setChat(prevChat => ({
      ...prevChat,
      messages: [...messages, newMessage],
      timestamp: Date.now()
    }));
    setInputText('');

    try {
      setIsProcessing(true);
      const language = await detectLanguage(inputText, setDetectedLanguage);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, language } : msg
        )
      );
      
      setChat(prevChat => ({
        ...prevChat,
        messages: prevChat.messages.map(msg =>
          msg.id === newMessage.id ? { ...msg, language } : msg
        ),
        timestamp: Date.now()
      }));
     
      
    } catch (error) {
      console.error('Language detection failed:', error);
    } finally {
      setIsProcessing(false);
      
    }
  };
  
  const handleSummarize = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;

    try {
      setIsProcessing(true);
      const summary = await summarizeText(message.text, setIsProcessing);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, summary } : msg
        )
      );
      setChat(prevChat => ({
        ...prevChat,
        messages: prevChat.messages.map(msg =>
          msg.id === messageId ? { ...msg, summary } : msg
        ),
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;

    try {
      setIsTranslating(true);
      const translation = await translateText(
        message.text,
        detectedLanguage,
        message.selectedLanguage || selectedLanguage,
        setIsTranslating
      );
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, translation } : msg
        )
      );
      setChat(prevChat => ({
        ...prevChat,
        messages: prevChat.messages.map(msg =>
          msg.id === messageId ? { ...msg, translation } : msg
        ),
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {

    }
  };
  
  const handleSaveChat = () => {
    const existingData = localStorage.getItem('savedChat');
    if (!existingData) {
      
      localStorage.setItem('savedChat', JSON.stringify([chat]));
      return;
    } else {
      
      const chatId = chat.id;
      const firstMessageId = chat.messages[0]?.id; 

      const existingIndex = savedChats.findIndex((existingChat: any) => 
        existingChat.id === chatId && 
        existingChat.messages[0]?.id === firstMessageId
      );

      if (existingIndex !== -1) {
        // Update existing chat
        savedChats[existingIndex] = chat;
        localStorage.setItem('savedChat', JSON.stringify(savedChats));
        toast.info('Chat updated successfully!');
        return;
      } else {
        // Add new chat
        if (chat.messages.length === 0) {
          return;
        } 
        savedChats.push(chat);
        setActive(chat.id);
        localStorage.setItem('savedChat', JSON.stringify(savedChats));
        toast.info('Chat saved successfully!');
        return;
      }
    }
  };
  // Clear messages and start a new chat
  const handleNewChat = () => {
    setMessages([]);
    setChat({ id: Date.now().toString(), messages: [], timestamp: Date.now() });
    setDetectedLanguage('en');
    setSelectedLanguage('es');
  };

  return (
    <main className='flex flex-row-reverse w-screen h-[100dvh] bg-gradient-to-br from-gray-800/50 via-black/50 to-gray-800/50 items-center justify-center'>
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-black to-gray-800 max-w-[1800px] max-xl:w-[100%] xl:w-[75%]">
        <div className="mx-auto px-4 py-8 h-screen flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 pb-4 flex flex-col items-end">
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                onSummarize={() => handleSummarize(message.id)}
                onTranslate={() => handleTranslate(message.id)}
                isTranslating={isTranslating}
                isProcessing={isProcessing}
                selectedLanguage={message.selectedLanguage || selectedLanguage}
                detectedLanguage={message.dectectedLanguage || detectedLanguage}
                setSelectedLanguage={(lang: string) => {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === message.id ? { ...msg, selectedLanguage: lang } : msg
                    )
                  );
                }}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="sticky bottom-0 bg-gray-800/50 backdrop-blur-lg rounded-xl self-center w-[90%] p-4 border border-gray-700"
          >
            <div className="flex gap-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to process..."
                className="flex-1 bg-gray-900/50 rounded-lg p-4 text-white placeholder-gray-400
                  resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                aria-label="Text input field"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="self-end bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed
                  p-3 rounded-lg transition-all duration-200 group"
                aria-label="Send text"
              >
                <ArrowUpIcon className="w-6 h-6 text-white group-hover:translate-y-[-2px] transition-transform" />
              </button>
            </div>
          </form>

        </div>
      </div>

      <div className='w-[25%] bg-gradient-to-b from-gray-900 to-black border-r border-gray-700 h-full max-[1250px]:hidden p-8'>
        <div className="h-full flex flex-col">
          <div className="mb-8">
        <h1 className='text-4xl font-bold text-outline text-transparent'>
          Lang-im
        </h1>
        <p className="text-gray-400 text-sm mt-2">Your AI Language Assistant</p>
          </div>

          <div className="flex-1">
        <h2 className="text-xl text-white font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Chat History
        </h2>
        
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {savedChats.slice().reverse().map((savedChat: Chat) => {
              const firstMessage = savedChat.messages[0]?.text || 'Empty Chat';
              let isActive = active === savedChat.id;
              return (
                <button
                key={savedChat.id}
                onClick={() => {
                  setMessages(savedChat.messages);
                  setChat(savedChat);
                  setActive(savedChat.id);
                }}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors focus-visible:outline-none outline-none focus:outline-none duration-200 border ${
                  isActive 
                  ? 'bg-blue-700/20 border-blue-500/50 text-blue-100' 
                  : 'bg-gray-700/50 hover:bg-gray-700/50 border-gray-700/50 text-gray-200'
                }`}
                >
                <div className="flex items-center gap-2">
                  {isActive && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  <span className={`truncate ${isActive ? 'font-medium' : ''}`}>
                  {firstMessage}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                  {new Date(savedChat.timestamp).toLocaleDateString()}
                  </span>
                </div>
                </button>
              );
              })}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {messages.length > 0 && (
              <button
                onClick={handleSaveChat}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Chat
              </button>
            )}
            
            <button
              onClick={handleNewChat}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={true}
        newestOnTop={false}
        pauseOnHover
        theme="dark"
        role="status"
      />
    </main>
  );
}
