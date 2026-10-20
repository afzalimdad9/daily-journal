import Combine
import Foundation

struct BlogPost: Codable, Identifiable, Hashable {
    let title: String
    let slug: String
    let description: String
    let date: String
    let locale: String
    let keywords: [String]
    let author: String
    let category: String?

    var id: String { slug }
}

private struct PostsResponse: Decodable {
    let posts: [BlogPost]
}

private struct ArticleResponse: Decodable {
    let content: String
}

@MainActor
final class BlogStore: ObservableObject {
    @Published private(set) var posts: [BlogPost] = []
    @Published private(set) var errorMessage: String?
    @Published var locale = "en"

    private let cacheKey = "cached-blog-posts"

    init() {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let cached = try? JSONDecoder().decode([BlogPost].self, from: data) {
            posts = cached
        }
        Task { await refresh() }
    }

    func refresh() async {
        guard let url = apiURL(path: "posts", query: [URLQueryItem(name: "locale", value: locale)]) else {
            errorMessage = "Set CONTENT_API_URL in the iOS build configuration."
            return
        }
        do {
            var request = URLRequest(url: url)
            request.timeoutInterval = 20
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                throw URLError(.badServerResponse)
            }
            let result = try JSONDecoder().decode(PostsResponse.self, from: data)
            posts = result.posts
            errorMessage = nil
            UserDefaults.standard.set(try JSONEncoder().encode(result.posts), forKey: cacheKey)
        } catch {
            errorMessage = posts.isEmpty ? "Unable to load articles. Check your connection and content API URL." : nil
        }
    }

    func articleContent(for post: BlogPost) async throws -> String {
        let cacheKey = "cached-article-\(post.locale)-\(post.slug)"
        do {
            guard let url = apiURL(path: "posts/\(post.slug)", query: [URLQueryItem(name: "locale", value: post.locale)]) else {
                throw URLError(.badURL)
            }
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                throw URLError(.badServerResponse)
            }
            let content = try JSONDecoder().decode(ArticleResponse.self, from: data).content
            UserDefaults.standard.set(content, forKey: cacheKey)
            return content
        } catch {
            if let cached = UserDefaults.standard.string(forKey: cacheKey) {
                return cached
            }
            throw error
        }
    }

    private func apiURL(path: String, query: [URLQueryItem]) -> URL? {
        guard let base = Bundle.main.object(forInfoDictionaryKey: "CONTENT_API_URL") as? String,
              var components = URLComponents(string: base.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + "/") else {
            return nil
        }
        components.path = components.path + path
        components.queryItems = query
        return components.url
    }
}
