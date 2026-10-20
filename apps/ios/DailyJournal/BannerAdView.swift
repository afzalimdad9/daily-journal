import GoogleMobileAds
import SwiftUI

struct BannerAdView: UIViewRepresentable {
    func makeUIView(context: Context) -> BannerView {
        let banner = BannerView(adSize: AdSizeBanner)
        banner.adUnitID = Bundle.main.object(forInfoDictionaryKey: "ADMOB_BANNER_UNIT_ID") as? String
            ?? "ca-app-pub-3940256099942544/2934735716"
        banner.rootViewController = context.coordinator.rootViewController
        banner.load(Request())
        return banner
    }

    func updateUIView(_ uiView: BannerView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator {
        var rootViewController: UIViewController? {
            UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap(\.windows)
                .first(where: \.isKeyWindow)?
                .rootViewController
        }
    }
}
