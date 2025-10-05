import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
export default function Blog() {
  const postsDir = path.join(process.cwd(), 'content', 'posts')
  const files = fs.readdirSync(postsDir).filter(f=>f.endsWith('.md'))
  const posts = files.map(fn=>{ const raw = fs.readFileSync(path.join(postsDir,fn),'utf8'); const {data} = matter(raw); return {slug:fn.replace('.md',''), title:data.title, date:data.date} })
  return (<section className="container py-12"><h1 className="text-3xl font-bold text-gold">Новости</h1><ul className="mt-6">{posts.map(p=>(<li key={p.slug}><a href={`/posts/${p.slug}`} className="text-lg text-white">{p.title}</a> <span className="text-muted">{p.date}</span></li>))}</ul></section>)}
