/** A single blog post: reading progress, key takeaways, sourced story cards and related posts. */
import { useEffect } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, CircleAlert, Info } from "lucide-react";
import { Link, useParams } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NotFound from "@/pages/NotFound";
import { CATEGORY_SLUGS, formatPostDate, formatShortDate, SHOW_DRAFTS, visiblePosts, type Block, type BlogPost as Post } from "@/content/blog";
import "./blog.css";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const posts = visiblePosts(SHOW_DRAFTS);
  const post = posts.find((p) => p.slug === slug);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });

  useEffect(() => {
    if (post) document.title = `${post.title} · EasyFeezy`;
    window.scrollTo(0, 0);
  }, [slug, post]);

  if (!post) return <NotFound />;

  const sameDay = posts.filter((p) => p.slug !== post.slug && p.date === post.date);
  const related = (sameDay.length ? sameDay : posts.filter((p) => p.slug !== post.slug)).slice(0, 3);
  const tone = `bl-tone-${CATEGORY_SLUGS[post.category]}`;

  return (
    <main className="site-shell">
      <motion.div className="bl-progress" style={{ scaleX: progress }} aria-hidden="true" />
      <SiteHeader />

      <article className={`bl-article ${tone}`}>
        <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <Link href="/blog" className="bl-back"><ArrowLeft size={15} /> All posts</Link>
          <p className="bl-meta">
            <Link href={`/blog?category=${CATEGORY_SLUGS[post.category]}`} className={`bl-cat bl-${CATEGORY_SLUGS[post.category]}`}>
              <i className="bl-dot" aria-hidden="true" />
              {post.category}
            </Link>
            <span>{formatPostDate(post.date)}</span>
            <span>{post.readMinutes} min read</span>
            {post.status === "draft" && <span className="bl-draft">Draft</span>}
          </p>
          <h1>{post.title}</h1>
          <p className="bl-lead">{post.summary}</p>
          {post.status === "draft" && (
            <p className="bl-draft-note">
              <CircleAlert size={15} /> Draft for review. Stories marked “Source to confirm” need checking against the original source before this post goes live.
            </p>
          )}
        </motion.header>

        <div className="bl-content">
          {post.blocks.map((b, i) => <BlockView key={i} block={b} draft={post.status === "draft"} />)}
        </div>
      </article>

      {related.length > 0 && (
        <section className="bl-related">
          <h2>{sameDay.length ? "More from this morning" : "More from the blog"}</h2>
          <div className="bl-grid">
            {related.map((p) => <RelatedCard key={p.slug} post={p} />)}
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}

function BlockView({ block, draft }: { block: Block; draft: boolean }) {
  switch (block.type) {
    case "p":
      return <p className="bl-p">{block.text}</p>;
    case "h2":
      return <h2 className="bl-h2">{block.text}</h2>;
    case "list":
      return <ul className="bl-list">{block.items.map((t) => <li key={t}>{t}</li>)}</ul>;
    case "takeaways":
      return (
        <aside className="bl-takeaways">
          <p>Key takeaways</p>
          <ol>{block.items.map((t, i) => <li key={t}><span>{i + 1}</span>{t}</li>)}</ol>
        </aside>
      );
    case "callout":
      return (
        <aside className="bl-callout">
          <Info size={17} />
          <div>
            <b>{block.title}</b>
            <p>{block.text}</p>
          </div>
        </aside>
      );
    case "cta":
      return (
        <Link href={block.href} className="bl-cta">
          <span>
            <b>{block.label}</b>
            {block.text && <small>{block.text}</small>}
          </span>
          <ArrowRight size={18} />
        </Link>
      );
    case "story":
      return (
        <section className="bl-story">
          <header>
            <h3>{block.title}</h3>
            {block.status && <span className="bl-status">{block.status}</span>}
          </header>
          {block.stats && block.stats.length > 0 && (
            <dl className={`bl-stats n-${block.stats.length}`}>
              {block.stats.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {block.body.map((t) => <p key={t}>{t}</p>)}
          {block.caveat && <p className="bl-caveat"><b>Worth knowing:</b> {block.caveat}</p>}
          <footer className="bl-sources">
            <span>Source</span>
            {block.sources.map((s) =>
              s.url ? (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer">{s.name}{s.date ? `, ${s.date}` : ""} <ArrowUpRight size={12} /></a>
              ) : (
                <em key={s.name}>{s.name}{s.date ? `, ${s.date}` : ""}</em>
              ),
            )}
            {draft && !block.verified && <i className="bl-unverified">Source to confirm</i>}
          </footer>
        </section>
      );
  }
}

function RelatedCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`bl-card bl-tone-${CATEGORY_SLUGS[post.category]}`}>
      <p className="bl-meta">
        <span className={`bl-cat bl-${CATEGORY_SLUGS[post.category]}`}><i className="bl-dot" aria-hidden="true" />{post.category}</span>
        <span>{formatShortDate(post.date)}</span>
      </p>
      <h3>{post.title}</h3>
      <span className="bl-read">Read <ArrowRight size={15} /></span>
    </Link>
  );
}
