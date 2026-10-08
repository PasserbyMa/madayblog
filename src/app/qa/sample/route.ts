import fs from 'fs';
import path from 'path';

export async function GET() {
    const file = fs.readFileSync(path.join(process.cwd(), 'public/qa-sample.xlsx'));
    return new Response(file, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="QA_Sample.xlsx"',
        },
    });
}
