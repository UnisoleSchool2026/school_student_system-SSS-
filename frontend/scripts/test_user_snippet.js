const userSnippet = `An object is placed $30\\,\\text{cm}$ in front of a concave mirror whose focal length is $-15\\,\\text{cm}$. Using the mirror formula, calculate the image distance $v$ (in cm).
Step-by-Step Mathematical Derivation:
Benchmark: 90s
For a spherical mirror, the mirror formula is \\[\\frac{1}{f}=\\frac{1}{v}+\\frac{1}{u}\\]\\ Using the sign convention (real object in front of the mirror):\\ \\[f=-15\\,\\text{cm},\\quad u=-30\\,\\text{cm}\\]\\ Substituting,\\ \\[\\frac{1}{v}=\\frac{1}{f}-\\frac{1}{u}=\\frac{1}{-15}-\\frac{1}{-30}= -\\frac{1}{15}+\\frac{1}{30}= -\\frac{2-1}{30}= -\\frac{1}{30}\\]\\ Hence, \\[v=-30\\,\\text{cm}\\]\\ The negative sign indicates that the image is real and formed on the same side as the object.`;

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function renderLatexString(rawText, katexEngine) {
  if (!rawText || typeof rawText !== 'string') return '';

  let content = rawText;

  // 1. Render LaTeX environments: \begin{...}...\end{...}
  content = content.replace(/\\begin\{(equation|align|aligned|gather|matrix|pmatrix|bmatrix)\}([\s\S]*?)\\end\{\1\}/g, (match) => {
    const cleanTex = decodeHtmlEntities(match.trim());
    return katexEngine.renderToString(cleanTex, { displayMode: true, throwOnError: false });
  });

  // 2. Render Display Math: $$...$$
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
    const cleanTex = decodeHtmlEntities(tex.trim());
    return katexEngine.renderToString(cleanTex, { displayMode: true, throwOnError: false });
  });

  // 3. Render Display Math: \[...\] (and consume optional trailing \ if present from LLMs)
  content = content.replace(/\\\[([\s\S]*?)\\\](?:\\)?/g, (match, tex) => {
    const cleanTex = decodeHtmlEntities(tex.trim());
    return katexEngine.renderToString(cleanTex, { displayMode: true, throwOnError: false });
  });

  // 4. Render Inline Math: \(...\)
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (match, tex) => {
    const cleanTex = decodeHtmlEntities(tex.trim());
    return katexEngine.renderToString(cleanTex, { displayMode: false, throwOnError: false });
  });

  // 5. Render Inline Math: $...$
  content = content.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (match, prefix, tex) => {
    const cleanTex = decodeHtmlEntities(tex.trim());
    const rendered = katexEngine.renderToString(cleanTex, { displayMode: false, throwOnError: false });
    return `${prefix}${rendered}`;
  });

  // 6. Post-processing text outside rendered math:
  // Clean up markdown bold
  content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Clean up stray LLM LaTeX linebreaks like ':\ ' or ',\ ' or '\ ' before newlines
  content = content.replace(/\\(\s*[\r\n]+)/g, '$1');
  content = content.replace(/([:;,])\s*\\\s*/g, '$1 ');

  // Format line breaks
  content = content.replace(/\n\s*\n/g, '<br/><br/>');
  content = content.replace(/\n/g, '<br/>');

  return content;
}

const mockKatex = {
  renderToString: (tex, opts) => {
    return opts.displayMode 
      ? `\n<div class="katex-display">[DISPLAY MATH: ${tex}]</div>\n`
      : `<span class="katex-inline">[INLINE: ${tex}]</span>`;
  }
};

const result = renderLatexString(userSnippet, mockKatex);
console.log('Result:\n', result);

const displayCount = (result.match(/class="katex-display"/g) || []).length;
const inlineCount = (result.match(/class="katex-inline"/g) || []).length;
const hasUnrendered = result.includes('\\[') || result.includes('\\]') || result.includes('$$');

console.log('\n--- VERIFICATION CHECKS ---');
console.log('Display math blocks rendered:', displayCount, '(Expected 4)');
console.log('Inline math blocks rendered:', inlineCount, '(Expected 3)');
console.log('Unrendered delimiters remaining:', hasUnrendered);

if (displayCount === 4 && inlineCount === 3 && !hasUnrendered) {
  console.log('✅ ALL VERIFICATIONS PASSED: 100% of LLM LaTeX converted to KaTeX!');
} else {
  console.log('❌ Failed some checks');
}
