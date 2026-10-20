import GoogleMobileAds
import SwiftUI

@main
struct DailyJournalApp: App {
    @StateObject private var store = BlogStore()

    init() {
        MobileAds.shared.start()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
