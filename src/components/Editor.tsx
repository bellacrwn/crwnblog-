'use client';

import { useEffect, useRef, useState } from 'react';

const BTNS: { cmd: string; arg?: string; label: string; title: string }[] = [
  { cmd: 'bold', label: 'B', title: 'Bold' },
  { cmd: 'italic', label: 'I', title: 'Italic' },
  { cmd: 'underline', label: 'U', title: 'Underline' },
  { cmd: 'formatBlock', arg: 'h2', label: 'H2', title: 'Section Heading' },
  { cmd: 'formatBlock', arg: 'h3', label: 'H3', title: 'Subheading' },
  { cmd: 'insertUnorderedList', label: '• List', title: 'Bullet List' },
  { cmd: 'insertOrderedList', label: '1. List', title: 'Numbered List' },
  { cmd: 'formatBlock', arg: 'blockquote', label: '❝ Quote', title: 'Blockquote' },
  { cmd: 'formatBlock', arg: 'pre', label: '</> Code', title: 'Code Block' },
  { cmd: 'insertHorizontalRule', label: '―', title: 'Horizontal Divider' },
];

export default function Editor({
  name,
  initialHtml = '',
}: {
  name: string;
  initialHtml?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [html, setHtml] = useState(initialHtml);
  const [words, setWords] = useState(0);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [urlPrompt, setUrlPrompt] = useState<null | { type: 'link' | 'image'; value: string }>(
    null
  );

  useEffect(() => {
    if (!initializedRef.current && ref.current && initialHtml) {
      ref.current.innerHTML = initialHtml;
      initializedRef.current = true;
      const count = (ref.current.innerText ?? '').split(/\s+/).filter(Boolean).length;
      setWords(count);
    }
  }, [initialHtml]);

  const sync = () => {
    if (!ref.current) return;
    const v = ref.current.innerHTML ?? '';
    setHtml(v);
    setWords((ref.current.innerText ?? '').split(/\s+/).filter(Boolean).length);
  };

  const run = (cmd: string, arg?: string) => {
    if (tab !== 'write') setTab('write');
    setTimeout(() => {
      ref.current?.focus();
      document.execCommand(cmd, false, arg);
      sync();
    }, 0);
  };

  const applyUrlInsert = () => {
    if (!urlPrompt) return;
    const trimmed = urlPrompt.value.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      run(urlPrompt.type === 'link' ? 'createLink' : 'insertImage', trimmed);
    }
    setUrlPrompt(null);
  };

  const readMins = Math.max(1, Math.round(words / 220));

  return (
    <div className="panel overflow-hidden rounded-2xl">
      {/* Top bar: Mode Tabs + Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] bg-black/40 px-3 py-2.5">
        <div className="mr-2 flex rounded-lg border border-white/10 bg-black/50 p-0.5">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
              tab === 'write'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => {
              sync();
              setTab('preview');
            }}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
              tab === 'preview'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Preview
          </button>
        </div>

        {tab === 'write' && (
          <>
            {BTNS.map((b) => (
              <button
                key={b.label}
                type="button"
                title={b.title}
                onClick={() => run(b.cmd, b.arg)}
                className="min-w-[2.1rem] rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {b.label}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-white/10" />
            <button
              type="button"
              onClick={() => setUrlPrompt({ type: 'link', value: '' })}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              🔗 Link
            </button>
            <button
              type="button"
              onClick={() => setUrlPrompt({ type: 'image', value: '' })}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              🖼 Image
            </button>
            <button
              type="button"
              onClick={() => run('removeFormat')}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              Clear
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2 pr-1 font-mono text-[11px] text-slate-400">
          <span>{words} words</span>
          <span>·</span>
          <span>~{readMins} min read</span>
        </div>
      </div>

      {/* Inline URL Popover (replaces native browser prompt) */}
      {urlPrompt && (
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] bg-indigo-950/30 px-4 py-2.5">
          <span className="text-xs font-semibold text-indigo-300">
            {urlPrompt.type === 'link' ? 'Insert Link URL:' : 'Insert Image URL:'}
          </span>
          <input
            type="url"
            value={urlPrompt.value}
            onChange={(e) => setUrlPrompt({ ...urlPrompt, value: e.target.value })}
            placeholder="https://example.com/..."
            autoFocus
            className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-1 text-xs text-white outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={applyUrlInsert}
            className="rounded-lg bg-indigo-500 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-400"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setUrlPrompt(null)}
            className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor Surface */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          sync();
        }}
        data-ph="Tell the full story. What did you discover, how did you verify it, and why does it matter?"
        className={`prose-crwn min-h-[380px] max-w-none px-6 py-5 outline-none ${
          tab === 'preview' ? 'hidden' : 'block'
        }`}
      />

      {/* Live Preview Surface */}
      {tab === 'preview' && (
        <div className="min-h-[380px] bg-black/20 px-6 py-5">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-indigo-300">
            Article Preview
          </div>
          {html.trim() ? (
            <div
              className="prose-crwn max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="py-16 text-center text-sm italic text-slate-500">
              Nothing written yet — switch back to the Write tab to start drafting.
            </p>
          )}
        </div>
      )}

      <input type="hidden" name={name} value={html} />
    </div>
  );
}
