package com.dailyjournal.data

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.RoomDatabase

@Entity(tableName = "posts", primaryKeys = ["locale", "slug"])
data class CachedPost(
    val slug: String,
    val title: String,
    val description: String,
    val date: String,
    val locale: String,
    val keywords: String,
    val author: String,
    val category: String?
)

@Entity(tableName = "articles", primaryKeys = ["cacheKey"])
data class CachedArticle(
    @PrimaryKey val cacheKey: String,
    val content: String
)

@Dao
interface PostDao {
    @Query("SELECT * FROM posts WHERE locale = :locale ORDER BY date DESC")
    suspend fun byLocale(locale: String): List<CachedPost>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun replace(posts: List<CachedPost>)
}

@Dao
interface ArticleDao {
    @Query("SELECT content FROM articles WHERE cacheKey = :cacheKey")
    suspend fun content(cacheKey: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun replace(article: CachedArticle)
}

@Database(entities = [CachedPost::class, CachedArticle::class], version = 1, exportSchema = false)
abstract class BlogDatabase : RoomDatabase() {
    abstract fun postDao(): PostDao
    abstract fun articleDao(): ArticleDao
}
