# Daily Journal

Daily Journal is a multilingual editorial publication with a Next.js website and native Android/iOS readers. Articles are Markdown/MDX files in `content/posts/`; the web app renders those files and exposes a small read-only JSON API for the mobile apps.

## Repository layout

- `apps/web` — Next.js 15 App Router, TypeScript, Tailwind CSS, next-intl, MDX, SEO routes, and consent-aware ad slots.
- `apps/android` — Kotlin, Jetpack Compose, Retrofit, Room offline cache, Hilt, and AdMob.
- `apps/ios` — SwiftUI, URLSession, offline article/content cache, native localization, and Google Mobile Ads.
- `packages/shared-types` — shared TypeScript API types.
- `content/posts` — published Markdown/MDX content.
- `scripts/generate-blog.js` — GitHub Actions-only Gemini writer and validator.
- `.github/workflows` — separate web, Android, iOS, and daily-content automation.

## Content and API

Add one `.md` or `.mdx` file per article under `content/posts/`. Required frontmatter fields are `title`, `date`, `description`, `slug`, `locale`, `keywords`, and `author`. The published English articles are original explainers and practical guides; each article should link to reliable source material for factual claims. The web application serves:

- `GET /api/posts?locale=en&page=1&pageSize=20` — article summaries.
- `GET /api/posts/{slug}?locale=en` — article metadata and Markdown body.

The current Vercel URL is `https://daily-journal-afzalimdad9.vercel.app`. It is the starter default for canonical metadata, Android article links, and the Android content API. Set the `CONTENT_API_URL` repository variable to the public API base including `/api`, and `NEXT_PUBLIC_SITE_URL` to your canonical URL if you later add a custom domain. iOS link/API defaults will be updated when Apple signing is set up. Local MDX files are committed to the repository, so the web deployment rebuilds after content is pushed.

## Internationalization

The site routes use `/en`, `/es`, `/fr`, `/de`, and `/ar`; Arabic pages set RTL direction. Android has localized string resources and supports the same locales through Android's per-app language settings. iOS localizations are under `apps/ios/DailyJournal/*.lproj`; the in-app locale picker also applies RTL for Arabic.

Articles are published in English, Spanish, French, German, and Arabic. Each translation is a separate file with the same slug and date and its own `locale` frontmatter value. The daily workflow generates the English source article and its four translations, validates their metadata, section structure, and source links, then commits all editions together. If the workflow is rerun on the same day and the English source already exists, it fills in missing translations without creating another article. Android renders Markdown in article detail views, including headings, emphasis, lists, and links.

## Advertising inventory

| Platform | Placement |
| --- | --- |
| Web | Header and footer responsive units, in-feed after every fourth article, article sidebar on desktop, and in-article unit |
| Android | Adaptive banner below the toolbar, native ad in the article feed, and a frequency-capped interstitial hook every third article opening |
| iOS | Adaptive banner below navigation, in-feed native ad, in-article banner, and an interstitial every third article opening |

Web ad slots stay in their support-message state until valid AdSense IDs are configured and the visitor accepts the consent banner. Before requesting AdSense review, ensure the publication has sufficient original content and that its policy and contact information accurately reflect its operations. After approval, create AdSense units for the placements above and configure `ADSENSE_CLIENT_ID` (the `ca-pub-...` publisher ID) plus the six `ADSENSE_SLOT_*` unit IDs as GitHub Actions variables and Vercel environment variables. The web workflow build and Vercel's own deployment build both need these values; rerun the web workflow after changing GitHub variables. Add the exact `ads.txt` record AdSense provides at the site root when prompted in the AdSense account.

The consent banner currently remembers an accept/decline preference in browser local storage; it is not a Google-certified Consent Management Platform (CMP). Advertising and analytics are not currently configured on the website. Before enabling personalized ads in regions where Google requires a CMP, implement a certified CMP and verify the site's privacy disclosures and consent behavior. Native apps currently use Google's public test app/unit IDs by default. Replace them with registered production IDs before release. Android unit IDs are supplied through repository variables; iOS test IDs are in `BannerAdView.swift`, `NativeAdSlot.swift`, and `InterstitialAdManager.swift`, and the test app ID is in `project.yml`.

## CI-only builds

**All release builds are performed by GitHub Actions. Do not run build, archive, signing, or packaging commands on a developer machine.** Local editing and the Next.js development server are optional; build artifacts must come from Actions and its configured signing secrets.

Workflows:

- `Web Build and Deploy` builds the Next app and uploads `.next` as an artifact. To deploy, configure the `VERCEL_DEPLOY_HOOK` Actions secret. It also runs after the daily content workflow succeeds (the daily workflow's `GITHUB_TOKEN` push does not itself start another workflow).
- `Android Build` runs on `main`, `android-v*` tags, or manually. It uploads a signed APK and AAB.
- `iOS Build` runs on `main`, `ios-v*` tags, or manually. It generates the Xcode project with XcodeGen and uploads a signed IPA.
- `Daily Blog Generation` runs daily at 08:00 UTC or manually. It commits one new article in English, Spanish, French, German, and Arabic when each edition passes structural checks.

### GitHub configuration

Add these **Actions secrets**:

| Secret | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini API access for daily content |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded Android release keystore |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Android release signing |
| `IOS_CERT_P12_BASE64`, `IOS_CERT_PASSWORD` | iOS signing certificate |
| `IOS_PROVISIONING_BASE64`, `IOS_PROFILE_NAME`, `KEYCHAIN_PASSWORD` | iOS provisioning and temporary CI keychain |
| `APPLE_TEAM_ID` | Apple Developer team identifier |
| `VERCEL_DEPLOY_HOOK` | Optional Vercel deploy hook URL |

Add these **Actions variables** as appropriate:

| Variable | Purpose |
| --- | --- |
| `BLOG_TOPIC`, `BLOG_AUTHOR`, `BLOG_AUTHOR_BIO`, `GEMINI_MODEL` | Daily article prompt settings; model defaults to `gemini-2.5-flash` |
| `CONTENT_API_URL` | Public `/api` URL consumed by the mobile apps |
| `NEXT_PUBLIC_SITE_URL` | Canonical website URL and structured metadata |
| `ADSENSE_CLIENT_ID` | AdSense client ID for the web app |
| `ADSENSE_SLOT_HEADER`, `ADSENSE_SLOT_FOOTER`, `ADSENSE_SLOT_ANCHOR`, `ADSENSE_SLOT_SIDEBAR`, `ADSENSE_SLOT_IN_ARTICLE`, `ADSENSE_SLOT_IN_FEED` | AdSense unit IDs by web placement |
| `ADMOB_ANDROID_APP_ID`, `ADMOB_ANDROID_BANNER_UNIT_ID`, `ADMOB_ANDROID_NATIVE_UNIT_ID`, `ADMOB_ANDROID_INTERSTITIAL_UNIT_ID` | Android AdMob identifiers |
| `ADMOB_IOS_APP_ID`, `ADMOB_IOS_BANNER_UNIT_ID`, `ADMOB_IOS_NATIVE_UNIT_ID`, `ADMOB_IOS_INTERSTITIAL_UNIT_ID` | iOS AdMob identifiers |

Set `NEXT_PUBLIC_SITE_URL` and the AdSense variables as build-time variables for the web workflow and in the Vercel project when deploying through its deploy hook. When using another host, replace the deploy step in `web-deploy.yml`. Android uses the current Vercel host in its intent filter; verified Android App Links additionally require a matching `assetlinks.json` with the release signing certificate fingerprint. iOS universal links are deferred until Apple Developer signing setup; replace the placeholder host in its entitlement and publish the Apple App Site Association file before enabling them. The iOS workflow expects an App Store distribution profile and certificate matching bundle ID `com.dailyjournal.app`; update `project.yml` and the Fastlane lane together if the bundle ID changes. Add secrets only in the repository's Actions settings, never to source files.

The daily generator rejects missing metadata, duplicate English topics/slugs, invalid descriptions, non-question H2s, answer paragraphs outside its 40–60 word range, and missing or changed source links/list structures. These checks improve consistency but cannot guarantee factual accuracy, translation quality, rankings, or “100%” SEO/AIO/GEO optimization; review Gemini output and citations. The script intentionally refuses to run outside GitHub Actions.

### Manual content run

In GitHub, open **Actions → Daily Blog Generation → Run workflow**. A successful run commits one article in all five locales and triggers the web workflow. Scheduled runs use UTC; edit the cron expression in `.github/workflows/daily-blog.yml` to change the time.

## Local development (not a release build)

For web-only development, install the root npm workspace dependencies and start `npm run dev:web`. This runs the Next development server; do not use local commands to build or package release artifacts. Android and iOS release artifacts are available only from their successful GitHub Actions runs.
