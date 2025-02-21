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

export default function TextProcessor() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const [selectedLanguage, setSelectedLanguage] = useState<string>('es');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!("ai" in self)) {
      toast.warn("This browser environment doesn't support the required AI capabilities.");
    }
    let chats = localStorage.getItem('savedChat');
    console.log(chats);
    if (chats) {
      const parsedChats = JSON.parse(chats);
      const lastItem = Array.isArray(parsedChats) ? parsedChats[parsedChats.length - 1] : parsedChats;
      const key = Object.keys(lastItem)[0];
      setMessages(lastItem[key]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = { id: Date.now().toString(), text: inputText };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    try {
      setIsProcessing(true);
      const language = await detectLanguage(inputText, setDetectedLanguage);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, language } : msg
        )
      );
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
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 5000);
    }
  };

  const handleTranslate = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;

    try {
      setIsTranslating(true);
      const translation = await translateText(
        message.text,
        detectedLanguage || 'en',
        message.selectedLanguage || 'es',
        setIsTranslating
      );
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, translation } : msg
        )
      );
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setTimeout(() => {
        setIsTranslating(false);
      }, 10000);
    }
  };

  // Save the current chat to localStorage
  const handleSaveChat = () => {
    const existingData = localStorage.getItem('savedChat');
    if (!existingData) {
      localStorage.setItem('savedChat', JSON.stringify([{ [messages[0].text]: messages }]));
    } else {
      let savedChat = JSON.parse(existingData);
      if (!Array.isArray(savedChat)) {
        savedChat = [savedChat];
      }
      const chatKey = messages[0].id;
      const existingChatIndex = savedChat.findIndex((chat: any) => chatKey in chat);
      console.log(existingChatIndex, savedChat[-1]);
      if (existingChatIndex !== -1) {
        savedChat[existingChatIndex][messages[0].text] = messages;
      } else {
        savedChat[0][messages[0].text] = messages;
      }
      savedChat.push({[messages[0].text]: messages });
      localStorage.setItem('savedChat', JSON.stringify(savedChat));
    }
    toast.success('Chat saved.');
  };

  // Clear messages and start a new chat
  const handleNewChat = () => {
    setMessages([]);
    setDetectedLanguage('en');
    setSelectedLanguage('en');
  };

  return (
    <main className='flex flex-row-reverse w-screen h-[100dvh] items-center'>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 max-xl:w-[100%] xl:w-[75%]">
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
            className="sticky bottom-0 bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700"
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

          <div className="sticky bottom-0 p-4 mt-4 flex justify-end space-x-2 ">
            { messages.length > 0 && (
              <button
                onClick={handleSaveChat}
                className="bg-green-700 hover:bg-green-800 p-2 rounded text-white"
              >
                Save Chat
              </button>
            )}
            
            <button
              onClick={handleNewChat}
              className="bg-red-700 hover:bg-red-800 p-2 rounded text-white"
            >
              New Chat
            </button>
          </div>
        </div>
      </div>

      <div className='flex justify-center items-center w-[25%] h-full max-[1250px]:hidden'>
        <h1 className='text-4xl text-transparent text-outline'>Lang-im</h1>
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
