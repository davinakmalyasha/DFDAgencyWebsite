const fs = require('fs');
const path = require('path');

function regexReplace(file, regex, to) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(regex, to);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated (regex) ${file}`);
}

// 1. Add missing fields to Article type
regexReplace('src/app/admin/articles/page.tsx',
    /isPublished: boolean;/g,
    "isPublished: boolean;\n  authorName?: string;\n  publishedAt?: string;"
);

// 2. Force zodResolver as any globally
regexReplace('src/components/articles/article-form.tsx', /resolver:\s*zodResolver\(([^)]+)\),?/g, 'resolver: zodResolver($1) as any,');
regexReplace('src/components/projects/project-form.tsx', /resolver:\s*zodResolver\(([^)]+)\),?/g, 'resolver: zodResolver($1) as any,');

// 3. Force form.control as any globally in project-form
regexReplace('src/components/projects/project-form.tsx', /control=\{form\.control\}/g, 'control={form.control as any}');
