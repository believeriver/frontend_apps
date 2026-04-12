import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

// ── 言語自動検出 ──────────────────────────────────────────
// よく使う言語に絞ることでバンドルサイズを抑える
import hljs from 'highlight.js/lib/core';
import hljsPython     from 'highlight.js/lib/languages/python';
import hljsBash       from 'highlight.js/lib/languages/bash';
import hljsJavaScript from 'highlight.js/lib/languages/javascript';
import hljsTypeScript from 'highlight.js/lib/languages/typescript';
import hljsSql        from 'highlight.js/lib/languages/sql';
import hljsJson       from 'highlight.js/lib/languages/json';
import hljsYaml       from 'highlight.js/lib/languages/yaml';
import hljsHtml       from 'highlight.js/lib/languages/xml';
import hljsCss        from 'highlight.js/lib/languages/css';
import hljsGo         from 'highlight.js/lib/languages/go';
import hljsRust       from 'highlight.js/lib/languages/rust';
import hljsCpp        from 'highlight.js/lib/languages/cpp';
import hljsJava       from 'highlight.js/lib/languages/java';
import hljsIni        from 'highlight.js/lib/languages/ini';

hljs.registerLanguage('python',     hljsPython);
hljs.registerLanguage('bash',       hljsBash);
hljs.registerLanguage('shell',      hljsBash);
hljs.registerLanguage('javascript', hljsJavaScript);
hljs.registerLanguage('typescript', hljsTypeScript);
hljs.registerLanguage('sql',        hljsSql);
hljs.registerLanguage('json',       hljsJson);
hljs.registerLanguage('yaml',       hljsYaml);
hljs.registerLanguage('html',       hljsHtml);
hljs.registerLanguage('css',        hljsCss);
hljs.registerLanguage('go',         hljsGo);
hljs.registerLanguage('rust',       hljsRust);
hljs.registerLanguage('cpp',        hljsCpp);
hljs.registerLanguage('java',       hljsJava);
hljs.registerLanguage('ini',        hljsIni);

const DETECT_LANGS = [
  'python', 'bash', 'javascript', 'typescript',
  'sql', 'json', 'yaml', 'html', 'css',
  'go', 'rust', 'cpp', 'java', 'ini',
];

function detectLanguage(code: string): string {
  if (code.trim().length < 10) return 'text'; // 短すぎると誤検出
  try {
    const result = hljs.highlightAuto(code, DETECT_LANGS);
    return result.language ?? 'text';
  } catch {
    return 'text';
  }
}

// ── :::note 前処理 ────────────────────────────────────────
function preprocessNote(src: string): string {
  return src.replace(
    /:::note\s+(info|warn|alert)\n([\s\S]*?):::/g,
    (_, type: string, body: string) =>
      `<div class="md-note md-note-${type}">\n\n${body.trim()}\n\n</div>`,
  );
}

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

// ── diff ブロック ──────────────────────────────────────────
function DiffBlock({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <div style={{
      margin: '1em 0',
      borderRadius: '8px',
      fontSize: '0.88rem',
      border: '1px solid #30363d',
      background: '#0d1117',
      overflow: 'auto',
      fontFamily: "'SFMono-Regular', Consolas, monospace",
    }}>
      {lines.map((line, i) => {
        let bg = 'transparent';
        let color = '#e6edf3';
        let prefix = '';
        if (line.startsWith('+') && !line.startsWith('+++')) {
          bg = 'rgba(46,160,67,0.18)';
          color = '#7ee787';
          prefix = '+';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          bg = 'rgba(248,81,73,0.18)';
          color = '#ff7b72';
          prefix = '-';
        } else if (line.startsWith('@@')) {
          bg = 'rgba(121,192,255,0.1)';
          color = '#79c0ff';
        } else if (line.startsWith('+++') || line.startsWith('---')) {
          color = '#8b949e';
        }
        return (
          <div
            key={i}
            style={{
              display: 'block',
              background: bg,
              color,
              padding: '0 16px',
              lineHeight: '1.6',
              whiteSpace: 'pre',
              borderLeft: prefix === '+'
                ? '3px solid rgba(46,160,67,0.6)'
                : prefix === '-'
                  ? '3px solid rgba(248,81,73,0.6)'
                  : '3px solid transparent',
            }}
          >
            {line || ' '}
          </div>
        );
      })}
    </div>
  );
}

// ── コードブロック ─────────────────────────────────────────
function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const match = /language-(\w+)/.exec(className ?? '');
  const lang  = match?.[1] ?? '';
  const code  = String(children ?? '').replace(/\n$/, '');

  if (lang === 'mermaid')      return <MermaidBlock code={code} />;
  if (lang.startsWith('diff')) return <DiffBlock code={code} />;

  // 言語が明示されていない場合は自動検出
  const resolvedLang = lang || detectLanguage(code);

  return (
    <div style={{ position: 'relative' }}>
      {/* 検出言語ラベル（言語未指定時のみ表示） */}
      {!lang && resolvedLang !== 'text' && (
        <span style={{
          position: 'absolute', top: 8, right: 10,
          fontSize: '0.7rem', color: '#8b949e',
          fontFamily: 'monospace', zIndex: 1,
          pointerEvents: 'none',
        }}>
          {resolvedLang} (auto)
        </span>
      )}
      <SyntaxHighlighter
        style={oneDark}
        language={resolvedLang}
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
    </div>
  );
}

// ── メイン ─────────────────────────────────────────────────
interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  const processed = preprocessNote(content);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          const codeStr = String(children ?? '');
          // language-xxx クラスがある OR 改行を含む → ブロックコード
          const isBlock = /language-/.test(className ?? '') || codeStr.includes('\n');
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
      {processed}
    </ReactMarkdown>
  );
}
