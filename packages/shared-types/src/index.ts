export type BlogPostSummary = {
  title: string;
  slug: string;
  description: string;
  date: string;
  locale: string;
  keywords: string[];
  author: string;
  category?: string;
  image?: string;
};

export type BlogPost = BlogPostSummary & {
  content: string;
};

export type PostsResponse = {
  posts: BlogPostSummary[];
  page: number;
  pageSize: number;
  total: number;
};
