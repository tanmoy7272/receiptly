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

  return (
    <Card className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl rounded-2xl border border-slate-700/60 overflow-hidden relative">
      {/* Background Glow Effect */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shadow-inner">
            <Sparkles className="h-5 w-5 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Ask Receiptly
            </h2>
            <p className="text-xs text-slate-300">
              Ask natural questions about your receipts, expenses, and warranties.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
          <Zap className="h-3 w-3 text-indigo-400" /> Instant Insights
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
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
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
            className="w-full pl-4 pr-24 py-3 bg-slate-900/90 text-white placeholder-slate-400 text-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-60"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            <Button
              type="button"
              onClick={() => handleAsk()}
              disabled={!question.trim() || loading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
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
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                <Bot className="h-4 w-4" />
                <span>Ask Receiptly</span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {result.answeredBy === 'ai' ? '✨ AI Formatted' : '⚡ Direct Answer'}
              </span>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed font-normal">
              {result.answer}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
