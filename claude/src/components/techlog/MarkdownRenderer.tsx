import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

// ── Mermaid ブロック ─────────────────────────────────────────
function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            background: '#161b22',
            mainBkg: '#1e242c',
            nodeBorder: '#30363d',
            lineColor: '#8b949e',
            textColor: '#e6edf3',
          },
        });
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = `<pre style="color:#f85149;font-size:0.8rem">Mermaid エラー: ${e}</pre>`;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  return <div ref={ref} className="tl-mermaid" />;
}

// ── コードブロック ─────────────────────────────────────────
function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const match   = /language-(\w+)/.exec(className ?? '');
  const lang    = match?.[1] ?? '';
  const code    = String(children ?? '').replace(/\n$/, '');

  if (lang === 'mermaid') {
    return <MermaidBlock code={code} />;
  }

  return (
    <SyntaxHighlighter
      style={oneDark}
      language={lang || 'text'}
      PreTag="div"
      customStyle={{
        margin: '1em 0',
        borderRadius: '8px',
        fontSize: '0.88rem',
        border: '1px solid #30363d',
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}

// ── メイン ─────────────────────────────────────────────────
interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          const isBlock = /language-/.test(className ?? '');
          if (isBlock) {
            return <CodeBlock className={className}>{children}</CodeBlock>;
          }
          // インラインコード
          return (
            <code
              style={{
                background: '#1e242c',
                border: '1px solid #30363d',
                borderRadius: '4px',
                padding: '1px 6px',
                fontSize: '0.88em',
                fontFamily: "'SFMono-Regular', Consolas, monospace",
              }}
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
