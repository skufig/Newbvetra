import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
export default async function Post({ params }: any){ const slug = params.slug; const p = path.join(process.cwd(),'content','posts', `${slug}.md`); const raw = fs.readFileSync(p,'utf8'); const { data, content } = matter(raw); const processed = await remark().use(html).process(content); const body = String(processed); return (<section className="container py-12"><h1 className="text-3xl font-bold text-gold">{data.title}</h1><div className="mt-4 text-muted" dangerouslySetInnerHTML={{__html: body}} /></section>)}
