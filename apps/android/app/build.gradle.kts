plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.google.devtools.ksp")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.dailyjournal"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.dailyjournal"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        buildConfigField("String", "CONTENT_API_URL", "\"${(providers.gradleProperty("contentApiUrl").orNull ?: "https://example.com/api").trimEnd('/')}/\"")
        buildConfigField("String", "AD_BANNER_UNIT_ID", "\"${providers.gradleProperty("adBannerUnitId").orNull ?: "ca-app-pub-3940256099942544/6300978111"}\"")
        buildConfigField("String", "AD_NATIVE_UNIT_ID", "\"${providers.gradleProperty("adNativeUnitId").orNull ?: "ca-app-pub-3940256099942544/2247696110"}\"")
        buildConfigField("String", "AD_INTERSTITIAL_UNIT_ID", "\"${providers.gradleProperty("adInterstitialUnitId").orNull ?: "ca-app-pub-3940256099942544/1033173712"}\"")
        manifestPlaceholders["adMobAppId"] = providers.gradleProperty("adMobAppId").orNull ?: "ca-app-pub-3940256099942544~3347511713"
    }

    signingConfigs {
        create("release") {
            storeFile = System.getenv("ANDROID_KEYSTORE_PATH")?.let { project.file(it) }
            storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias = System.getenv("ANDROID_KEY_ALIAS")
            keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
        }
    }

    buildFeatures { compose = true; buildConfig = true }
    packaging { resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" } }
    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    implementation("com.google.dagger:hilt-android:2.52")
    ksp("com.google.dagger:hilt-compiler:2.52")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.jakewharton.retrofit:retrofit2-kotlinx-serialization-converter:1.0.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("io.coil-kt:coil-compose:2.7.0")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
    implementation("com.google.android.gms:play-services-ads:23.6.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
