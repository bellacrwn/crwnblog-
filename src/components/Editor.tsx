'use client';

import { useRef, useState } from 'react';

const BTNS: { cmd: string; arg?: string; label: string; title: string }[] = [
  { cmd: 'bold', label: 'B', title: 'Bold' },
  { cmd: 'italic', label: 'I', title: 'Italic' },
  { cmd: 'underline', label: 'U', title: 'Underline' },
  { cmd: 'formatBlock', arg: 'h2', label: 'H2', title: 'Heading' },
  { cmd: 'formatBlock', arg: 'h3', label: 'H3', title: 'Subheading' },
  { cmd: 'insertUnorderedList', label: '• List', title: 'Bullets' },
  { cmd: 'insertOrderedList', label: '1. List', title: 'Numbered' },
  { cmd: 'formatBlock', arg: 'blockquote', label: '❝', title: 'Quote' },
  { cmd: 'formatBlock', arg: 'pre', label: '</>', title: 'Code block' },
  { cmd: 'insertHorizontalRule', label: '―', title: 'Divider' },
];

export default function Editor({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');
  const [words, setWords] = useState(0);

  const sync = () => {
    const v = ref.current?.innerHTML ?? '';
    setHtml(v);
    setWords((ref.current?.innerText ?? '').split(/\s+/).filter(Boolean).length);
  };

  const run = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    sync();
  };

  const link = () => {
    const url = prompt('Link URL (https://…)');
    if (url && /^https?:\/\//i.test(url)) run('createLink', url);
  };

  const image = () => {
    const url = prompt('Image URL (https://…)');
    if (url && /^https?:\/\//i.test(url)) run('insertImage', url);
  };

  return (
    <div className="panel overflow-hidden rounded-xl">
      <div className="flex flex-wrap gap-1 border-b border-[#1e2230] bg-black/25 p-2">
        {BTNS.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.title}
            onClick={() => run(b.cmd, b.arg)}
            className="min-w-[2.1rem] rounded-md px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            {b.label}
          </button>
        ))}
        <span className="mx-1 w-px bg-[#1e2230]" />
        <button type="button" onClick={link} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10">
          Link
        </button>
        <button type="button" onClick={image} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10">
          Image
        </button>
        <button type="button" onClick={() => run('removeFormat')} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-white/10">
          Clear
        </button>
        <span className="ml-auto self-center pr-1 text-xs text-slate-500">{words} words</span>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onPaste={(e) => {
          // strip incoming formatting — paste as plain text
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          sync();
        }}
        data-ph="Tell the story. What did you discover, how, and why does it matter?"
        className="prose-crwn min-h-[340px] max-w-none px-5 py-4 outline-none"
      />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
