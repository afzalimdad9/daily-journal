const fs = require("node:fs");
const path = require("node:path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const matter = require("gray-matter");

const postsDirectory = path.join(__dirname, "..", "content", "posts");
const locales = ["en", "es", "fr", "de", "ar"];
const localeNames = {
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic"
};
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
      return {
        filename: name,
        slug: String(data.slug ?? ""),
        title: String(data.title ?? ""),
        locale: String(data.locale ?? "en"),
        date: normalizeDate(data.date)
      };
    });
}

function getHeadings(content) {
  return [...content.matchAll(/^## (.+)$/gm)];
}

function validateSections(content, minimumHeadings = 3) {
  const headings = getHeadings(content);
  if (headings.length < minimumHeadings) {
    throw new Error(`Article must contain at least ${minimumHeadings} H2 sections.`);
  }

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index][1].trim();
    if (!/[?؟]$/.test(heading)) throw new Error(`H2 must be phrased as a question: "${heading}".`);
    const start = headings[index].index + headings[index][0].length;
    const end = headings[index + 1]?.index ?? content.length;
    const following = content.slice(start, end).trim().split(/\r?\n/).find((line) => line.trim() && !line.startsWith("#"));
    if (!following) throw new Error(`H2 has no answer paragraph: "${heading}".`);
    const wordCount = following.trim().split(/\s+/).length;
    if (wordCount < 40 || wordCount > 60) {
      throw new Error(`First answer under "${heading}" has ${wordCount} words; expected 40–60.`);
    }
  }

  return headings;
}

function validatePost(source) {
  const parsed = matter(source);
  const data = parsed.data;
  data.date = normalizeDate(data.date);
  const required = ["title", "date", "description", "slug", "locale", "keywords", "author", "authorBio", "category"];
  const missing = required.filter((key) => data[key] === undefined || data[key] === "");
  if (missing.length) throw new Error(`Generated frontmatter is missing: ${missing.join(", ")}`);
  if (data.date !== today) throw new Error(`Generated date must be ${today}.`);
  if (String(data.description).length > 155) throw new Error("Meta description exceeds 155 characters.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(data.slug))) throw new Error("Slug must be lowercase kebab-case.");
  if (data.locale !== "en") throw new Error("The source article must use locale en.");
  if (!Array.isArray(data.keywords) || data.keywords.length === 0) throw new Error("At least one keyword is required.");

  const content = parsed.content;
  const headings = validateSections(content);
  const keyword = String(data.keywords[0]).toLocaleLowerCase("en");
  const h1 = content.match(/^# (.+)$/m)?.[1] ?? "";
  const openingParagraph = content.replace(/^# .+\r?\n+/, "").trim().split(/\r?\n\s*\r?\n/)[0] ?? "";
  if (
    !String(data.title).toLocaleLowerCase("en").includes(keyword)
    || !h1.toLocaleLowerCase("en").includes(keyword)
    || !openingParagraph.toLocaleLowerCase("en").includes(keyword)
  ) {
    throw new Error("The primary keyword must appear in the title, H1, and opening paragraph.");
  }
  if (!String(data.slug).includes(keyword.replace(/\s+/g, "-"))) {
    throw new Error("The primary keyword must appear in the slug.");
  }
  if (!String(data.description).toLocaleLowerCase("en").includes(keyword)) {
    throw new Error("The primary keyword must appear in the meta description.");
  }
  if (!headings.some(([, heading]) => heading.toLocaleLowerCase("en").includes(keyword))) {
    throw new Error("The primary keyword must appear in at least one H2 heading.");
  }
  if (!/^\s*(?:[-*] |\|)/m.test(content)) throw new Error("Article must include a list or table.");
  if (!/\[[^\]]+\]\(https?:\/\/[^)]+\)/i.test(content)) {
    throw new Error("Article must cite at least one credible source using a URL.");
  }
  return parsed;
}

function validateTranslation(source, sourcePost, locale) {
  const parsed = matter(source);
  const data = parsed.data;
  data.date = normalizeDate(data.date);
  const required = ["title", "date", "description", "slug", "locale", "keywords", "author", "authorBio", "category"];
  const missing = required.filter((key) => data[key] === undefined || data[key] === "");
  if (missing.length) throw new Error(`Generated ${locale} frontmatter is missing: ${missing.join(", ")}`);
  if (data.locale !== locale) throw new Error(`Generated locale must be ${locale}.`);
  if (data.date !== normalizeDate(sourcePost.data.date)) throw new Error("Translation date must match the source article.");
  if (data.slug !== sourcePost.data.slug) throw new Error("Translation slug must match the source article.");
  if (data.author !== sourcePost.data.author) throw new Error("Translation must preserve the source author.");
  if (String(data.description).length > 155) throw new Error(`${locale} meta description exceeds 155 characters.`);
  if (!Array.isArray(data.keywords) || data.keywords.length === 0) {
    throw new Error(`The ${locale} translation must include at least one keyword.`);
  }

  const content = parsed.content;
  const headings = validateSections(content);
  const sourceHeadings = getHeadings(sourcePost.content);
  if (headings.length !== sourceHeadings.length) {
    throw new Error(`The ${locale} translation must preserve all ${sourceHeadings.length} source sections.`);
  }
  const h1 = content.match(/^# (.+)$/m)?.[1]?.trim() ?? "";
  if (h1 !== String(data.title).trim()) throw new Error(`${locale} H1 must match its translated title.`);

  const keyword = String(data.keywords[0]).toLocaleLowerCase(locale);
  const openingParagraph = content.replace(/^# .+\r?\n+/, "").trim().split(/\r?\n\s*\r?\n/)[0] ?? "";
  if (
    !String(data.title).toLocaleLowerCase(locale).includes(keyword)
    || !openingParagraph.toLocaleLowerCase(locale).includes(keyword)
    || !String(data.description).toLocaleLowerCase(locale).includes(keyword)
    || !headings.some(([, heading]) => heading.toLocaleLowerCase(locale).includes(keyword))
  ) {
    throw new Error(`The primary ${locale} keyword must appear in the title, opening paragraph, description, and an H2.`);
  }
  if (!/^\s*(?:[-*] |\|)/m.test(content)) throw new Error(`The ${locale} translation must preserve a list or table.`);

  const sourceUrls = [...sourcePost.content.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((match) => match[1]);
  const translatedUrls = [...content.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((match) => match[1]);
  if (JSON.stringify(translatedUrls) !== JSON.stringify(sourceUrls)) {
    throw new Error(`The ${locale} translation must preserve the source links in order.`);
  }

  return parsed;
}

function writePost(filename, parsed) {
  const destination = path.join(postsDirectory, filename);
  if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite existing post: ${destination}`);
  const output = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(destination, output.endsWith("\n") ? output : `${output}\n`, { flag: "wx" });
  return destination;
}

function cleanModelOutput(response) {
  return response.trim().replace(/^```(?:mdx|markdown)?\s*/i, "").replace(/\s*```$/, "");
}

async function main() {
  if (process.env.GITHUB_ACTIONS !== "true") {
    throw new Error("Blog generation is restricted to GitHub Actions; run the daily-blog workflow instead.");
  }

  const existing = readExistingPosts();
  const todaysEnglishPosts = existing.filter((post) => post.date === today && post.locale === "en");
  if (todaysEnglishPosts.length > 1) throw new Error(`More than one English post exists for ${today}.`);
  if (existing.some((post) => post.date === today && post.locale !== "en") && todaysEnglishPosts.length === 0) {
    throw new Error(`Localized posts exist for ${today}, but their English source article is missing.`);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const missingLocales = (slug) => locales.filter((locale) =>
    !existing.some((post) => post.slug === slug && post.locale === locale)
  );
  const alreadyComplete = todaysEnglishPosts[0] && missingLocales(todaysEnglishPosts[0].slug).length === 0;
  if (alreadyComplete) {
    console.log(`All ${locales.length} language editions are already present for ${today}; skipping.`);
    return;
  }
  if (!apiKey) throw new Error("GEMINI_API_KEY is required to generate missing article editions.");

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });
  let sourcePost;

  if (todaysEnglishPosts.length === 1) {
    const source = fs.readFileSync(path.join(postsDirectory, todaysEnglishPosts[0].filename), "utf8");
    sourcePost = matter(source);
    console.log(`Resuming translations for "${sourcePost.data.title}".`);
  } else {
    const topic = process.env.BLOG_TOPIC || "technology, software, and digital culture";
    const author = process.env.BLOG_AUTHOR || "Blog Editorial Team";
    const authorBio = process.env.BLOG_AUTHOR_BIO || "An editorial team sharing practical, researched explanations.";
    const avoid = existing
      .filter((post) => post.locale === "en")
      .map((post) => `- ${post.title} (slug: ${post.slug})`)
      .join("\n") || "- None";
    const prompt = `Write one original, accurate English-language blog article on this publication topic: ${topic}.

Existing published English titles and slugs (do not repeat the topic or wording):
${avoid}

Return ONLY valid MDX with YAML frontmatter. Frontmatter must include title, date (${today}), description (155 characters maximum), slug (lowercase hyphenated), locale (en), keywords (YAML list), author (${author}), authorBio (${authorBio}), and category.

Content rules:
- Include one H1. Choose a primary keyword and include it in the title, H1, opening paragraph, at least one H2, and description.
- Use at least three question-form H2 headings. The first paragraph immediately below EVERY H2 must contain 40–60 whitespace-separated words and directly answer its question without relying on context.
- Keep subsequent paragraphs concise. Add useful bullet points or a comparison table.
- Include at least one specific, verifiable fact and link to a credible primary source with a full https URL. Do not invent statistics, quotes, studies, or source links; if a number cannot be verified, use a concrete example instead.
- Be useful and original. Avoid keyword stuffing, exaggerated claims, and claims of guaranteed rankings. Do not include executable HTML or scripts.
- End with a question-form Sources H2, followed by a 40–60 word source summary and a list containing the source link.`;
    const result = await model.generateContent(prompt);
    sourcePost = validatePost(cleanModelOutput(result.response.text()));

    const title = String(sourcePost.data.title);
    let slug = String(sourcePost.data.slug);
    if (existing.some((post) => post.locale === "en" && post.title.toLocaleLowerCase() === title.toLocaleLowerCase())) {
      throw new Error(`Gemini generated an existing English title: "${title}".`);
    }
    if (existing.some((post) => post.locale === "en" && post.slug === slug)) slug = `${slug}-${today}`;
    if (existing.some((post) => post.locale === "en" && post.slug === slug)) {
      throw new Error(`Generated slug is already in use: "${slug}".`);
    }
    sourcePost.data.slug = slug;
    writePost(`${slug}.mdx`, sourcePost);
    console.log(`Created English article "${title}" (${slug}).`);
  }

  const sourceSlug = String(sourcePost.data.slug);
  const localesToGenerate = missingLocales(sourceSlug).filter((locale) => locale !== "en");
  for (const locale of localesToGenerate) {
    const prompt = `Translate the complete English MDX article below into ${localeNames[locale]} for native-speaking readers.

Return ONLY valid MDX with YAML frontmatter. Translate the title, description, keywords, authorBio, category, H1, headings, and all prose. Preserve the author's name exactly as written. Keep the date, slug, links, URLs, Markdown structure, lists, tables, code, and factual meaning unchanged. Do not add claims or sources.

Frontmatter must include title, date (${normalizeDate(sourcePost.data.date)}), description (155 characters maximum), slug (${sourceSlug}), locale (${locale}), keywords (YAML list in ${localeNames[locale]}), author (${sourcePost.data.author}), authorBio, and category.

Translation quality and validation requirements:
- Use natural, complete ${localeNames[locale]}; do not leave article prose in English.
- The translated H1 must exactly match the translated title.
- Include the first keyword naturally in the translated title, H1, opening paragraph, at least one H2, and description.
- Preserve every source H2 in the same order. Keep each H2 phrased as a question using the natural question punctuation for ${localeNames[locale]}.
- The first paragraph directly below every H2 must contain 40–60 whitespace-separated words and answer that question.
- Keep the same number of H2 sections and preserve every source URL exactly, in the same order.
- Keep useful bullet points or tables and the source links. Do not include executable HTML or scripts.

English source article:
${matter.stringify(sourcePost.content, sourcePost.data)}`;
    const result = await model.generateContent(prompt);
    const translatedPost = validateTranslation(cleanModelOutput(result.response.text()), sourcePost, locale);
    const destination = writePost(`${sourceSlug}.${locale}.mdx`, translatedPost);
    console.log(`Created ${localeNames[locale]} article ${path.relative(process.cwd(), destination)}.`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Daily blog generation failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { validatePost, validateTranslation };
