import GoogleMobileAds
import Combine
import UIKit

@MainActor
final class InterstitialAdManager: NSObject, ObservableObject, FullScreenContentDelegate {
    @Published private var ad: InterstitialAd?

    func load() {
        InterstitialAd.load(
            with: Bundle.main.object(forInfoDictionaryKey: "ADMOB_INTERSTITIAL_UNIT_ID") as? String
                ?? "ca-app-pub-3940256099942544/4411468910",
            request: Request()
        ) { [weak self] ad, _ in
            guard let self else { return }
            self.ad = ad
            ad?.fullScreenContentDelegate = self
        }
    }

    func show() {
        guard let ad,
              let controller = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .flatMap(\.windows)
                .first(where: \.isKeyWindow)?
                .rootViewController else {
            return
        }
        self.ad = nil
        ad.present(from: controller)
    }

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        load()
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        load()
    }
}
