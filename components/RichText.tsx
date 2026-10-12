import { Fragment, type ReactNode } from "react";

/** Mali, bezbedan markup: **bold**, `- ` liste, prazan red = novi pasus, [tekst](https://...) linkovi. Bez HTML-a. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={`${keyPrefix}-${i++}`} className="font-bold text-white">{m[1]}</strong>);
    else out.push(<a key={`${keyPrefix}-${i++}`} href={m[3]} target="_blank" rel="noopener noreferrer" className="underline text-sky-300">{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((b, bi) => {
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={bi} className="list-disc space-y-1.5 pl-5">
              {lines.map((l, li) => <li key={li}>{inline(l.trim().slice(2), `${bi}-${li}`)}</li>)}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => <Fragment key={li}>{li > 0 && <br />}{inline(l, `${bi}-${li}`)}</Fragment>)}
          </p>
        );
      })}
    </div>
  );
}
