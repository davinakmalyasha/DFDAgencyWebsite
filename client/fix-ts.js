const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    let newContent = content;
    replacements.forEach(r => {
        // we use a while loop if g flag is not used, but using regex with global flag is better.
        newContent = newContent.replace(r.from, r.to);
    });
    if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. Articles Page
replaceInFile('src/app/admin/articles/page.tsx', [
    { from: /useState<Record<string, unknown>\[\]>/g, to: 'useState<Article[]>' },
    { from: /useState<Record<string, unknown> \| undefined>/g, to: 'useState<Article | undefined>' }
]);

// 2. Promo Form
replaceInFile('src/components/promos/promo-form.tsx', [
    { from: /useState<Record<string, unknown>\[\]>/g, to: 'useState<{id: number; name: string}[]>' },
    { from: /pkg\.id/g, to: '(pkg as {id: number}).id' },
    { from: /pkg\.name/g, to: '(pkg as {name: string}).name' },
    { from: /<FormField\s*\n\s*control=\{form\.control as never\}/g, to: '{/* @ts-expect-error React Hook Form version mismatch */}\n                            <FormField\n                                control={form.control}' },
    { from: /<FormField\n\s*control=\{form\.control as never\}/g, to: '{/* @ts-expect-error React Hook Form version mismatch */}\n                            <FormField\n                                control={form.control}' },
    { from: /control=\{form\.control as never\}/g, to: 'control={form.control}' },
    { from: /\(err as Error\)\.response/g, to: '(err as {response?: {data?: {message?: string}}}).response' },
    { from: /\(error as Error\)\.response/g, to: '(error as {response?: {data?: {message?: string}}}).response' }
]);

// 3. Settings Page
replaceInFile('src/app/admin/settings/page.tsx', [
    { from: /<FormField\s*\n\s*control=\{form\.control as never\}/g, to: '{/* @ts-expect-error React Hook Form version mismatch */}\n                            <FormField\n                                control={form.control}' },
    { from: /<FormField\n\s*control=\{form\.control as never\}/g, to: '{/* @ts-expect-error React Hook Form version mismatch */}\n                            <FormField\n                                control={form.control}' },
    { from: /control=\{form\.control as never\}/g, to: 'control={form.control}' }
]);

// 4. Project Form
replaceInFile('src/components/projects/project-form.tsx', [
    { from: /<FormField\s*\n\s*control=\{form\.control as never\}/g, to: '{/* @ts-expect-error React Hook Form version mismatch */}\n                            <FormField\n                                control={form.control}' },
    { from: /<FormField\n\s*control=\{form\.control as never\}/g, to: '{/* @ts-expect-error React Hook Form version mismatch */}\n                            <FormField\n                                control={form.control}' },
    { from: /control=\{form\.control as never\}/g, to: 'control={form.control}' },
    { from: /category: "SERVICES" as never/g, to: 'category: "SERVICES" as "SERVICES" | "CORPORATE" | "INTERIOR" | "RESIDENTIAL"' },
    { from: /\(error as Error\)\.response/g, to: '(error as {response?: {data?: {message?: string}}}).response' }
]);

// 5. Test Checkout
replaceInFile('src/app/test-checkout/page.tsx', [
    { from: /useState<Record<string, unknown>\[\]>/g, to: 'useState<{id: string; name: string; price: number; features: string[]}[]>' },
    { from: /\(error as Error\)\.response/g, to: '(error as {response?: {data?: {message?: string}}}).response' }
]);

// 6. Article Form
replaceInFile('src/components/articles/article-form.tsx', [
    { from: /<FormField\s*\n\s*control=\{form\.control as never\}/g, to: '{/* @ts-expect-error React Hook Form version mismatch */}\n                            <FormField\n                                control={form.control}' },
    { from: /<FormField\n\s*control=\{form\.control as never\}/g, to: '{/* @ts-expect-error React Hook Form version mismatch */}\n                            <FormField\n                                control={form.control}' },
    { from: /control=\{form\.control as never\}/g, to: 'control={form.control}' },
    { from: /\(error as Error\)\.response/g, to: '(error as {response?: {data?: {message?: string}}}).response' }
]);

// 7. Package Form
replaceInFile('src/components/packages/package-form.tsx', [
    { from: /\(error as Error\)\.response/g, to: '(error as {response?: {data?: {message?: string}}}).response' }
]);

// 8. Image Uploader
replaceInFile('src/components/projects/image-uploader.tsx', [
    { from: /\(error as Error\)\.response/g, to: '(error as {response?: {data?: {message?: string}}}).response' }
]);

// 9. Login Page
replaceInFile('src/app/admin/login/page.tsx', [
    { from: /\(error as Error\)\.response/g, to: '(error as {response?: {data?: {message?: string}}}).response' }
]);

// 10. Admin Projects
replaceInFile('src/app/admin/projects/page.tsx', [
    { from: /project\.link/g, to: 'project.slug' }
]);

// 11. Track Page
replaceInFile('src/app/track/[id]/page.tsx', [
    { from: /useState<Record<string, unknown> \| null>\(null\)/g, to: 'useState<{id: string, status: string, totalAmount: number, createdAt: string, Project?: {slug: string}} | null>(null)' }
]);

// 12. AI Writer Modal
replaceInFile('src/components/ai-writer-modal.tsx', [
    { from: /\(error as Error\)\.response/g, to: '(error as {response?: {data?: {message?: string}}}).response' }
]);
