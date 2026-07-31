"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

export function AIReviewSummary() {
  const [summary, setSummary] = useState<{ pros: string[], cons: string[], verdict: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/ai/summarize-reviews');
        if (!response.ok) throw new Error('Failed to load summary');
        const data = await response.json();
        setSummary(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-xl overflow-hidden relative group h-full">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-4" />
          <p className="text-sm text-gray-400 animate-pulse">Gemini AI is analyzing all customer reviews...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-xl overflow-hidden h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[300px]">
          <p className="text-sm text-red-400">Could not generate AI insights: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-md border-purple-500/30 shadow-xl overflow-hidden relative h-full">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Sparkles className="w-32 h-32 text-purple-500" />
      </div>
      <CardHeader className="relative z-10 border-b border-white/5 bg-purple-500/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-heading text-purple-100">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Review Insights
        </CardTitle>
        <CardDescription className="text-purple-200/60">
          Real-time sentiment analysis powered by Gemini 2.0
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 pt-6 space-y-6">
        
        {/* Verdict */}
        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">Overall Verdict</p>
              <p className="text-sm font-medium text-gray-200 leading-relaxed">"{summary.verdict}"</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pros */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-green-400 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" /> What Customers Love
            </p>
            <ul className="space-y-2">
              {summary.pros.map((pro, idx) => (
                <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span> {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
              <ThumbsDown className="w-3.5 h-3.5" /> Areas for Improvement
            </p>
            <ul className="space-y-2">
              {summary.cons.map((con, idx) => (
                <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span> {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}
