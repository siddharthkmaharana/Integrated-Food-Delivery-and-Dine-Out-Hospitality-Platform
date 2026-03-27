import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceDir = path.join(__dirname, 'src');

function traverse(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // 1. Literal $ inside HTML: <span>$</span> => <span>₹</span> or ${price} => ₹{price}
            // In typical jsx: \${ or \$[0-9]
            // e.g. -${discount} => -₹{discount}
            // e.g. $${deliveryFee} => ₹${deliveryFee}
            // e.g. ${subtotal.toFixed(2)} => ₹{subtotal.toFixed(2)} inside jsx tags.
            // Replace literal '$' before '{' or digit
            
            // For simple match like \${var} we want ₹{var}
            // But wait, template literals use ${}. If it's inside ` ` then `${var}` is interpolation.
            // In JSX, if it's `{...}` it's evaluated JS. If the text says `${total}` it means JSX text `$` followed by evaluated `{total}`. We want `₹{total}`.
            
            // If it's a template literal: `... $${price} ...` -> `... ₹${price} ...`
            
            // This regex finds a dollar sign that is literally printed. 
            // In React jsx text, it's just `$` followed by `{`. 
            // In template strings, it's `$${`.
            
            const regexInterpolated = /\$\$\{/g;
            if (regexInterpolated.test(content)) {
                content = content.replace(regexInterpolated, '₹${');
                modified = true;
            }

            const regexJsxMarkup = /\$\{/g;
            // Wait, \$\{ could be template string literal. 
            // If it's inside template string `xxx ${abc}`, the $ is functional, we MUST NOT CHANGE IT.
            // But if it's JSX text `>${total}` or ` ${` it is literal.
            // Let's explicitly replace specific cases:
            
            const safeReplacements = [
                { match: />\$\{/g, replace: '>₹{' }, // e.g. <span>${total.toFixed(2)}
                { match: /\>-\$\{/g, replace: '>-₹{' }, // e.g. <span>-${discount}
                { match: / \$\{/g, replace: ' ₹{' },  // e.g. "Total ${...}"
                { match: /"\$"/g, replace: '"₹"' },
                { match: /"\$\+"/g, replace: '"₹₹"' },
                { match: /"\$\$\+"/g, replace: '"₹₹"' },
                { match: /"\$\$\$\+"/g, replace: '"₹₹₹"' },
                { match: /"\$\$\$\$\+"/g, replace: '"₹₹₹₹"' },
                { match: /"Under \$10"/g, replace: '"Under ₹100"' },
                { match: /"\$10-20"/g, replace: '"₹100-200"' },
                { match: /"\$20-30"/g, replace: '"₹200-300"' },
                { match: /"Over \$30"/g, replace: '"Over ₹300"' },
                { match: /minimum order \$(\$\{)/gi, replace: 'minimum order ₹$1' },
                { match: /\(\"\$\"/g, replace: '("₹"' },
                { match: /\(\"\$\$\"/g, replace: '("₹₹"' },
                { match: /\|\| \"\$\$\"/g, replace: '|| "₹₹"' }
            ];

            safeReplacements.forEach(({match, replace}) => {
                if (match.test(content)) {
                    content = content.replace(match, replace);
                    modified = true;
                }
            });

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Replaced in ${fullPath}`);
            }
        }
    });
}

traverse(sourceDir);
console.log('Conversion complete!');
