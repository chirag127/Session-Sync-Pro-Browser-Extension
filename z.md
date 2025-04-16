# Product Requirements Document (PRD): Session Sync Pro Browser Extension

**Version:** 1.0
**Date:** 16th april 2025
**Author:** chirag singhal
**Status:** Final

---

## 1. Overview

### 1.1. Introduction
Session Sync Pro is a browser extension designed to enhance user productivity and streamline multi-account workflows. It allows users to save the complete session state (including cookies, `localStorage`, and `sessionStorage`) for any website and restore it later with a single click. The core value proposition is effortless switching between different user accounts or states on the same website without repeatedly logging in and out.

### 1.2. Goals
*   **G1 (P0):** Enable users to reliably save and restore complete web sessions (cookies, `localStorage`, `sessionStorage`) for specific websites.
*   **G2 (P0):** Provide a secure user authentication system (Email/Password) to allow synchronization of saved sessions across multiple devices where the user is logged into the extension.
*   **G3 (P0):** Offer an intuitive and accessible user interface (Browser Action Popup & Context Menu) for managing sessions.
*   **G4 (P0):** Ensure the security and privacy of sensitive user session data during storage (at rest) and transit.
*   **G5 (P1):** Implement robust offline capabilities allowing local session management and seamless synchronization upon reconnection.
*   **G6 (P0):** Build a production-ready, well-documented, maintainable, and performant extension and backend system.

### 1.3. Target Audience
*   Users managing multiple personal/work accounts on the same websites (e.g., social media, cloud services, project management tools).
*   Web developers and QA testers needing to switch between different user roles or test scenarios quickly.
*   Individuals seeking enhanced privacy by isolating sessions or easily clearing active sessions before closing a browser.
*   Anyone looking for a more efficient way to manage web logins than traditional password managers alone provide.

### 1.4. Scope
This PRD defines the requirements for the initial, complete version of the Session Sync Pro extension and its associated backend services. All features described herein are considered in-scope for this version.

---

## 2. Technical Specifications

### 2.1. Frontend (Browser Extension)
*   **Platform:** Browser Extension (Google Chrome, Mozilla Firefox - compatibility to be maximized)
*   **Manifest Version:** Manifest V3
*   **Technologies:** HTML5, CSS3, JavaScript (ES6+)
*   **Framework/Libraries:** No specific framework mandated, but use of lightweight libraries for DOM manipulation or state management is acceptable if justified. Ensure performance remains high.

### 2.2. Backend
*   **Platform:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB
*   **API:** RESTful API for communication between the extension and the backend.

### 2.3. Project Structure
*   A monorepo structure is preferred but not strictly required. Suggested structure:
    *   `/extension`: Contains all code for the browser extension (manifest.json, background scripts, content scripts, popup UI, options page UI, etc.).
    *   `/backend`: Contains all code for the Node.js/Express.js server (server setup, API routes, controllers, models, database connection logic, authentication logic, etc.).

---

## 3. Core Features and Functional Requirements

### 3.1. Session Saving (FR = Functional Requirement, P = Priority)

*   **FR1.1 (P0): Capture Session Data:** The extension MUST be able to capture all cookies (including HttpOnly, Secure, SameSite attributes), `localStorage` key-value pairs, and `sessionStorage` key-value pairs associated with the *exact* domain (e.g., `app.example.com`, not `*.example.com`) of the currently active tab.
    *   *Acceptance Criteria:* User visits `app.example.com`, logs in, performs actions creating data in cookies, localStorage, sessionStorage. Initiating a save captures data specifically for `app.example.com`. Visiting `other.example.com` and saving captures data only for `other.example.com`.
*   **FR1.2 (P0): Automatic Saving Trigger:** The extension MUST automatically save the *current* session state (cookies, localStorage, sessionStorage) for the active tab's website immediately *before* initiating a session restore operation, if the user confirms the restore (see FR2.3). This automatic save should be stored locally and synced to the backend, likely identified by a timestamp or "Pre-Restore Auto-Save" naming convention.
    *   *Acceptance Criteria:* User is on `site.com` with Session A active. User initiates restore for Session B. Confirmation prompt appears. User confirms. Before Session B data is applied, the current state (Session A) is automatically saved.
*   **FR1.3 (P0): Manual Saving Trigger:** Users MUST be able to manually trigger the saving of the current session for the active tab's website via the extension's popup UI or the page's context menu.
    *   *Acceptance Criteria:* User right-clicks on `site.com` page -> context menu shows "Save Session for site.com". Clicking it initiates the save process. User clicks extension icon -> popup shows a "Save Current Session" button. Clicking it initiates the save process.
*   **FR1.4 (P0): Custom Session Naming:** When manually saving a session (FR1.3), the user MUST be prompted to provide a custom, user-friendly name for the session (e.g., "Work Account," "Admin Login," "Test User B"). The website domain should be automatically associated and displayed, but the name provides user context. Default naming (e.g., timestamp) can be suggested if the user provides no name.
    *   *Acceptance Criteria:* User clicks "Save Session". A prompt/input field appears asking for a name. User enters "My Main Account". The session is saved with this name. If the user saves without entering a name, it gets a default name like "site.com - 2023-10-26 14:30:00".
*   **FR1.5 (P0): HttpOnly Cookie Handling (Saving):** The extension MUST request the `cookies` permission. While it cannot *read* the *value* of `HttpOnly` cookies, it MUST attempt to read all other cookie attributes (name, domain, path, secure, expirationDate, etc.). When saving a session, the extension MUST store information about *all* cookies associated with the domain, including those marked `HttpOnly`.
    *   *Acceptance Criteria:* Session saved for `secure.com`. The saved data includes metadata for all cookies, including one named `session_id` marked `HttpOnly`.
*   **FR1.6 (P1): User Feedback on HttpOnly Limitations:** If `HttpOnly` cookies are detected during the save process, the UI MUST subtly inform the user that the saved session includes `HttpOnly` cookies whose values could not be captured, which *might* affect restoration success depending on the website's specific mechanisms. This should not be an alarming message, but an informational one (e.g., a small icon or text note next to the saved session entry).
    *   *Acceptance Criteria:* Session with `HttpOnly` cookies is saved. In the list of saved sessions, an info icon or subtle text next to this session indicates the presence of `HttpOnly` cookies. Hovering over it provides a brief explanation.

### 3.2. Session Restoring

*   **FR2.1 (P0): Restore Initiation:** Users MUST be able to initiate the restoration of a previously saved session by selecting it from the list presented in the extension popup UI. The restore action should apply to the *currently active tab*, provided its domain matches the saved session's domain. If the domains don't match, the user should be prompted to navigate to the correct domain first, or the extension could offer to open the website in a new tab and restore there. (Let's choose the latter: Offer to open in a new tab if domains don't match).
    *   *Acceptance Criteria:* User is on `google.com`. Opens popup, selects a saved session for `github.com`. Extension prompts "Restore session for github.com? Open github.com in a new tab and restore?". User confirms. New tab opens to `github.com`, and session is restored there. If user is already on `github.com`, restore proceeds in the current tab after confirmation (FR2.2).
*   **FR2.2 (P0): Restore Confirmation:** If the user attempts to restore a session for a domain where there might be an existing session (i.e., cookies, localStorage, or sessionStorage are present for that domain), the extension MUST display a confirmation dialog. The dialog should clearly state which session is about to be restored and ask: "Restoring this session will replace your current session data for [domain]. The current session will be automatically backed up. Do you want to proceed?".
    *   *Acceptance Criteria:* User is logged into `site.com` (Session A). Opens popup, selects saved Session B for `site.com`. Confirmation dialog appears with the specified text. User clicks "Confirm".
*   **FR2.3 (P0): Pre-Restore Auto-Save:** Upon user confirmation (FR2.2), the extension MUST first automatically save the *current* session state as described in FR1.2 *before* proceeding with the restoration.
    *   *Acceptance Criteria:* User confirms restore in FR2.2. Extension successfully saves the current state (Session A) locally and queues it for sync.
*   **FR2.4 (P0): Data Replacement on Restore:** The restoration process MUST completely clear all existing cookies, `localStorage`, and `sessionStorage` for the target domain in the active tab *before* setting the data from the saved session.
    *   *Acceptance Criteria:* Before restore, `site.com` has cookies C1, C2 and localStorage L1. Saved session has cookies C3, C4 and localStorage L2. After restore, `site.com` *only* has C3, C4 and L2. C1, C2, L1 are gone.
*   **FR2.5 (P0): Setting Restored Data:** The extension MUST set all cookies (using the `cookies.set` API, attempting to replicate all attributes like domain, path, secure, httpOnly, expirationDate) and populate `localStorage` and `sessionStorage` with the key-value pairs from the selected saved session. Content scripts will be necessary to modify `localStorage` and `sessionStorage`.
    *   *Acceptance Criteria:* All data items (cookies, localStorage keys, sessionStorage keys) from the saved session are present in the browser for the target domain after restoration. `HttpOnly` cookies are set using the API, even if their original value wasn't readable.
*   **FR2.6 (P0): Automatic Page Reload:** After successfully restoring the session data (FR2.5), the extension MUST automatically reload the active tab to ensure the website reflects the newly restored session state.
    *   *Acceptance Criteria:* Session data is applied. The page `site.com` automatically refreshes. The user sees the state corresponding to the restored session (e.g., logged in as the restored user).
*   **FR2.7 (P0): Handling Restore Failures:** If any part of the restore process fails (e.g., permission denied, data corruption, error setting cookies/storage), the extension MUST inform the user with a clear error message and SHOULD attempt to revert to the state before the restore attempt began (though this might be difficult/impossible if data clearing already occurred). The pre-restore backup (FR2.3) becomes crucial here.
    *   *Acceptance Criteria:* Restore fails while setting a cookie. User sees an error message like "Failed to restore session: Could not set cookie 'X'. Page was not reloaded."

### 3.3. User Interface (UI) & User Experience (UX)

*   **FR3.1 (P0): Browser Action Popup:** The primary user interaction point MUST be a browser action popup, accessible via the extension's icon in the browser toolbar.
    *   *Acceptance Criteria:* Clicking the extension icon opens a well-structured popup.
*   **FR3.2 (P0): Context Menu Integration:** The extension MUST provide context menu items when the user right-clicks on a webpage. At minimum, a "Save current session for [domain]" option should be present. Additional options like "Restore session for [domain]..." (leading to a sub-menu or the popup) can be included.
    *   *Acceptance Criteria:* Right-clicking on `amazon.com` shows a menu item "Save current session for amazon.com".
*   **FR3.3 (P0): Session List Display:** The popup UI MUST display a list of all saved sessions (both local and synced).
    *   *Acceptance Criteria:* Popup opens, showing all sessions the user has saved.
*   **FR3.4 (P0): Session Grouping:** The session list MUST be grouped by the website domain (e.g., all `google.com` sessions listed together, all `github.com` sessions listed together). Groups should be clearly delineated.
    *   *Acceptance Criteria:* Saved sessions for `siteA.com` appear under a "siteA.com" heading, separate from sessions under a "siteB.com" heading.
*   **FR3.5 (P0): Session Identification:** Each listed session MUST clearly display:
    *   The user-provided custom name (FR1.4).
    *   The website domain it belongs to.
    *   The website's favicon (fetched dynamically or stored during save).
    *   A button/clickable area to initiate the Restore action.
    *   A button/option to Delete the saved session.
    *   (Optional but recommended) A timestamp of when it was saved/last updated.
    *   (Optional but recommended) An indicator if it contains HttpOnly cookies (FR1.6).
    *   *Acceptance Criteria:* User sees list items like "[Favicon] My Work Account (github.com) [Restore] [Delete]".
*   **FR3.6 (P1): Search/Filter Sessions:** The popup UI SHOULD include a search bar to filter the list of saved sessions by name or domain, especially important as the number of sessions grows.
    *   *Acceptance Criteria:* User types "work" into search bar. Only sessions with "work" in their name or domain are displayed.
*   **FR3.7 (P0): Feedback Messages:** Clear, non-intrusive feedback messages (e.g., toasts, temporary messages within the popup) MUST be displayed for successful actions (e.g., "Session saved!", "Session restored successfully!") and error conditions (FR2.7, FR4.9, FR5.5).
    *   *Acceptance Criteria:* User saves session. A message "Session 'XYZ' saved successfully" appears briefly. User attempts restore without permissions. Error message "Failed to restore: Missing required permissions" appears.
*   **FR3.8 (P0): Authentication UI:** The popup MUST provide UI elements for user Sign Up and Sign In (Email/Password). When logged out, the primary view should prompt login/signup. When logged in, it should show the session list and a Logout option.
    *   *Acceptance Criteria:* Logged out user clicks icon -> sees Email/Password fields for Login, link to Sign Up. Logged in user clicks icon -> sees session list, search bar, save button, logout button.

### 3.4. Authentication & Synchronization

*   **FR4.1 (P0): User Authentication:** Implement a secure user authentication system using Email and Password.
    *   *Sub-Requirements:*
        *   **Sign Up:** Collect email and password, validate email format, enforce password complexity rules (e.g., minimum length, character types).
        *   **Sign In:** Authenticate user with email and password.
        *   **Logout:** Clear local authentication state.
    *   *Acceptance Criteria:* User can successfully create an account, log in, and log out via the extension popup UI. Login state persists across browser restarts until logout.
*   **FR4.2 (P0): Backend Storage:** Use MongoDB as the backend database for storing user accounts and synced session data.
    *   *Acceptance Criteria:* Backend successfully connects to and interacts with a MongoDB instance.
*   **FR4.3 (P0): Secure Password Storage:** User passwords MUST be securely hashed using a strong, standard algorithm (e.g., bcrypt with an appropriate cost factor) before being stored in the database. Plaintext passwords MUST NOT be stored.
    *   *Acceptance Criteria:* User password "password123" is stored in the DB as a bcrypt hash, not "password123". Login validation compares hashed input against stored hash.
*   **FR4.4 (P1): Backend Security Measures:** Implement basic security measures on the backend authentication endpoints:
    *   **Rate Limiting:** Limit the number of login/signup attempts from a single IP address or for a single account to mitigate brute-force attacks.
    *   **Input Validation:** Sanitize and validate all input received from the extension.
    *   *Acceptance Criteria:* Making 10 failed login attempts in a minute triggers a temporary block. Sending invalid email format to signup returns a validation error.
*   **FR4.5 (P0): Secure Data Transit:** All communication between the browser extension and the backend API MUST use HTTPS to encrypt data in transit.
    *   *Acceptance Criteria:* Network inspection shows all API calls are made over HTTPS. Backend server is configured for HTTPS only.
*   **FR4.6 (P0): Session Data Storage:** Saved session data (cookies, localStorage, sessionStorage objects/arrays) MUST be stored in the MongoDB database, associated with the authenticated user's ID.
    *   *Acceptance Criteria:* User A saves session S1. S1 appears in the database linked to User A's unique identifier.
*   **FR4.7 (P0): Backend Authorization:** The backend API MUST implement strict authorization checks for all data access endpoints. A user MUST only be able to access, modify, or delete sessions associated with their own account. Attempting to access another user's data MUST result in an authorization error (e.g., 403 Forbidden).
    *   *Acceptance Criteria:* User A (logged in) attempts API call to GET sessions for User B. API returns 403 Forbidden or 404 Not Found. User A successfully retrieves only their own sessions.
*   **FR4.8 (P0): Data Sync Trigger:** Synchronization of session data between the local extension storage and the backend MUST occur automatically after:
    *   Successful user login (download latest sessions from backend).
    *   Every successful manual session save (upload new session).
    *   Every successful automatic pre-restore save (upload new session).
    *   Every successful session deletion (send delete request to backend).
    *   Every successful session restore (potentially update a 'last used' timestamp on the backend).
    *   *Acceptance Criteria:* User logs in on Device B after saving a session on Device A. The session saved on Device A appears on Device B shortly after login. Deleting a session on Device A also removes it from Device B after a sync cycle.
*   **FR4.9 (P0): Sync Error Handling:** The extension MUST handle potential network errors or backend errors during synchronization gracefully. Inform the user if sync fails, but retain local changes so they can be synced later.
    *   *Acceptance Criteria:* User saves a session while offline. Extension saves locally. When network returns, sync is attempted. If backend is down, user sees a "Sync failed, will retry later" message. Local session remains available.
*   **FR4.10 (P0): SECURITY WARNING - Encryption at Rest:** The requirement provided (Q15) states that session data (cookies, localStorage, sessionStorage) **will not be encrypted at rest** in the MongoDB database.
    *   **!!! CRITICAL RISK !!!** Storing sensitive session data, especially cookies which often contain authentication tokens, in plaintext poses an **EXTREME SECURITY RISK**. If the database is compromised, all user sessions for all websites stored by this extension will be exposed, potentially leading to account takeovers.
    *   **Requirement:** Implement storage *without* encryption at rest as specified in Q15.
    *   **Strong Recommendation:** It is **IMPERATIVE** for security to reconsider this requirement and implement encryption at rest (e.g., field-level encryption using application-managed keys, or database-level Transparent Data Encryption if available/appropriate) for the `cookies`, `localStorage`, and `sessionStorage` fields in the database. The PRD proceeds with the user's stated requirement, but this decision carries significant risk.
    *   *Acceptance Criteria (as per Q15):* Session data (cookie strings/objects, localStorage/sessionStorage objects) is stored as plain text or easily reversible formats (like JSON strings) within the MongoDB documents.

### 3.5. Offline Mode

*   **FR5.1 (P0): Local Storage:** The extension MUST use browser local storage (`chrome.storage.local` or equivalent) to store saved sessions, user authentication tokens (if applicable), and configuration locally. This enables offline functionality.
    *   *Acceptance Criteria:* Extension can save/list/restore sessions even when the browser is offline, using data stored locally.
*   **FR5.2 (P0): Offline Save/Restore:** Users MUST be able to save new sessions and restore existing locally stored sessions even when offline.
    *   *Acceptance Criteria:* Disconnect internet. User can save a session for the current site. User can restore a previously saved session (that was available locally) for the current site.
*   **FR5.3 (P0): Offline Deletion:** Users MUST be able to delete locally stored sessions when offline.
    *   *Acceptance Criteria:* Disconnect internet. User deletes a session from the popup list. The session is removed locally.
*   **FR5.4 (P0): Sync on Reconnect:** The extension MUST detect when network connectivity is restored after being offline. Upon reconnection, it MUST automatically attempt to synchronize local changes (new saves, deletions) with the backend and download any changes from the backend made on other devices.
    *   *Acceptance Criteria:* User saves Session X offline. User deletes Session Y offline. User reconnects. Extension uploads Session X to backend, sends delete command for Session Y to backend, and downloads any Session Z saved on another device.
*   **FR5.5 (P1): Conflict Resolution:** Implement a basic conflict resolution strategy for synchronization. A "last write wins" approach based on timestamps is acceptable for this version (i.e., the most recently saved/updated version of a session, whether local or remote, overwrites the other). Ensure timestamps are reliable (preferably use server time upon successful sync, or carefully managed client-side timestamps).
    *   *Acceptance Criteria:* User A modifies Session S on Device 1 at T1. User B modifies Session S on Device 2 at T2 (T2 > T1). Both sync. The final state of Session S on both devices reflects the changes made by User B at T2.

### 3.6. Error Handling & Edge Cases

*   **FR6.1 (P0): Website Structure Changes:** The extension cannot guarantee a restored session will work if the target website has significantly changed its login mechanism, cookie structure, or session handling since the session was saved (as per Q24). The extension should restore the data as saved, but if login fails, the user must understand this is a limitation. No specific error message is required beyond the standard restore feedback unless the failure is clearly detectable by the extension itself (e.g., failure to set a cookie).
    *   *Acceptance Criteria:* Session saved for `old-site.com`. Site updates login flow. User restores old session. Page reloads, user is *not* logged in. Extension shows "Session restored successfully" (as data was applied), but the outcome depends on the site.
*   **FR6.2 (P1): Storage Quota:** Handle potential browser storage quota limits (`chrome.storage.local`). If storage is full, saving new sessions locally should fail gracefully with a user message.
    *   *Acceptance Criteria:* Local storage quota is exceeded. User tries to save a session. Error message "Failed to save session: Browser storage quota exceeded." is shown.
*   **FR6.3 (P0): Permissions Handling:** Gracefully handle cases where the user has not granted necessary permissions (especially `cookies`, `storage`, `<all_urls>`). Prompt the user to grant required permissions if an action fails due to lack of them.
    *   *Acceptance Criteria:* User tries to save session without `<all_urls>` permission. Extension prompts user to grant the permission.
*   **FR6.4 (P0): No Session Limit:** There MUST NOT be any artificial limit imposed by the extension on the number of sessions or websites a user can save (as per Q22), beyond underlying browser or backend database limitations.
    *   *Acceptance Criteria:* User can successfully save hundreds of sessions across dozens of domains. Performance should degrade gracefully.
*   **FR6.5 (P0): Handling Non-Cookie Sessions:** The extension is explicitly required to handle `localStorage` and `sessionStorage` alongside cookies (Q1, Q23). This includes saving and restoring data like JWTs often stored in `localStorage`.
    *   *Acceptance Criteria:* User logs into a site using JWT stored in `localStorage`. Saving the session captures the JWT. Restoring the session correctly sets the JWT in `localStorage`, allowing the user to be logged in after page reload.

---

## 4. Non-Functional Requirements

*   **NFR1 (P0): Performance:** The extension MUST have minimal impact on browser performance (CPU, memory). Background processes should be efficient. Popup UI should load quickly. Saving/restoring sessions should be performant.
*   **NFR2 (P0): Security:** Adhere to security best practices for both extension development (e.g., avoid `eval`, sanitize inputs, use secure APIs) and backend development (HTTPS, password hashing, authorization, rate limiting, dependency vulnerability scanning). Reiteration of the **critical risk** regarding lack of encryption at rest (FR4.10).
*   **NFR3 (P0): Reliability:** Session saving and restoring MUST be reliable. Data corruption should be minimized. Syncing should function consistently.
*   **NFR4 (P0): Usability:** The UI MUST be intuitive and easy to use for the target audience. Common actions should be easily discoverable. Error messages should be clear and helpful.
*   **NFR5 (P1): Maintainability:** Code MUST be well-organized, documented (comments, READMEs), follow consistent coding standards (e.g., ESLint/Prettier), and include reasonable unit/integration tests for core logic (especially auth, session manipulation, sync).
*   **NFR6 (P1): Scalability:** The backend solution SHOULD be designed with basic scalability considerations, capable of handling a moderate number of users and sessions without significant performance degradation. MongoDB schema design should support efficient querying.

---

## 5. Browser Permissions

The extension will require the following permissions, with justifications:

*   **`storage` (P0):** Required to store session data, user preferences, and authentication state locally for offline access and persistence.
*   **`cookies` (P0):** Required to read cookies for saving sessions and to write/delete cookies for restoring sessions for the relevant domains.
*   **`activeTab` (P0):** Required to get the URL (domain) of the current tab when the user invokes the extension via the browser action popup, without needing broader tab access.
*   **`scripting` (P0):** Required (under Manifest V3) to execute content scripts programmatically to access and modify `localStorage` and `sessionStorage` on the page, and potentially to trigger page reloads.
*   **`contextMenus` (P0):** Required to add the "Save session" option to the page's right-click context menu.
*   **`<all_urls>` (P0):** Required because the extension needs to:
    *   Read cookies and execute scripts (via `scripting` permission) on *any* website the user wishes to save/restore a session for. Manifest V3 requires host permissions to be declared if the extension needs broad access.
    *   Set cookies for *any* domain specified in a saved session during restore.
    *   Fetch favicons from various domains.
*   **`alarms` (P1):** Potentially required for implementing periodic background sync checks or retry logic, although primary sync is event-driven (FR4.8).

*User Justification:* These permissions will be explained to the user during installation/update (as required by browsers) and potentially within the extension's description/options page. The explanation will focus on *why* each permission is needed to deliver the core functionality (saving/restoring data on *any* site, storing data locally, adding context menu items).

---

## 6. Release Criteria

*   All P0 functional requirements (FRs) are implemented and pass acceptance criteria.
*   All P0 non-functional requirements (NFRs) are met.
*   Major P1 requirements (especially Search FR3.6, Conflict Resolution FR5.5, Rate Limiting FR4.4) are implemented.
*   Extension passes manual testing on latest versions of Google Chrome and Mozilla Firefox.
*   No critical security vulnerabilities identified in code review or basic automated scanning.
*   Backend API is deployed and operational.
*   Basic documentation (README for setup, overview of code structure) is present.

---

## 7. Instructions for AI Agent

*   You are tasked with building the Session Sync Pro browser extension and its corresponding backend based *exactly* on the requirements outlined in this PRD.
*   Adhere strictly to the specified technology stack (Manifest V3, JS, Express.js, MongoDB).
*   Implement *all* P0 requirements and strive to complete P1 requirements.
*   Ensure the final product is production-ready, not an MVP. This includes robust error handling, security measures (within the constraints of FR4.10), and usability considerations.
*   Pay close attention to the **SECURITY WARNING** regarding encryption at rest (FR4.10). Implement as specified, but be aware of the inherent risks.
*   Code must be well-structured, clearly written, and include comments for complex logic. Follow standard best practices for web extension and backend development.
*   Provide comprehensive documentation, including setup instructions for both the extension and backend, and an overview of the architecture and major components.
*   Deliver the code organized as specified in the Project Structure (Section 2.3).
*   Assume this PRD is the single source of truth for the requested features and functionality.