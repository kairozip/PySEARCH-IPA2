import Foundation
import Speech

final class VoiceSearchService: NSObject, ObservableObject {
    @Published var transcript: String = ""
    @Published var authorizationStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined

    override init() {
        super.init()
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                self?.authorizationStatus = status
            }
        }
    }
}
