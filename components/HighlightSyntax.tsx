import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

const MakeHighlightSyntax = () => {
  let lang: string | null = null;
  let inside = false;
  return (line: string) => {
    // Detect code block start: ```lang
    if (!line) return <span>{line}</span>; // Handle undefined or null input
    const codeBlockStart = line.match(/^```([a-zA-Z0-9]*)/);
    if (codeBlockStart) {
      lang = codeBlockStart[1] || "";
      inside = true;
      // Render the code block marker as plain text
      return <span className="code-block-marker">{line}</span>;
    }
    // Detect code block end: ```
    if (inside && line.trim() === "```") {
      lang = null;
      inside = false;
      return <span className="code-block-marker">{line}</span>;
    }
    // If inside a code block, highlight with the detected language
    if (inside && lang) {
      return (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={lang}
          customStyle={{
            display: "inline",
            background: "none",
            padding: 0,
          }}
          PreTag="span"
        >
          {line}
        </SyntaxHighlighter>
      );
    }
    // Otherwise, render as plain text
    return <span>{line}</span>;
  };
};
export default MakeHighlightSyntax;
