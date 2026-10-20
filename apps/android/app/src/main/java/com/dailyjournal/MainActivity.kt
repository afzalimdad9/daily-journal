package com.dailyjournal

import android.os.Bundle
import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.os.LocaleListCompat
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
import javax.inject.Inject
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.text.ParseException
import java.util.Locale

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject lateinit var repository: BlogRepository
    private val deepLinkSlug = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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
@OptIn(ExperimentalMaterial3Api::class)
private fun DailyJournalScreen(repository: BlogRepository, initialSlug: String?) {
    val context = LocalContext.current
    var posts by remember { mutableStateOf<List<PostSummary>>(emptyList()) }
    var selected by remember { mutableStateOf<PostSummary?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var articleBody by remember { mutableStateOf<String?>(null) }
    var articleError by remember { mutableStateOf<String?>(null) }
    var query by remember { mutableStateOf("") }
    var locale by remember { mutableStateOf("en") }
    var category by remember { mutableStateOf<String?>(null) }
    var opens by remember { mutableIntStateOf(0) }
    var interstitial by remember { mutableStateOf<InterstitialAd?>(null) }

    LaunchedEffect(locale) {
        try {
            posts = withContext(Dispatchers.IO) { repository.posts(locale) }
            error = null
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            error = "Unable to load articles. Check your connection and content API URL."
        }
    }
    LaunchedEffect(posts, initialSlug) {
        if (selected == null && initialSlug != null) selected = posts.firstOrNull { it.slug == initialSlug }
    }
    LaunchedEffect(selected?.slug, locale) {
        val post = selected ?: return@LaunchedEffect
        articleBody = null
        articleError = null
        try {
            articleBody = withContext(Dispatchers.IO) { repository.article(post.slug, locale).content }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            articleError = "Unable to load article content."
        }
    }
    LaunchedEffect(Unit) { requestInterstitial(context) { interstitial = it } }

    MaterialTheme {
        Scaffold(
            topBar = {
                Column {
                    TopAppBar(title = { Text(stringResource(R.string.app_name)) })
                    AdBanner()
                }
            },
            bottomBar = {
                Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                    listOf("en", "es", "fr", "de", "ar").forEach { language ->
                        TextButton(onClick = {
                            locale = language
                            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(language))
                        }) { Text(language.uppercase()) }
                    }
                }
            }
        ) { padding ->
            Column(Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp)) {
                OutlinedTextField(query, { query = it }, label = { Text(stringResource(R.string.search)) }, modifier = Modifier.fillMaxWidth())
                selected?.let { post ->
                    TextButton(onClick = { selected = null }) { Text("← ${stringResource(R.string.home)}") }
                    Text(post.title, style = MaterialTheme.typography.headlineSmall)
                    Text(formatDate(post.date, locale), style = MaterialTheme.typography.labelMedium)
                    Text(post.description, modifier = Modifier.padding(top = 12.dp))
                    articleError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    articleBody?.let { body ->
                        var paragraphCount = 0
                        body.split(Regex("\\n\\s*\\n")).forEach { block ->
                            val text = block.trim()
                            if (text.isNotEmpty()) {
                                Text(text, modifier = Modifier.padding(top = 12.dp))
                                if (!text.startsWith("#") && !text.startsWith("- ") && !text.startsWith("|")) {
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
                            FilterChip(selected = category == null, onClick = { category = null }, label = { Text(stringResource(R.string.categories)) })
                        }
                        items(categories.size) { index ->
                            val value = categories[index]
                            FilterChip(selected = category == value, onClick = { category = value }, label = { Text(value) })
                        }
                    }
                    error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        itemsIndexed(posts.filter {
                            (it.title.contains(query, true) || it.keywords.any { word -> word.contains(query, true) })
                                && (category == null || it.category == category)
                        }, key = { _, post -> post.slug }) { index, post ->
                            if (index > 0 && index % 4 == 0) NativeAdCard()
                            ElevatedCard(Modifier.fillMaxWidth().clickable {
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
                            }) {
                                Column(Modifier.padding(16.dp)) {
                                    Text(post.title, style = MaterialTheme.typography.titleMedium)
                                    Text(post.description, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 6.dp))
                                    Text("${post.category ?: stringResource(R.string.categories)} · ${formatDate(post.date, locale)}", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 8.dp))
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
