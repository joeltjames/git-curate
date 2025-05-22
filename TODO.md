# macOS Code Signing and Notarization Setup

## Prerequisites
- [ ] Sign up for an Apple Developer account at https://developer.apple.com
- [ ] Enroll in the Apple Developer Program ($99/year)

## Steps to Set Up Code Signing

### 1. Create Developer ID Certificate
- [ ] Go to https://developer.apple.com/account/resources/certificates/list
- [ ] Click the + button to add a new certificate
- [ ] Select "Developer ID Application" under Software
- [ ] Follow the instructions to create and download the certificate
- [ ] Convert the certificate to P12 format using Keychain Access
- [ ] Base64 encode the P12 file:
  ```bash
  base64 -i certificate.p12 | pbcopy
  ```

### 2. Get Required Information
- [ ] Get your Team ID:
  - Go to https://developer.apple.com/account
  - Find Team ID under Membership Details

- [ ] Create App-Specific Password:
  - Go to https://appleid.apple.com
  - Sign in with your Apple ID
  - Go to Security > App-Specific Passwords
  - Generate a new password for GitHub Actions

### 3. Add GitHub Secrets
Go to your repository settings > Secrets and Variables > Actions and add the following secrets:

- [ ] `MACOS_CERTIFICATE_P12`: Your base64-encoded P12 certificate
- [ ] `MACOS_CERTIFICATE_PASSWORD`: Your P12 certificate password
- [ ] `MACOS_CERTIFICATE_NAME`: Your Developer ID Application certificate name
- [ ] `APPLE_ID`: Your Apple ID email
- [ ] `APPLE_TEAM_ID`: Your Apple Developer Team ID
- [ ] `APPLE_APP_SPECIFIC_PASSWORD`: Your app-specific password

## What This Will Do
Once set up, the GitHub Actions workflow will:
1. Import your Developer ID certificate
2. Sign your macOS binaries with the certificate
3. Notarize the binaries with Apple
4. Upload the signed and notarized binaries as artifacts

This will prevent the "macOS could not validate it was free of malware" warning from appearing when users run your application.

## Notes
- The code signing and notarization process is already configured in `.github/workflows/release.yml`
- The process runs automatically when you create a new release tag (v*)
- Make sure to keep your certificates and passwords secure
- The Apple Developer Program membership needs to be renewed annually

# NPM Distribution Setup

## Prerequisites
- [ ] Create an npm account at https://www.npmjs.com/signup
- [ ] Login to npm in your terminal:
  ```bash
  yarn login
  ```

## Steps to Set Up NPM Distribution

### 1. Update package.json
- [ ] Add repository information:
  ```json
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/git-curate.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/git-curate/issues"
  },
  "homepage": "https://github.com/yourusername/git-curate#readme"
  ```
- [ ] Add author information:
  ```json
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  }
  ```
- [ ] Add publishConfig to ensure public access:
  ```json
  "publishConfig": {
    "access": "public"
  }
  ```

### 2. Add NPM Publishing to GitHub Actions
- [ ] Add a new job to `.github/workflows/release.yml` for npm publishing
- [ ] Set up npm authentication in the workflow
- [ ] Configure automatic version bumping

### 3. Test Local Publishing
- [ ] Test the package locally:
  ```bash
  yarn pack
  ```
- [ ] Verify the contents of the tarball
- [ ] Test installation locally:
  ```bash
  yarn global add .
  ```

### 4. First Time Publishing
- [ ] Ensure all changes are committed
- [ ] Run `yarn publish` to publish to npm
- [ ] Verify the package is available on npmjs.com

## What This Will Do
- Make your package available through npm
- Allow users to install via `yarn global add git-curate`
- Enable automatic publishing through GitHub Actions
- Provide proper metadata for npm

## Notes
- The package will be published as a global CLI tool
- Users can install it using `yarn global add git-curate`
- The package will be available at https://www.npmjs.com/package/git-curate
- Consider adding a CHANGELOG.md to track version changes 