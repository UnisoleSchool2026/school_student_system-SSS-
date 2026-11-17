/**
 * Test LaTeX parsing and transformation for LLM generated equations
 */
const rawLlmOutput = `An object is placed $30\\,\\text{cm}$ in front of a concave mirror whose focal length is $-15\\,\\text{cm}$. Using the mirror formula, calculate the image distance $v$ (in cm).
Step-by-Step Mathematical Derivation:
Benchmark: 90s
For a spherical mirror, the mirror formula is \\[\\frac{1}{f}=\\frac{1}{v}+\\frac{1}{u}\\]\\ Using the sign convention (real object in front of the mirror):\\ \\[f=-15\\,\\text{cm},\\quad u=-30\\,\\text{cm}\\]\\ Substituting,\\ \\[\\frac{1}{v}=\\frac{1}{f}-\\frac{1}{u}=\\frac{1}{-15}-\\frac{1}{-30}= -\\frac{1}{15}+\\frac{1}{30}= -\\frac{2-1}{30}= -\\frac{1}{30}\\]\\ Hence, \\[v=-30\\,\\text{cm}\\]\\ The negative sign indicates that the image is real and formed on the same side as the object.`;

function formatAndCleanLatex(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw;

  // 1. Clean up LLM artifacts like ':\ \[' or ',\ \[' or '\]\ '
  // Replace '\]\' with '\]\n'
  text = text.replace(/\\\]\\/g, '\\]\n');
  text = text.replace(/\\\\\s*\\\[/g, '\n\\[');
  text = text.replace(/:\s*\\\\\s*/g, ':\n');
  text = text.replace(/,\s*\\\\\s*/g, ',\n');

  // 2. Normalize display math delimiters:
  // Convert \\[ ... \\] to $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    return `\n$$${formula.trim()}$$\n`;
  });

  // 3. Normalize inline math delimiters:
  // Convert \\( ... \\) to $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    return `$${formula.trim()}$`;
  });

  return text;
}

console.log('--- FORMATTED FOR KATEX ---');
console.log(formatAndCleanLatex(rawLlmOutput));
