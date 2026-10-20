const test = require("node:test");
const assert = require("node:assert/strict");
const matter = require("gray-matter");
const { validatePost, validateTranslation } = require("./generate-blog");

const date = new Date().toISOString().slice(0, 10);
const englishMetadata = {
  title: "Passkeys explained clearly",
  date,
  description: "Passkeys make secure sign-in easier to understand.",
  slug: "passkeys-explained-clearly",
  locale: "en",
  keywords: ["passkeys"],
  author: "Daily Journal Editorial",
  authorBio: "An editorial team.",
  category: "Technology"
};
const translatedMetadata = {
  title: "Claves de acceso explicadas",
  date,
  description: "Las claves de acceso facilitan el inicio de sesión seguro.",
  slug: englishMetadata.slug,
  locale: "es",
  keywords: ["claves de acceso"],
  author: englishMetadata.author,
  authorBio: "Un equipo editorial.",
  category: "Tecnología"
};

function answerParagraph() {
  return Array.from({ length: 45 }, (_, index) => `detail${index}`).join(" ");
}

function englishArticle() {
  const answer = answerParagraph();
  return matter.stringify(
    `# Passkeys explained clearly

Passkeys offer a secure sign-in option that readers can understand and evaluate before changing account settings.

## How do passkeys protect sign-in?

${answer}

## Where do passkeys stay?

${answer}

## What sources explain passkeys?

${answer}

Read the [FIDO passkeys guide](https://fidoalliance.org/passkeys/).

- Review account recovery first.`,
    englishMetadata
  );
}

function spanishArticle(overrides = {}) {
  const answer = answerParagraph();
  const metadata = { ...translatedMetadata, ...overrides };
  return matter.stringify(
    `# Claves de acceso explicadas

Las claves de acceso ofrecen una opción segura de inicio de sesión que conviene entender antes de cambiar la configuración de una cuenta.

## ¿Cómo protegen las claves de acceso el inicio de sesión?

${answer}

## ¿Dónde se guardan?

${answer}

## ¿Qué fuentes explican este método?

${answer}

Lee la [guía de FIDO sobre claves de acceso](https://fidoalliance.org/passkeys/).

- Revisa primero la recuperación de la cuenta.`,
    metadata
  );
}

test("accepts a structurally valid English source article", () => {
  assert.equal(validatePost(englishArticle()).data.locale, "en");
});

test("accepts a complete translation that preserves the source URLs", () => {
  const source = matter(englishArticle());
  const translation = validateTranslation(spanishArticle(), source, "es");
  assert.equal(translation.data.locale, "es");
});

test("rejects a translation with a changed slug", () => {
  const source = matter(englishArticle());
  assert.throws(
    () => validateTranslation(spanishArticle({ slug: "otro-articulo" }), source, "es"),
    /slug must match/
  );
});

test("rejects a translation that changes a source URL", () => {
  const source = matter(englishArticle());
  const translation = spanishArticle().replace(
    "https://fidoalliance.org/passkeys/",
    "https://example.com/"
  );
  assert.throws(
    () => validateTranslation(translation, source, "es"),
    /preserve the source links/
  );
});
