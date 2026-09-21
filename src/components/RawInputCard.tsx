import React, { useState } from 'react';
import { FileText, Play, RefreshCw, Clipboard, Trash2, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface RawInputCardProps {
  rawInput: string;
  onChangeInput: (val: string) => void;
  onRun?: () => void;
}

const SAMPLE_TIMESHEET_DATA = `2026.07.16
08:58:00
17:05:00
2026.07.17
00:00:00
00:00:00
2026.07.18
00:00:00
00:00:00
2026.07.19
00:00:00
00:00:00
2026.07.20
09:05:00
17:15:00
2026.07.21
09:00:00
19:15:00
2026.07.22
09:12:00
17:02:00
2026.07.23
09:20:00
17:10:00
2026.07.24
00:00:00
00:00:00
2026.07.25
00:00:00
00:00:00
2026.07.26
00:00:00
00:00:00
2026.07.27
08:55:00
17:30:00
2026.07.28
09:02:00
18:30:00
2026.07.29
09:10:00
17:00:00
2026.07.30
09:00:00
17:05:00
2026.07.31
00:00:00
00:00:00
2026.08.01
00:00:00
00:00:00
2026.08.02
00:00:00
00:00:00
2026.08.03
08:50:00
17:10:00
2026.08.04
09:00:00
19:00:00
2026.08.05
09:15:00
17:00:00
2026.08.06
09:05:00
17:10:00
2026.08.07
00:00:00
00:00:00
2026.08.08
00:00:00
00:00:00
2026.08.09
00:00:00
00:00:00
2026.08.10
09:00:00
17:05:00
2026.08.11
09:05:00
18:00:00
2026.08.12
09:10:00
17:00:00
2026.08.13
08:55:00
17:15:00
2026.08.14
00:00:00
00:00:00
2026.08.15
00:00:00
00:00:00`;

export const RawInputCard: React.FC<RawInputCardProps> = ({ rawInput, onChangeInput, onRun }) => {
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const handleRunClick = () => {
    setIsRunning(true);
    if (onRun) onRun();
    setTimeout(() => setIsRunning(false), 700);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          onChangeInput(text);
          setCopiedToast(true);
          setTimeout(() => setCopiedToast(false), 2500);
        }
      }
    } catch (e) {
      console.warn('Clipboard read permission denied or unavailable:', e);
    }
  };

  const handleLoadSample = () => {
    onChangeInput(SAMPLE_TIMESHEET_DATA);
    if (onRun) onRun();
  };

  const handleClear = () => {
    onChangeInput('');
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 mb-6 shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          <h2 className="font-mono text-xs uppercase tracking-widest text-foreground font-bold">
            {t('raw.title')}
          </h2>
        </div>

        {/* Action Controls for Pasting / Loading Sample / Clearing */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all shadow-2xs cursor-pointer"
            title="Load sample monthly timesheet with Thursday overtime and Sunday weekend"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('raw.load_sample')}</span>
          </button>

          <button
            type="button"
            onClick={handlePasteClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-muted/60 hover:bg-muted text-foreground border border-border transition-all shadow-2xs cursor-pointer"
            title="Paste attendance punch logs directly from your clipboard"
          >
            <Clipboard className="w-3.5 h-3.5 text-amber-500" />
            <span>{copiedToast ? t('raw.pasted') : t('raw.paste')}</span>
          </button>

          {rawInput.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-all shadow-2xs cursor-pointer"
              title="Clear current punch text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('raw.clear')}</span>
            </button>
          )}
        </div>
      </div>

      <textarea
        value={rawInput}
        onChange={(e) => onChangeInput(e.target.value)}
        placeholder={t('raw.placeholder')}
        className="w-full min-h-[160px] bg-background border border-border focus:border-amber-500 rounded-2xl p-4 font-mono text-xs text-foreground leading-relaxed focus:outline-hidden resize-y transition-colors"
      />

      {/* Prominent 'Read the Ledger' Button under Raw Punch Data */}
      <div className="mt-5 pt-4 border-t border-border/80">
        <button
          onClick={handleRunClick}
          className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs sm:text-sm font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>{t('raw.processing')}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-black text-black" />
              <span>{t('raw.read_ledger')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
