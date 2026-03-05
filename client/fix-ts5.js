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

// 1. Articles Prisma Import Fix
regexReplace('src/app/admin/articles/page.tsx',
    /import \{ Article \} from '@prisma\/client';\n?/g,
    ""
);
regexReplace('src/app/admin/articles/page.tsx',
    /import \{ ArticleForm \} from '@\/components\/articles\/article-form';/,
    "import { ArticleForm } from '@/components/articles/article-form';\n\ntype Article = {\n  id: number;\n  title: string;\n  slug: string;\n  content: string;\n  isPublished: boolean;\n  imageUrl?: string;\n  createdAt: string;\n};"
);

// 2. Resolver Fixes
replace('src/app/admin/settings/page.tsx', 'resolver: zodResolver(settingsSchema),', 'resolver: zodResolver(settingsSchema) as any,');
replace('src/components/articles/article-form.tsx', 'resolver: zodResolver(articleSchema),', 'resolver: zodResolver(articleSchema) as any,');
replace('src/components/projects/project-form.tsx', 'resolver: zodResolver(projectSchema),', 'resolver: zodResolver(projectSchema) as any,');
replace('src/components/promos/promo-form.tsx', 'resolver: zodResolver(promoSchema),', 'resolver: zodResolver(promoSchema) as any,');

// 3. Project Form missing FormField control cast
regexReplace('src/components/projects/project-form.tsx', /<FormField\s*control=\{form\.control\}/g, '<FormField control={form.control as any}');
