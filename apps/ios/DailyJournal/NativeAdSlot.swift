import GoogleMobileAds
import SwiftUI
import UIKit

struct NativeAdSlot: UIViewRepresentable {
    func makeUIView(context: Context) -> NativeAdView {
        let adView = NativeAdView()
        let headline = UILabel()
        headline.numberOfLines = 2
        headline.font = .preferredFont(forTextStyle: .headline)
        headline.translatesAutoresizingMaskIntoConstraints = false
        adView.addSubview(headline)
        NSLayoutConstraint.activate([
            headline.leadingAnchor.constraint(equalTo: adView.leadingAnchor, constant: 16),
            headline.trailingAnchor.constraint(equalTo: adView.trailingAnchor, constant: -16),
            headline.centerYAnchor.constraint(equalTo: adView.centerYAnchor)
        ])
        adView.headlineView = headline
        context.coordinator.load(into: adView)
        return adView
    }

    func updateUIView(_ uiView: NativeAdView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, NativeAdLoaderDelegate {
        private var loader: AdLoader?

        func load(into view: NativeAdView) {
            loader = AdLoader(
                adUnitID: Bundle.main.object(forInfoDictionaryKey: "ADMOB_NATIVE_UNIT_ID") as? String
                    ?? "ca-app-pub-3940256099942544/3986624511",
                rootViewController: UIApplication.shared.connectedScenes
                    .compactMap { $0 as? UIWindowScene }
                    .flatMap(\.windows)
                    .first(where: \.isKeyWindow)?
                    .rootViewController,
                adTypes: [.native],
                options: nil
            )
            loader?.delegate = self
            loader?.load(Request())
            self.view = view
        }

        private weak var view: NativeAdView?

        func adLoader(_ adLoader: AdLoader, didReceive nativeAd: NativeAd) {
            view?.nativeAd = nativeAd
            (view?.headlineView as? UILabel)?.text = "Ad · \(nativeAd.headline ?? "Sponsored content")"
        }
    }
}
