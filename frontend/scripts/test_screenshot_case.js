let katex;
try {
  katex = require('katex');
} catch (_) {
  katex = require('../vendor/katex/katex.min.js');
}

// Exact text structure from the user's screenshot
const screenshotText = `For a concave mirror, the focal length $f$ is taken as negative: $f = -10\\,\\text{cm}$ .\\newline Object distance $u$ is also negative because the object is in front of the mirror: $u = -15\\,\\text{cm}$ .\\newline Mirror formula (sign convention):
\\[\\frac{1}{f}=\\frac{1}{v}+\\frac{1}{u}\\]
\\newline Substituting the values:
\\[\\frac{1}{-10}=\\frac{1}{v}+\\frac{1}{-15}\\]
[ -0.10 = \\frac{1}{v} - 0.0667 \\] [ \\frac{1}{v}= -0.10 + 0.0667 = -0.0333 \\] [ v = \\frac{1}{-0.0333}= -30\\,\\text{cm} \\] \\newline The negative sign indicates that the image is real and formed on the same side as the object.`;

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanFormula(tex) {
  let clean = decodeHtmlEntities(tex.trim());
  // Fix unescaped text{...} e.g. text{cm} -> \text{cm}
  clean = clean.replace(/(?<!\\)text\{/g, '\\text{');
  return clean;
}

function renderLatexString(rawText, katexEngine) {
  if (!rawText || typeof rawText !== 'string') return '';

  let content = rawText;

  // 1. Normalize linebreaks from LaTeX notation: \newline or .\newline
  content = content.replace(/\.?\\newline/gi, '<br/>');

  // 2. Normalize display brackets where opening bracket lost its slash: e.g. '[ math \]' -> '\[ math \]'
  content = content.replace(/(^|\s)\[\s*([^\[\]]+?)\s*\\\]/g, '$1\\[$2\\]');

  // 3. Render LaTeX environments: \begin{...}...\end{...}
  content = content.replace(/\\begin\{(equation|align|aligned|gather|matrix|pmatrix|bmatrix)\}([\s\S]*?)\\end\{\1\}/g, (match) => {
    const cleanTex = cleanFormula(match);
    return katexEngine.renderToString(cleanTex, { displayMode: true, throwOnError: false });
  });

  // 4. Render Display Math: $$...$$
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
    const cleanTex = cleanFormula(tex);
    return katexEngine.renderToString(cleanTex, { displayMode: true, throwOnError: false });
  });

  // 5. Render Display Math: \[...\] (and consume optional trailing \ from LLMs)
  content = content.replace(/\\\[([\s\S]*?)\\\](?:\\)?/g, (match, tex) => {
    const cleanTex = cleanFormula(tex);
    return katexEngine.renderToString(cleanTex, { displayMode: true, throwOnError: false });
  });

  // 6. Render Inline Math: \(...\)
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (match, tex) => {
    const cleanTex = cleanFormula(tex);
    return katexEngine.renderToString(cleanTex, { displayMode: false, throwOnError: false });
  });

  // 7. Render Inline Math: $...$
  content = content.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (match, prefix, tex) => {
    const cleanTex = cleanFormula(tex);
    const rendered = katexEngine.renderToString(cleanTex, { displayMode: false, throwOnError: false });
    return `${prefix}${rendered}`;
  });

  // 8. Post-processing text outside rendered math:
  content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/\\(\s*[\r\n]+)/g, '$1');
  content = content.replace(/([:;,])\s*\\\s*/g, '$1 ');

  // Format remaining plain text newlines into <br/>
  content = content.replace(/\n\s*\n/g, '<br/><br/>');
  content = content.replace(/\n/g, '<br/>');

  return content;
}

const renderedHtml = renderLatexString(screenshotText, katex);
console.log('--- RENDERED HTML RESULT ---');
console.log('Total characters:', renderedHtml.length);
console.log('Has KaTeX display spans:', renderedHtml.includes('katex-display'));
console.log('Has KaTeX inline spans:', renderedHtml.includes('class="katex"'));
console.log('Remaining unrendered delimiters:', renderedHtml.includes('\\[') || renderedHtml.includes('\\]') || renderedHtml.includes('\\newline'));

const displayMatches = (renderedHtml.match(/class="katex-display"/g) || []).length;
console.log('Total display equations rendered:', displayMatches);

if (displayMatches >= 5 && !renderedHtml.includes('\\newline') && !renderedHtml.includes('\\[')) {
  console.log('🎉 100% PERFECT: Every single formula and derivation step from the screenshot is rendered in KaTeX!');
} else {
  console.log('❌ Failed some checks');
}
