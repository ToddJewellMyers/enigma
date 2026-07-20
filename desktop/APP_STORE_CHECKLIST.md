# Mac App Store submission checklist

## Apple account setup

- [ ] Enroll in the Apple Developer Program.
- [ ] Register the App ID `com.enigma.kanban.mas`.
- [ ] Create an Apple Distribution certificate.
- [ ] Create a Mac App Store distribution provisioning profile.
- [ ] Create the Enigma macOS app record in App Store Connect.

## Repository and build

- [x] Separate terminal-free App Store entry point.
- [x] Use Electron's `mas` target.
- [x] Enable Apple App Sandbox.
- [x] Enable outbound network access only.
- [x] Enable Electron renderer sandboxing.
- [x] Disable Node integration.
- [x] Provide parent and inherited entitlements.
- [x] Provide a 1024×1024 application icon source.
- [ ] Add the selected open-source license.
- [ ] Run a signed build with the distribution profile.
- [ ] Inspect signatures and entitlements with `codesign`.
- [ ] Install and test the signed build on a clean macOS account.

## App Store Connect listing

- [ ] App name, subtitle, description, keywords, and category.
- [ ] Support URL and marketing URL.
- [ ] Public privacy-policy URL.
- [ ] Accurate App Privacy answers for email, account identifiers, and user content.
- [ ] macOS screenshots at accepted App Store dimensions.
- [ ] Version, copyright, and review notes.
- [ ] Demo account credentials for App Review.
- [ ] Encryption export-compliance answers.
- [ ] Age rating and availability.

## Submission

- [ ] Build the signed `.pkg` through the protected GitHub environment or locally.
- [ ] Upload with Apple Transporter.
- [ ] Resolve App Store Connect processing warnings.
- [ ] Select the uploaded build and submit it for review.
- [ ] Respond to reviewer questions and publish after approval.

## Review risk to address

The App Store edition is a native Electron window around the hosted Enigma service. Apple may determine that it does not provide enough Mac-specific value under its minimum-functionality guidelines. Before submission, consider adding native menu commands, keyboard shortcuts, notifications, dock integrations, offline behavior, or another meaningful platform feature that remains compatible with App Sandbox.
