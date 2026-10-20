package com.dailyjournal.data

import android.content.Context
import androidx.room.Room
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import retrofit2.Retrofit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BlogRepository @Inject constructor(
    private val api: BlogApi,
    private val cache: PostDao,
    private val articleCache: ArticleDao
) {
    suspend fun posts(locale: String): List<PostSummary> {
        return try {
            val remote = api.posts(locale).posts
            cache.replace(remote.map { post ->
                CachedPost(post.slug, post.title, post.description, post.date, post.locale, post.keywords.joinToString("|"), post.author, post.category)
            })
            remote
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            val cached = cache.byLocale(locale)
            if (cached.isEmpty()) throw error
            cached.map { post ->
                PostSummary(post.title, post.slug, post.description, post.date, post.locale, post.keywords.split("|").filter(String::isNotEmpty), post.author, post.category)
            }
        }
    }

    suspend fun article(slug: String, locale: String): ArticleResponse {
        val key = "$locale:$slug"
        return try {
            api.article(slug, locale).also { articleCache.replace(CachedArticle(key, it.content)) }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            val content = articleCache.content(key) ?: throw error
            ArticleResponse(slug = slug, locale = locale, content = content, title = slug, description = "", date = "", author = "", keywords = emptyList())
        }
    }
}

@Module
@InstallIn(SingletonComponent::class)
object BlogModule {
    @Provides
    @Singleton
    fun provideApi(): BlogApi {
        val json = Json { ignoreUnknownKeys = true }
        return Retrofit.Builder()
            .baseUrl(com.dailyjournal.BuildConfig.CONTENT_API_URL)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(BlogApi::class.java)
    }

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): BlogDatabase =
        Room.databaseBuilder(context, BlogDatabase::class.java, "daily-journal.db").build()

    @Provides
    fun providePostDao(database: BlogDatabase): PostDao = database.postDao()

    @Provides
    fun provideArticleDao(database: BlogDatabase): ArticleDao = database.articleDao()

}
