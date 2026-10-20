import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: BlogStore
    @StateObject private var interstitial = InterstitialAdManager()
    @State private var searchText = ""
    @State private var selection: BlogPost?
    @State private var articleOpens = 0
    @State private var category: String?

    private var filteredPosts: [BlogPost] {
        return store.posts.filter { post in
            (searchText.isEmpty || post.title.localizedCaseInsensitiveContains(searchText)
                || post.keywords.contains { $0.localizedCaseInsensitiveContains(searchText) })
                && (category == nil || post.category == category)
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if let selection {
                    ArticleView(post: selection)
                } else {
                    home
                }
            }
            .navigationTitle("Daily Journal")
            .onOpenURL { url in
                let parts = url.pathComponents
                guard let postIndex = parts.firstIndex(of: "posts"), parts.indices.contains(postIndex + 1) else { return }
                let slug = parts[postIndex + 1]
                if let locale = parts.first(where: { ["en", "es", "fr", "de", "ar"].contains($0) }) {
                    store.locale = locale
                }
                Task {
                    await store.refresh()
                    selection = store.posts.first { $0.slug == slug }
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if selection != nil {
                        Button { selection = nil } label: { Image(systemName: "chevron.backward") }
                            .accessibilityLabel("home")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        ForEach(["en", "es", "fr", "de", "ar"], id: \.self) { language in
                            Button(language.uppercased()) { store.locale = language; Task { await store.refresh() } }
                        }
                    } label: { Image(systemName: "globe") }
                }
            }
            .environment(\.locale, Locale(identifier: store.locale))
            .environment(\.layoutDirection, store.locale == "ar" ? .rightToLeft : .leftToRight)
        }
        .task { interstitial.load() }
    }

    private var home: some View {
        VStack(spacing: 0) {
            BannerAdView()
                .frame(height: 60)
                .accessibilityLabel("Advertisement")
            TextField("search", text: $searchText)
                .textFieldStyle(.roundedBorder)
                .padding()
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    categoryButton(nil, title: String(localized: "categories"))
                    ForEach(Array(Set(store.posts.compactMap(\.category))).sorted(), id: \.self) { value in
                        categoryButton(value, title: value)
                    }
                }
                .padding(.horizontal)
            }
            if let error = store.errorMessage {
                Text(error).foregroundStyle(.secondary).padding(.horizontal)
            }
            List {
                Section("articles") {
                    ForEach(Array(filteredPosts.enumerated()), id: \.element.id) { index, post in
                        if index > 0 && index.isMultiple(of: 4) {
                            NativeAdSlot()
                                .frame(height: 120)
                                .listRowSeparator(.hidden)
                                .accessibilityLabel("Advertisement")
                        }
                        Button {
                            selection = post
                            articleOpens += 1
                            if articleOpens.isMultiple(of: 3) { interstitial.show() }
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(post.title).font(.headline).foregroundStyle(.primary)
                                Text(post.description).font(.subheadline).foregroundStyle(.secondary)
                                Text("\(post.category ?? "Journal") · \(formatDate(post.date, locale: store.locale))").font(.caption).foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 6)
                        }
                    }
                }
            }
            .refreshable { await store.refresh() }
        }
    }

    private func categoryButton(_ value: String?, title: String) -> some View {
        Button(title) { category = value }
            .buttonStyle(.bordered)
            .tint(category == value ? .indigo : .secondary)
    }
}

private struct ArticleView: View {
    @EnvironmentObject private var store: BlogStore
    let post: BlogPost
    @State private var content = ""
    @State private var loadError: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(formatDate(post.date, locale: store.locale)).font(.caption).foregroundStyle(.secondary)
                Text(post.title).font(.largeTitle.bold())
                Text(post.description).font(.title3).foregroundStyle(.secondary)
                if !content.isEmpty {
                    let blocks = makeArticleBlocks(content)
                    ForEach(blocks.indices, id: \.self) { index in
                        let block = blocks[index]
                        if let markdown = try? AttributedString(markdown: block.text), !block.text.isEmpty {
                            Text(markdown).font(.body)
                        }
                        if block.insertAdAfter {
                            BannerAdView().frame(height: 60).accessibilityLabel("advertisement")
                        }
                    }

                } else if let loadError {
                    Text(loadError).foregroundStyle(.secondary)
                } else {
                    ProgressView()
                }
                if let url = URL(string: "https://your-domain.example/\(post.locale)/posts/\(post.slug)") {
                    Link("Open article", destination: url)
                }
            }
            .padding()
        }
        .task(id: post.slug) {
            do {
                content = try await store.articleContent(for: post)
                loadError = nil
            } catch {
                loadError = "Unable to load the article. Please check your connection."
            }
        }
    }

}

private func formatDate(_ value: String, locale: String) -> String {
    let parser = DateFormatter()
    parser.locale = Locale(identifier: "en_US_POSIX")
    parser.dateFormat = "yyyy-MM-dd"
    guard let date = parser.date(from: value) else { return value }
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: locale)
    formatter.dateStyle = .medium
    formatter.timeStyle = .none
    return formatter.string(from: date)
}

private struct ArticleBlock {
    let text: String
    let insertAdAfter: Bool
}

private func makeArticleBlocks(_ content: String) -> [ArticleBlock] {
    var paragraphCount = 0
    return content.components(separatedBy: "\n\n").map { text in
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        let isParagraph = !trimmed.isEmpty
            && !trimmed.hasPrefix("#")
            && !trimmed.hasPrefix("- ")
            && !trimmed.hasPrefix("* ")
            && !trimmed.hasPrefix("|")
            && !trimmed.hasPrefix(">")
        if isParagraph { paragraphCount += 1 }
        return ArticleBlock(text: text, insertAdAfter: isParagraph && paragraphCount == 2)
    }
}
