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

  const toolBtn =
    'px-2.5 py-1 font-mono text-[11px] font-bold text-muted transition hover:bg-accent-soft hover:text-accent';

  return (
    <div className="overflow-hidden border border-rule bg-panel">
      {/* Top bar: Mode Tabs + Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-rule bg-panel2 px-3 py-2.5">
        <div className="mr-2 flex border border-rule-mid bg-inset p-0.5">
          <button
            type="button"
            onClick={() => setTab('write')}
            aria-pressed={tab === 'write'}
            className={`px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-kicker transition ${
              tab === 'write'
                ? 'bg-accent text-[var(--on-accent)]'
                : 'text-muted hover:text-ink'
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
            aria-pressed={tab === 'preview'}
            className={`px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-kicker transition ${
              tab === 'preview'
                ? 'bg-accent text-[var(--on-accent)]'
                : 'text-muted hover:text-ink'
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
                className={`min-w-[2.1rem] ${toolBtn}`}
              >
                {b.label}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-rule-mid" />
            <button
              type="button"
              onClick={() => setUrlPrompt({ type: 'link', value: '' })}
              className={toolBtn}
            >
              🔗 Link
            </button>
            <button
              type="button"
              onClick={() => setUrlPrompt({ type: 'image', value: '' })}
              className={toolBtn}
            >
              🖼 Image
            </button>
            <button
              type="button"
              onClick={() => run('removeFormat')}
              className={`${toolBtn} text-faint`}
            >
              Clear
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2 pr-1 font-mono text-[10px] uppercase tracking-kicker text-faint">
          <span>{words} words</span>
          <span aria-hidden>·</span>
          <span>~{readMins} min read</span>
        </div>
      </div>

      {/* Inline URL popover */}
      {urlPrompt && (
        <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-accent-soft px-4 py-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-kicker text-accent">
            {urlPrompt.type === 'link' ? 'Insert link URL:' : 'Insert image URL:'}
          </span>
          <input
            type="url"
            value={urlPrompt.value}
            onChange={(e) => setUrlPrompt({ ...urlPrompt, value: e.target.value })}
            placeholder="https://example.com/..."
            autoFocus
            className="field flex-1 py-1.5 font-mono text-xs"
          />
          <button
            type="button"
            onClick={applyUrlInsert}
            className="btn btn-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-kicker"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setUrlPrompt(null)}
            className="px-2 py-1 font-mono text-[10px] uppercase tracking-kicker text-faint hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor surface */}
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

      {/* Live preview surface */}
      {tab === 'preview' && (
        <div className="min-h-[380px] bg-inset px-6 py-5">
          <span className="chip text-accent">Article preview</span>
          {html.trim() ? (
            <div
              className="prose-crwn mt-3 max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="py-16 text-center font-serif text-sm italic text-faint">
              Nothing written yet — switch back to the Write tab to start drafting.
            </p>
          )}
        </div>
      )}

      <input type="hidden" name={name} value={html} />
    </div>
  );
}
