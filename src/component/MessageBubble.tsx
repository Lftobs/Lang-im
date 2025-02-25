import { ArrowsRightLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import {CSSProperties } from "react";
import { CircleLoader } from 'react-spinners';


const override: CSSProperties = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};


const MessageBubble = ({ message, onSummarize, onTranslate, selectedLanguage, setSelectedLanguage, isProcessing, isTranslating}: any) => {

  return (
    <div className="space-y-4 min-w-3xl max-w-[calc(100%-8rem)] max-lg:min-w-[10rem] max-lg:w-full max-lg:max-w-[calc(100%-2rem)]">
      {/* Original Message */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700 animate-fade-in">
        <p className="text-gray-100 whitespace-pre-wrap">{message.text}</p>
        
        {message.language && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
            Detected language: {message.language.toUpperCase()}
          </div>
        )}
      </div>
  
      {/* Action Buttons */}

      
      
      <div className="flex flex-col sm:flex-row gap-4 max-sm:max-w-[13rem] ml-4 lg:max-w-[20rem] max-lg:ml-2 max-sm:gap-2">
        {message.text.length > 150 && message.language  === 'English' && !isProcessing && (
          
            <button
              onClick={onSummarize}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30
                  rounded-lg text-blue-400 hover:text-blue-300 transition-colors 
                  ${isProcessing ? 'animate-pulse' : ''}`}
            >
            <DocumentTextIcon className="w-5 h-5" />
            Summarize 
            </button>
         )}
            {(isProcessing || isTranslating) && (
            <CircleLoader
              color={'oklch(0.707 0.165 254.624)'}
              loading={true}
              cssOverride={override}
              size={50}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
            )}

        { !isTranslating && (
          <div className="flex gap-2 bg-gray-800/50 backdrop-blur-lg rounded-lg p-1">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-gray-300 px-2 py-1 rounded-md"
            >
              {['es', 'pt', 'en', 'ru', 'tr', 'fr'].map(lang => (
                <option key={lang} value={lang} className="bg-gray-800">
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
              <button
              onClick={onTranslate}
              disabled={isTranslating}
              className={`flex items-center gap-2 px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30
                rounded-lg text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50
                ${isTranslating ? 'animate-pulse' : ''}`}
              >
              <ArrowsRightLeftIcon className="w-5 h-5" />
              Translate
              </button>
          </div>
        )}
      </div>
  
      {/* Processed Outputs */}
      {message.summary && (
        <div className="ml-8 bg-gray-800/30 rounded-xl p-4 border border-gray-700 animate-fade-in">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Summary</h3>
          <p className="text-gray-200">{message.summary}</p>
        </div>
      )}
  
      {message.translation && (
        <div className="ml-8 bg-gray-800/30 rounded-xl p-4 border border-gray-700 animate-fade-in ">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Translation</h3>
          <p className="text-gray-200">{message.translation}</p>
        </div>
      )}
    </div>
  );
} 


export default MessageBubble;
