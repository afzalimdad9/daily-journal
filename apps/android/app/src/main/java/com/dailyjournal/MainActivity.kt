package com.dailyjournal

import android.os.Bundle
import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.text.method.LinkMovementMethod
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.os.LocaleListCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.dailyjournal.data.BlogRepository
import com.dailyjournal.data.PostSummary
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import dagger.hilt.android.AndroidEntryPoint
import io.noties.markwon.Markwon
import javax.inject.Inject
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.lazy.items
import androidx.compose.ui.geometry.Offset
import java.text.SimpleDateFormat
import java.text.ParseException
import java.util.Locale

private val EditorialBackground = Color(0xFFF6F3EB)
private val EditorialForeground = Color(0xFF20251F)
private val EditorialMuted = Color(0xFF72766D)
private val EditorialSurface = Color(0xFFFFFDF8)
private val EditorialSurfaceSoft = Color(0xFFEEECE2)
private val EditorialLine = Color(0xFFDEDBD0)
private val EditorialAccent = Color(0xFFBD4A2C)
private val EditorialGreen = Color(0xFF29362E)

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject lateinit var repository: BlogRepository
    private val deepLinkSlug = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(246, 243, 235)
        window.navigationBarColor = android.graphics.Color.rgb(238, 236, 226)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = true
            isAppearanceLightNavigationBars = true
        }
        deepLinkSlug.value = intent?.data?.pathSegments?.let { segments ->
            val postIndex = segments.indexOf("posts")
            if (postIndex >= 0) segments.getOrNull(postIndex + 1) else null
        }
        setContent { DailyJournalScreen(repository, deepLinkSlug.value) }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        deepLinkSlug.value = intent.data?.pathSegments?.let { segments ->
            val postIndex = segments.indexOf("posts")
            if (postIndex >= 0) segments.getOrNull(postIndex + 1) else null
        }
    }
}

@Composable
private fun rememberSkeletonBrush(): Brush {
    val transition = rememberInfiniteTransition(label = "skeleton-shimmer")
    val shimmerOffset by transition.animateFloat(
        initialValue = -400f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(tween(1400), repeatMode = RepeatMode.Restart),
        label = "skeleton-offset"
    )
    val base = MaterialTheme.colorScheme.surfaceVariant
    return Brush.linearGradient(
        colors = listOf(base, MaterialTheme.colorScheme.surface.copy(alpha = 0.88f), base),
        start = Offset(shimmerOffset, 0f),
        end = Offset(shimmerOffset + 400f, 400f)
    )
}

@Composable
private fun SkeletonBlock(modifier: Modifier, brush: Brush, radius: Int = 5) {
    Box(modifier.clip(RoundedCornerShape(radius.dp)).background(brush))
}

@Composable
private fun CategoryChipSkeleton() {
    SkeletonBlock(Modifier.width(84.dp).height(32.dp), rememberSkeletonBrush(), 999)
}

@Composable
private fun ArticleCardSkeleton() {
    val brush = rememberSkeletonBrush()
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(5.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 0.dp)
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            SkeletonBlock(Modifier.width(108.dp).height(14.dp), brush, 999)
            SkeletonBlock(Modifier.fillMaxWidth(0.78f).height(22.dp), brush)
            SkeletonBlock(Modifier.fillMaxWidth().height(14.dp), brush)
            SkeletonBlock(Modifier.fillMaxWidth(0.65f).height(14.dp), brush)
            SkeletonBlock(Modifier.width(142.dp).height(12.dp), brush)
        }
    }
}

@Composable
private fun ArticleBodySkeleton() {
    val brush = rememberSkeletonBrush()
    Column(Modifier.fillMaxWidth().padding(top = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SkeletonBlock(Modifier.fillMaxWidth(0.56f).height(30.dp), brush)
        SkeletonBlock(Modifier.fillMaxWidth().height(16.dp), brush)
        SkeletonBlock(Modifier.fillMaxWidth().height(16.dp), brush)
        SkeletonBlock(Modifier.fillMaxWidth(0.82f).height(16.dp), brush)
        Spacer(Modifier.height(8.dp))
        SkeletonBlock(Modifier.fillMaxWidth(0.48f).height(26.dp), brush)
        repeat(4) { index ->
            SkeletonBlock(Modifier.fillMaxWidth(if (index == 3) 0.72f else 1f).height(16.dp), brush)
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun DailyJournalScreen(repository: BlogRepository, initialSlug: String?) {
    val context = LocalContext.current
    var posts by remember { mutableStateOf<List<PostSummary>>(emptyList()) }
    var postsLoading by remember { mutableStateOf(true) }
    var selected by remember { mutableStateOf<PostSummary?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var articleBody by remember { mutableStateOf<String?>(null) }
    var articleLoading by remember { mutableStateOf(false) }
    var articleError by remember { mutableStateOf<String?>(null) }
    var query by remember { mutableStateOf("") }
    var locale by remember { mutableStateOf("en") }
    var category by remember { mutableStateOf<String?>(null) }
    var opens by remember { mutableIntStateOf(0) }
    var interstitial by remember { mutableStateOf<InterstitialAd?>(null) }

    LaunchedEffect(locale) {
        postsLoading = true
        try {
            posts = withContext(Dispatchers.IO) { repository.posts(locale) }
            error = null
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            error = "Unable to load articles. Check your connection and content API URL."
        } finally {
            postsLoading = false
        }
    }
    LaunchedEffect(posts, initialSlug) {
        if (selected == null && initialSlug != null) selected = posts.firstOrNull { it.slug == initialSlug }
    }
    LaunchedEffect(selected?.slug, locale) {
        val post = selected ?: return@LaunchedEffect
        articleBody = null
        articleLoading = true
        articleError = null
        try {
            articleBody = withContext(Dispatchers.IO) { repository.article(post.slug, locale).content }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            articleError = "Unable to load article content."
        } finally {
            articleLoading = false
        }
    }
    LaunchedEffect(Unit) { requestInterstitial(context) { interstitial = it } }

    val colors = lightColorScheme(
        primary = EditorialAccent,
        onPrimary = EditorialSurface,
        secondary = EditorialGreen,
        onSecondary = EditorialSurface,
        background = EditorialBackground,
        onBackground = EditorialForeground,
        surface = EditorialSurface,
        onSurface = EditorialForeground,
        surfaceVariant = EditorialSurfaceSoft,
        onSurfaceVariant = EditorialMuted,
        outline = EditorialLine,
        error = Color(0xFFB3261E)
    )
    val typography = Typography(
        displayLarge = MaterialTheme.typography.displayLarge.copy(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal),
        displayMedium = MaterialTheme.typography.displayMedium.copy(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal),
        displaySmall = MaterialTheme.typography.displaySmall.copy(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal),
        headlineLarge = MaterialTheme.typography.headlineLarge.copy(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal),
        headlineMedium = MaterialTheme.typography.headlineMedium.copy(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal),
        headlineSmall = MaterialTheme.typography.headlineSmall.copy(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal),
        titleLarge = MaterialTheme.typography.titleLarge.copy(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Medium),
        titleMedium = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
    )

    MaterialTheme(colorScheme = colors, typography = typography) {
        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                Column {
                    TopAppBar(
                        title = {
                            Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Box(
                                    Modifier.size(34.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary),
                                    contentAlignment = androidx.compose.ui.Alignment.Center
                                ) {
                                    Text("dj", color = MaterialTheme.colorScheme.onPrimary, fontWeight = FontWeight.Bold, fontStyle = FontStyle.Italic)
                                }
                                Text(stringResource(R.string.app_name), fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold)
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
                    )
                    AdBanner()
                }
            },
            bottomBar = {
                Row(
                    Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant).padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    listOf("en", "es", "fr", "de", "ar").forEach { language ->
                        if (locale == language) {
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = MaterialTheme.colorScheme.primary,
                                contentColor = MaterialTheme.colorScheme.onPrimary
                            ) {
                                Text(language.uppercase(), modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp), style = MaterialTheme.typography.labelLarge)
                            }
                        } else {
                            TextButton(onClick = {
                                locale = language
                                AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(language))
                            }) { Text(language.uppercase(), color = MaterialTheme.colorScheme.onSurfaceVariant) }
                        }
                    }
                }
            }
        ) { padding ->
            Column(
                Modifier.fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp)
                    .then(if (selected != null) Modifier.verticalScroll(rememberScrollState()) else Modifier)
            ) {
                OutlinedTextField(
                    query,
                    { query = it },
                    label = { Text(stringResource(R.string.search)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(4.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        cursorColor = MaterialTheme.colorScheme.primary,
                        focusedLabelColor = MaterialTheme.colorScheme.primary
                    )
                )
                selected?.let { post ->
                    TextButton(onClick = { selected = null }) {
                        Text("← ${stringResource(R.string.home)}", color = MaterialTheme.colorScheme.primary)
                    }
                    Text(post.title, style = MaterialTheme.typography.headlineSmall)
                    Text(formatDate(post.date, locale), style = MaterialTheme.typography.labelMedium)
                    Text(post.description, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 12.dp))
                    articleError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    if (articleLoading) ArticleBodySkeleton()
                    articleBody?.let { body ->
                        val markwon = remember(context) { Markwon.create(context) }
                        val articleColor = MaterialTheme.colorScheme.onSurface.toArgb()
                        var paragraphCount = 0
                        val markdown = body.trimStart().replaceFirst(Regex("^#\\s+[^\\r\\n]+\\r?\\n+"), "")
                        markdown.split(Regex("\\n\\s*\\n")).forEach { block ->
                            val text = block.trim()
                            if (text.isNotEmpty()) {
                                AndroidView(
                                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                                    factory = { viewContext ->
                                        TextView(viewContext).apply {
                                            textSize = 16f
                                            setTextColor(articleColor)
                                            setLinkTextColor(EditorialAccent.toArgb())
                                            setLineSpacing(0f, 1.35f)
                                            movementMethod = LinkMovementMethod.getInstance()
                                            setTextIsSelectable(true)
                                        }
                                    },
                                    update = { textView -> markwon.setMarkdown(textView, text) }
                                )
                                if (!text.matches(Regex("(?s)^(#{1,6}\\s|[-*+]\\s|\\d+[.)]\\s|>|\\||---+$).*"))) {
                                    paragraphCount += 1
                                    if (paragraphCount == 2) AdBanner()
                                }
                            }
                        }
                    }
                } ?: run {
                    Text(stringResource(R.string.articles), style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(vertical = 12.dp))
                    val categories = posts.mapNotNull { it.category }.distinct().sorted()
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item {
                            FilterChip(
                                selected = category == null,
                                onClick = { category = null },
                                label = { Text(stringResource(R.string.categories)) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                                )
                            )
                        }
                        if (postsLoading) {
                            items(3) { CategoryChipSkeleton() }
                        } else {
                            items(categories.size) { index ->
                                val value = categories[index]
                                FilterChip(
                                    selected = category == value,
                                    onClick = { category = value },
                                    label = { Text(value) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = MaterialTheme.colorScheme.primary,
                                        selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                                    )
                                )
                            }
                        }
                    }
                    error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    if (postsLoading) {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(4) { ArticleCardSkeleton() }
                        }
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            itemsIndexed(posts.filter {
                                (it.title.contains(query, true) || it.keywords.any { word -> word.contains(query, true) })
                                    && (category == null || it.category == category)
                            }, key = { _, post -> post.slug }) { index, post ->
                                if (index > 0 && index % 4 == 0) NativeAdCard()
                                ElevatedCard(
                                    modifier = Modifier.fillMaxWidth().clickable {
                                        selected = post
                                        opens += 1
                                        val ad = interstitial
                                        val activity = context.findActivity()
                                        if (opens % 3 == 0 && activity != null && ad != null) {
                                            interstitial = null
                                            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                                                override fun onAdDismissedFullScreenContent() {
                                                    requestInterstitial(context) { interstitial = it }
                                                }

                                                override fun onAdFailedToShowFullScreenContent(error: com.google.android.gms.ads.AdError) {
                                                    requestInterstitial(context) { interstitial = it }
                                                }
                                            }
                                            ad.show(activity)
                                        }
                                    },
                                    shape = RoundedCornerShape(5.dp),
                                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 0.dp)
                                ) {
                                    Column(Modifier.padding(16.dp)) {
                                        Text(post.title, style = MaterialTheme.typography.titleMedium)
                                        Text(post.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 6.dp))
                                        Text("${post.category ?: stringResource(R.string.categories)} · ${formatDate(post.date, locale)}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(top = 8.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun Context.findActivity(): Activity? {
    var current: Context = this
    while (current is ContextWrapper) {
        if (current is Activity) return current
        current = current.baseContext
    }
    return current as? Activity
}

private fun formatDate(value: String, language: String): String {
    return try {
        val source = SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).apply { isLenient = false }
        val date = source.parse(value) ?: return value
        SimpleDateFormat("d MMM yyyy", Locale.forLanguageTag(language)).format(date)
    } catch (_: ParseException) {
        value
    } catch (_: IllegalArgumentException) {
        value
    }
}

private fun requestInterstitial(context: android.content.Context, onLoaded: (InterstitialAd?) -> Unit) {
    InterstitialAd.load(
        context,
        BuildConfig.AD_INTERSTITIAL_UNIT_ID,
        AdRequest.Builder().build(),
        object : InterstitialAdLoadCallback() {
            override fun onAdLoaded(ad: InterstitialAd) = onLoaded(ad)
            override fun onAdFailedToLoad(error: LoadAdError) = onLoaded(null)
        }
    )
}

@Composable
private fun AdBanner() {
    Column(Modifier.fillMaxWidth(), horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
        Text(stringResource(R.string.ad_label), style = MaterialTheme.typography.labelSmall)
        AndroidView(
            modifier = Modifier.fillMaxWidth().height(50.dp),
            factory = { context ->
                AdView(context).apply {
                    setAdSize(AdSize.BANNER)
                    adUnitId = BuildConfig.AD_BANNER_UNIT_ID
                    loadAd(AdRequest.Builder().build())
                }
            }
        )
    }
}

@Composable
private fun NativeAdCard() {
    val context = LocalContext.current
    AndroidView(
        modifier = Modifier.fillMaxWidth(),
        factory = { viewContext ->
            val adView = com.google.android.gms.ads.nativead.NativeAdView(viewContext)
            val headline = android.widget.TextView(viewContext).apply {
                textSize = 16f
                setPadding(24, 20, 24, 20)
            }
            adView.headlineView = headline
            adView.addView(headline)
            com.google.android.gms.ads.AdLoader.Builder(context, BuildConfig.AD_NATIVE_UNIT_ID)
                .forNativeAd { ad ->
                    headline.text = "Ad · ${ad.advertiser?.let { "$it · " } ?: ""}${ad.headline}"
                    adView.setNativeAd(ad)
                    adView.tag = ad
                }
                .build()
                .loadAd(AdRequest.Builder().build())
            adView
        },
        onRelease = { view ->
            (view.tag as? com.google.android.gms.ads.nativead.NativeAd)?.destroy()
        }
    )
}
