import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, LoaderCircle, HelpCircle, Bot, Zap, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { QUICK_QUESTIONS } from '../../constants/askReceiptly';
import { askReceiptlyService } from '../../services/askReceiptlyService';

export const AskReceiptlyCard = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Clean up ongoing API request on component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleAsk = async (questionToAsk) => {
    const q = (questionToAsk || question).trim();
    if (!q || loading) return;

    // Abort any prior in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await askReceiptlyService.askQuestion(q, {
        signal: abortControllerRef.current.signal,
      });

      if (res && res.success) {
        setResult(res);
      } else {
        setError('Sorry, I couldn\'t process that question right now.');
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return; // Silently ignore user-initiated aborts
      }
      setError('Unable to reach Ask Receiptly assistant. Please try again.');
    } finally {
      setLoading(false);
      // Restore focus back to the input element for quick follow-up
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleChipClick = (suggestedQ) => {
    setQuestion(suggestedQ);
    handleAsk(suggestedQ);
  };

  const renderFormattedAnswer = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <Card className="p-5 sm:p-6 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 text-slate-900 shadow-sm rounded-2xl border border-indigo-200/80 overflow-hidden relative">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 border border-indigo-200/60 shadow-xs">
            <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Ask Receiptly
            </h2>
            <p className="text-xs text-slate-500">
              Ask natural questions about your receipts, expenses, and warranties.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shadow-2xs">
          <Zap className="h-3 w-3 text-indigo-600" /> Instant Insights
        </span>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex flex-wrap gap-2 my-3 relative z-10" role="group" aria-label="Suggested questions">
        {QUICK_QUESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(item)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left font-medium"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Question Input Form */}
      <div className="mt-4 relative z-10">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. How much did I spend on Swiggy this month?"
            maxLength={300}
            disabled={loading}
            aria-label="Ask Receiptly question"
            className="w-full pl-4 pr-24 py-3 bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs transition-all disabled:opacity-60"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            <Button
              type="button"
              onClick={() => handleAsk()}
              disabled={!question.trim() || loading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Ask</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1">
          <span>Press Enter to submit</span>
          <span>{question.length}/300</span>
        </div>
      </div>

      {/* Response Area */}
      <div className="mt-4 relative z-10" aria-live="polite">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-sm space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                <Bot className="h-4 w-4" />
                <span>Ask Receiptly</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {result.answeredBy === 'ai' ? '✨ AI Formatted' : '⚡ Direct Answer'}
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {renderFormattedAnswer(result.answer)}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
