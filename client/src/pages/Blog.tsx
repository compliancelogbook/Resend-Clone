/** Blog front page: latest post featured, then everything else, filterable by category. */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  BLOG_CATEGORIES,
  CATEGORY_SLUGS,
  categoryFromSlug,
  formatShortDate,
  SHOW_DRAFTS,
  visiblePosts,
  type BlogCategory,
  type BlogPost,
} from "@/content/blog";
import "./blog.css";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Blog() {
  const [category, setCategory] = useState<BlogCategory | null>(() => categoryFromSlug(new URLSearchParams(window.location.search).get("category")));

  useEffect(() => {
    document.title = "Blog · EasyFeezy";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const url = category ? `/blog?category=${CATEGORY_SLUGS[category]}` : "/blog";
    window.history.replaceState(null, "", url);
  }, [category]);

  const posts = useMemo(() => visiblePosts(SHOW_DRAFTS).filter((p) => !category || p.category === category), [category]);
  const [featured, ...rest] = posts;

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="bl-hero">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <span className="calc-pill">Blog</span>
          <h1>Commerce, every morning</h1>
          <p>Daily intelligence on marketplaces, seller economics and agentic commerce, with the source behind every story.</p>
        </motion.div>
        <nav className="bl-filters" aria-label="Filter by category">
          <button type="button" className={!category ? "active" : ""} onClick={() => setCategory(null)}>All</button>
          {BLOG_CATEGORIES.map((c) => (
            <button key={c} type="button" className={category === c ? "active" : ""} onClick={() => setCategory(c)}>
              <i className={`bl-dot bl-${CATEGORY_SLUGS[c]}`} aria-hidden="true" />
              {c}
            </button>
          ))}
        </nav>
      </section>

      <section className="bl-body">
        <AnimatePresence mode="wait">
          <motion.div key={category ?? "all"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
            {featured ? (
              <>
                <FeaturedCard post={featured} />
                {rest.length > 0 && (
                  <div className="bl-grid">
                    {rest.map((p) => <PostCard key={p.slug} post={p} />)}
                  </div>
                )}
              </>
            ) : (
              <p className="bl-empty">No {category} posts yet. Check back soon.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <SiteFooter />
    </main>
  );
}

function Meta({ post }: { post: BlogPost }) {
  return (
    <p className="bl-meta">
      <span className={`bl-cat bl-${CATEGORY_SLUGS[post.category]}`}>
        <i className="bl-dot" aria-hidden="true" />
        {post.category}
      </span>
      <span>{formatShortDate(post.date)}</span>
      <span>{post.readMinutes} min read</span>
      {post.status === "draft" && <span className="bl-draft">Draft</span>}
    </p>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`bl-featured bl-tone-${CATEGORY_SLUGS[post.category]}`}>
      <div className="bl-featured-copy">
        <Meta post={post} />
        <h2>{post.title}</h2>
        <p>{post.summary}</p>
        <span className="bl-read">Read the {post.category === "Daily Brief" ? "brief" : "story"} <ArrowRight size={16} /></span>
      </div>
      <div className="bl-featured-art" aria-hidden="true">
        <span className="bl-art-date">
          <b>{new Date(`${post.date}T12:00:00`).getDate()}</b>
          {new Date(`${post.date}T12:00:00`).toLocaleDateString("en-GB", { month: "long" })}
        </span>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`bl-card bl-tone-${CATEGORY_SLUGS[post.category]}`}>
      <Meta post={post} />
      <h3>{post.title}</h3>
      <p>{post.summary}</p>
      <span className="bl-read">Read <ArrowRight size={15} /></span>
    </Link>
  );
}
