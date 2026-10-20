function SkeletonLine({ className = "" }: { className?: string }) {
  return <span className={`skeleton-block ${className}`} />;
}

export function EditorialPageSkeleton() {
  return (
    <div className="container skeleton-page" role="status" aria-label="Loading page">
      <span className="sr-only">Loading page</span>
      <section className="skeleton-hero" aria-hidden="true">
        <SkeletonLine className="skeleton-eyebrow" />
        <SkeletonLine className="skeleton-title" />
        <SkeletonLine className="skeleton-copy" />
        <SkeletonLine className="skeleton-copy skeleton-copy-short" />
      </section>
      <section className="skeleton-feature" aria-hidden="true">
        <SkeletonLine className="skeleton-feature-art" />
        <div className="skeleton-feature-copy">
          <SkeletonLine className="skeleton-meta" />
          <SkeletonLine className="skeleton-heading" />
          <SkeletonLine className="skeleton-copy" />
          <SkeletonLine className="skeleton-copy skeleton-copy-short" />
          <SkeletonLine className="skeleton-link" />
        </div>
      </section>
      <div className="skeleton-grid" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div className="skeleton-card" key={item}>
            <SkeletonLine className="skeleton-meta" />
            <SkeletonLine className="skeleton-heading" />
            <SkeletonLine className="skeleton-copy" />
            <SkeletonLine className="skeleton-copy skeleton-copy-short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArticlePageSkeleton() {
  return (
    <div className="container article-shell skeleton-article" role="status" aria-label="Loading article">
      <span className="sr-only">Loading article</span>
      <div className="skeleton-topline" aria-hidden="true"><SkeletonLine className="skeleton-meta" /></div>
      <header className="article-header" aria-hidden="true">
        <SkeletonLine className="skeleton-meta" />
        <SkeletonLine className="skeleton-title" />
        <SkeletonLine className="skeleton-copy" />
        <SkeletonLine className="skeleton-copy skeleton-copy-short" />
      </header>
      <div className="article-layout" aria-hidden="true">
        <div className="skeleton-article-body">
          <SkeletonLine className="skeleton-heading" />
          {[0, 1, 2].map((paragraph) => (
            <div className="skeleton-paragraph" key={paragraph}>
              <SkeletonLine className="skeleton-copy" />
              <SkeletonLine className="skeleton-copy" />
              <SkeletonLine className={`skeleton-copy${paragraph === 2 ? " skeleton-copy-short" : ""}`} />
            </div>
          ))}
        </div>
        <aside className="skeleton-article-aside"><SkeletonLine className="skeleton-meta" /></aside>
      </div>
    </div>
  );
}

export function CategoryPageSkeleton() {
  return (
    <div className="skeleton-category" role="status" aria-label="Loading category">
      <span className="sr-only">Loading category</span>
      <div className="container skeleton-hero" aria-hidden="true">
        <SkeletonLine className="skeleton-eyebrow" />
        <SkeletonLine className="skeleton-title" />
        <SkeletonLine className="skeleton-copy skeleton-copy-short" />
      </div>
      <div className="container skeleton-grid skeleton-category-grid" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div className="skeleton-card" key={item}>
            <SkeletonLine className="skeleton-meta" />
            <SkeletonLine className="skeleton-heading" />
            <SkeletonLine className="skeleton-copy" />
            <SkeletonLine className="skeleton-copy skeleton-copy-short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TextPageSkeleton() {
  return (
    <div className="skeleton-text-page" role="status" aria-label="Loading page">
      <span className="sr-only">Loading page</span>
      <header className="page-hero" aria-hidden="true">
        <div className="container">
          <SkeletonLine className="skeleton-eyebrow" />
          <SkeletonLine className="skeleton-title" />
          <SkeletonLine className="skeleton-copy" />
          <SkeletonLine className="skeleton-copy skeleton-copy-short" />
        </div>
      </header>
      <article className="container prose-page skeleton-prose" aria-hidden="true">
        {[0, 1, 2, 3].map((section) => (
          <section key={section}>
            <SkeletonLine className="skeleton-heading" />
            <SkeletonLine className="skeleton-copy" />
            <SkeletonLine className="skeleton-copy" />
            {section < 2 && <SkeletonLine className="skeleton-copy skeleton-copy-short" />}
          </section>
        ))}
      </article>
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div role="status" aria-label="Loading search">
      <span className="sr-only">Loading search</span>
      <header className="page-hero" aria-hidden="true">
        <div className="container">
          <SkeletonLine className="skeleton-eyebrow" />
          <SkeletonLine className="skeleton-title" />
          <SkeletonLine className="skeleton-copy" />
          <SkeletonLine className="skeleton-search-field" />
        </div>
      </header>
      <section className="container prose-page"><SearchResultsSkeleton /></section>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="search-results search-skeleton" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <article className="search-result" key={item}>
          <SkeletonLine className="skeleton-meta" />
          <SkeletonLine className="skeleton-heading" />
          <SkeletonLine className="skeleton-copy" />
          <SkeletonLine className="skeleton-copy skeleton-copy-short" />
        </article>
      ))}
    </div>
  );
}
