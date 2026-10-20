package com.dailyjournal.data

import kotlinx.serialization.Serializable
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

@Serializable
data class PostSummary(
    val title: String,
    val slug: String,
    val description: String,
    val date: String,
    val locale: String,
    val keywords: List<String> = emptyList(),
    val author: String,
    val category: String? = null
)

@Serializable
data class PostsResponse(
    val posts: List<PostSummary>,
    val page: Int,
    val pageSize: Int,
    val total: Int
)

@Serializable
data class ArticleResponse(
    val title: String,
    val slug: String,
    val description: String,
    val date: String,
    val locale: String,
    val keywords: List<String> = emptyList(),
    val author: String,
    val content: String,
    val category: String? = null
)

interface BlogApi {
    @GET("posts")
    suspend fun posts(@Query("locale") locale: String): PostsResponse

    @GET("posts/{slug}")
    suspend fun article(@Path("slug") slug: String, @Query("locale") locale: String): ArticleResponse
}
