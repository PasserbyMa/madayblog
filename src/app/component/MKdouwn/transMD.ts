// lib/posts.ts
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
//defaultSchema<-깃헙 기준 허용 목
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import matter from 'gray-matter';

const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        // 코드 하이라이팅을 위해 class 속성 허용 (rehype-highlight가 class 사용)
        code: [...(defaultSchema.attributes?.code ?? []), 'className'],
        span: [...(defaultSchema.attributes?.span ?? []), 'className'],
        div:  [...(defaultSchema.attributes?.div  ?? []), 'className'],
        pre:  [...(defaultSchema.attributes?.pre  ?? []), 'className'],
    },
};

export async function ConvertMarkdownToHtml(markdownContent: string) {
    const matterResult = matter(markdownContent);

    const processedContent = await remark()
        .use(remarkGfm) 
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw) // raw HTML 파싱
        .use(rehypeSanitize, sanitizeSchema) // 위험 태그/속성 제거
        .use(rehypeHighlight) // 코드 하이라이팅
        .use(rehypeStringify) // HTML 문자열 변환 (allowDangerousHtml 옵션 제거)
        .process(matterResult.content);

    const contentHtml = processedContent.toString();

    return {
        contentHtml,
        ...matterResult.data,
    };
}
