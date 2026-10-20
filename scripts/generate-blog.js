const fs = require("node:fs");
const path = require("node:path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const matter = require("gray-matter");

const postsDirectory = path.join(__dirname, "..", "content", "posts");
const today = new Date().toISOString().slice(0, 10);

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function readExistingPosts() {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs.readdirSync(postsDirectory)
    .filter((name) => /\.(md|mdx)$/i.test(name))
    .map((name) => {
      const source = fs.readFileSync(path.join(postsDirectory, name), "utf8");
      const { data } = matter(source);
      return { filename: name, slug: String(data.slug ?? ""), title: String(data.title ?? ""), date: normalizeDate(data.date) };
    });
}

function validatePost(source) {
  const parsed = matter(source);
  const data = parsed.data;
  data.date = normalizeDate(data.date);
  const required = ["title", "date", "description", "slug", "locale", "keywords", "author", "authorBio"];
  const missing = required.filter((key) => data[key] === undefined || data[key] === "");
  if (missing.length) throw new Error(`Generated frontmatter is missing: ${missing.join(", ")}`);
  if (data.date !== today) throw new Error(`Generated date must be ${today}.`);
  if (String(data.description).length > 155) throw new Error("Meta description exceeds 155 characters.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(data.slug))) throw new Error("Slug must be lowercase kebab-case.");
  if (data.locale !== "en") throw new Error("The daily generator currently publishes English articles only.");
  if (!Array.isArray(data.keywords) || data.keywords.length === 0) throw new Error("At least one keyword is required.");

  const body = parsed.content;
  const headings = [...body.matchAll(/^## (.+)$/gm)];
  if (headings.length < 2) throw new Error("Article must contain at least two H2 sections.");
  const keyword = String(data.keywords[0]).toLocaleLowerCase();
  const h1 = body.match(/^# (.+)$/m)?.[1] ?? "";
  const openingParagraph = body.replace(/^# .+\r?\n+/, "").trim().split(/\r?\n\s*\r?\n/)[0] ?? "";
  if (
    !String(data.title).toLocaleLowerCase().includes(keyword)
    || !h1.toLocaleLowerCase().includes(keyword)
    || !openingParagraph.toLocaleLowerCase().includes(keyword)
  ) {
    throw new Error("The primary keyword must appear in the title, H1, and opening paragraph.");
  }
  if (!String(data.slug).includes(keyword.replace(/\s+/g, "-"))) throw new Error("The primary keyword must appear in the slug.");
  if (!String(data.description).toLocaleLowerCase().includes(keyword)) throw new Error("The primary keyword must appear in the meta description.");

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index][1].trim();
    if (!/\?$/.test(heading)) throw new Error(`H2 must be phrased as a question: "${heading}".`);
    const start = headings[index].index + headings[index][0].length;
    const end = headings[index + 1]?.index ?? body.length;
    const following = body.slice(start, end).trim().split(/\r?\n/).find((line) => line.trim() && !line.startsWith("#"));
    if (!following) throw new Error(`H2 has no answer paragraph: "${heading}".`);
    const wordCount = following.trim().split(/\s+/).length;
    if (wordCount < 40 || wordCount > 60) throw new Error(`First answer under "${heading}" has ${wordCount} words; expected 40–60.`);
  }
  if (!headings.some(([match, heading]) => heading.toLocaleLowerCase().includes(keyword))) {
    throw new Error("The primary keyword must appear in at least one H2 heading.");
  }
  if (!/^\s*(?:[-*] |\|)/m.test(body)) throw new Error("Article must include a list or table.");
  if (!/\[[^\]]+\]\(https?:\/\/[^)]+\)/i.test(body)) throw new Error("Article must cite at least one credible source using a URL.");
  return parsed;
}

async function main() {
  if (process.env.GITHUB_ACTIONS !== "true") {
    throw new Error("Blog generation is restricted to GitHub Actions; run the daily-blog workflow instead.");
  }
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required.");

  const existing = readExistingPosts();
  if (existing.some((post) => post.date === today)) {
    console.log(`A post is already present for ${today}; skipping to keep the daily cadence idempotent.`);
    return;
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: modelName });
  const topic = process.env.BLOG_TOPIC || "technology, software, and digital culture";
  const author = process.env.BLOG_AUTHOR || "Blog Editorial Team";
  const authorBio = process.env.BLOG_AUTHOR_BIO || "An editorial team sharing practical, researched explanations.";
  const avoid = existing.map((post) => `- ${post.title} (slug: ${post.slug})`).join("\n") || "- None";
  const prompt = `Write one original, accurate English-language blog article on this publication topic: ${topic}.

Existing published titles and slugs (do not repeat the topic or wording):
${avoid}

Return ONLY valid MDX with YAML frontmatter. Frontmatter must include title, date (${today}), description (155 characters maximum), slug (lowercase hyphenated), locale (en), keywords (YAML list), author (${author}), authorBio (${authorBio}), and category.

Content rules:
- Include one H1. Choose a primary keyword and include it in the title, H1, opening paragraph, at least one H2, and description.
- Use at least three question-form H2 headings. The first paragraph immediately below EVERY H2 must contain 40–60 whitespace-separated words and directly answer its question without relying on context.
- Keep subsequent paragraphs concise. Add useful bullet points or a comparison table.
- Include at least one specific, verifiable fact and link to a credible primary source with a full https URL. Do not invent statistics, quotes, studies, or source links; if a number cannot be verified, use a concrete example instead.
- Be useful and original. Avoid keyword stuffing, exaggerated claims, and claims of guaranteed rankings. Do not include executable HTML or scripts.
- End with a question-form Sources H2 (for example, "Which sources support these claims?"), followed by a 40–60 word source summary and a list containing the source link.`;

  const result = await model.generateContent(prompt);
  const source = result.response.text().trim().replace(/^```(?:mdx|markdown)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = validatePost(source);
  const title = String(parsed.data.title);
  let slug = String(parsed.data.slug);
  if (existing.some((post) => post.title.toLocaleLowerCase() === title.toLocaleLowerCase())) {
    throw new Error(`Gemini generated an existing title: "${title}".`);
  }
  if (existing.some((post) => post.slug === slug)) slug = `${slug}-${today}`;
  if (existing.some((post) => post.slug === slug)) throw new Error(`Generated slug is already in use: "${slug}".`);
  if (slug !== parsed.data.slug) parsed.data.slug = slug;

  fs.mkdirSync(postsDirectory, { recursive: true });
  const destination = path.join(postsDirectory, `${slug}.mdx`);
  if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite existing post: ${destination}`);
  const output = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(destination, output.endsWith("\n") ? output : `${output}\n`, { flag: "wx" });
  console.log(`Created ${path.relative(process.cwd(), destination)} (${title}).`);
}

main().catch((error) => {
  console.error("Daily blog generation failed:", error.message);
  process.exitCode = 1;
});
