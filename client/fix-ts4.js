const fs = require('fs');
const path = require('path');

function replace(file, from, to) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.split(from).join(to);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
}

function regexReplace(file, regex, to) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(regex, to);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated (regex) ${file}`);
}

// 1. Articles
regexReplace('src/app/admin/articles/page.tsx',
    /import \{ useEffect, useState \} from 'react';/,
    "import { useEffect, useState } from 'react';\nimport { Article } from '@prisma/client';"
);

// 2. Projects
replace('src/app/admin/projects/page.tsx', 'proj.link && (', '(proj as any).link && (');
replace('src/app/admin/projects/page.tsx', 'href={proj.link}', 'href={(proj as any).link}');

// 3. Unused ts-expect-error
const removeUnusedTSExpectError = (file) => {
    regexReplace(file, /\{\/\*\s*@ts-expect-error[^\*]*\*\/\}\s*<FormField/g, '<FormField');
    regexReplace(file, /\/\/\s*@ts-expect-error[^\n]*\n\s*resolver:/g, 'resolver:');
    // For articles
    regexReplace(file, /\{\/\*\s*@ts-expect-error[^\*]*\*\/\}\n\s*<FormField/g, '<FormField');
};

removeUnusedTSExpectError('src/app/admin/settings/page.tsx');
removeUnusedTSExpectError('src/components/articles/article-form.tsx');
removeUnusedTSExpectError('src/components/projects/project-form.tsx');
removeUnusedTSExpectError('src/components/promos/promo-form.tsx');

// 4. Track
replace('src/app/track/[id]/page.tsx', 'useState<Record<string, unknown>>(null)', 'useState<any>(null)');

// 5. PortfolioMasonry
replace('src/components/landing/PortfolioMasonry.tsx', 'new Date(p.completionDate || new Date())', 'new Date((p.completionDate as string) || new Date().toISOString())');
replace('src/components/landing/PortfolioMasonry.tsx', '{item.title}', '{String(item.title || "")}');
replace('src/components/landing/PortfolioMasonry.tsx', '{item.category}', '{String(item.category || "")}');
replace('src/components/landing/PortfolioMasonry.tsx', '{item.year}', '{String(item.year || "")}');
