# Security Policy — Fuze Drive

At Fuze Drive, we treat user security, token confidentiality, and data isolation with the utmost seriousness. Because Fuze coordinates access to users' personal third-party cloud storage accounts, our architecture is designed to minimize risk by strictly separating the Control Plane from the Data Plane.

---

## 1. Architectural Security Principles

### Direct Browser-to-Cloud Streaming
* **Data Plane**: Upload and standard download payloads stream directly between the user's web browser and cloud provider REST APIs (Google Drive, Microsoft OneDrive, Dropbox, Box, pCloud, MEGA, Koofr) via authorized resumable sessions.
* **Control Plane**: Fuze servers never store your raw file library. The backend only indexes virtual metadata (file names, sizes, MIME types, folder paths, and provider chunk maps).
* **Ephemeral Previews**: Video thumbnail and document preview requests are processed via an ephemeral server cache with a 14-day time-to-live and automatic LRU eviction.

### Token Encryption at Rest
* All OAuth 2.0 access tokens, refresh tokens, and WebDAV app passwords are encrypted at rest using **AES-256-GCM** (Galois/Counter Mode).
* Each secret is encrypted with a unique 16-byte random initialization vector (IV) and a 16-byte cryptographic authentication tag. The format stored is `iv:authTag:cipherText`.
* Encryption keys are managed through server environment variables and never exposed to the client application.

### Passwords and Credentials
* For OAuth-enabled providers (Google Drive, Microsoft OneDrive, Dropbox, Box, pCloud), Fuze **never** requests or stores your account password.
* For Koofr, connections require an isolated **WebDAV App Password** generated in your Koofr account preferences rather than your primary password.
* Fuze user passwords are encrypted using **Argon2id** with individual cryptographic salts.

### Account Collision Protection
* Fuze strictly enforces account collision protection across profiles: a third-party cloud account email cannot be claimed by more than one Fuze user profile simultaneously.

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or potential token leak in Fuze Drive, please report it responsibly so we can resolve the issue before public disclosure.

* **Email**: Please email security reports directly to the maintainer at **`aftabalamdlm@gmail.com`**.
* **GitHub**: Alternatively, you can open a private Security Advisory under the GitHub repository:  
  [https://github.com/CodeItAftab/fuze/security/advisories/new](https://github.com/CodeItAftab/fuze/security/advisories/new)

Please include:
1. Description of the vulnerability.
2. Reproduction steps or proof of concept.
3. Affected components (web, server, or specific cloud adapter).

We will acknowledge your report within 48 hours and coordinate a timely fix and responsible disclosure.
