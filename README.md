# Session Sync Pro Browser Extension

Session Sync Pro is a browser extension that allows users to save and restore complete web sessions (including cookies, localStorage, and sessionStorage) for any website. It provides a secure user authentication system to synchronize saved sessions across multiple devices.

## Features

-   Save and restore complete web sessions (cookies, localStorage, sessionStorage)
-   Secure user authentication (Email/Password)
-   Synchronization of saved sessions across multiple devices
-   Intuitive user interface (Browser Action Popup & Context Menu)
-   Offline capabilities for local session management
-   Automatic pre-restore session backup
-   Domain blacklisting for sensitive websites
-   Support for HttpOnly cookies (with limitations)

## Project Structure

-   `/extension`: Browser extension code (Manifest V3)
-   `/backend`: Node.js/Express.js server code

## Setup Instructions

### Quick Setup

To set up the entire project at once:

```bash
# Install all dependencies
npm run install:all

# Generate extension icons
npm run generate-icons

# Build the extension
npm run build:extension

# Start the backend server
npm run dev:backend
```

### Backend Setup

1. Navigate to the backend directory:

    ```bash
    cd backend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file with the following variables:

    ```
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/session-sync-pro
    JWT_SECRET=your_jwt_secret_key_change_in_production
    JWT_EXPIRES_IN=7d
    EMAIL_SERVICE=gmail
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASSWORD=your_app_password
    CLIENT_URL=http://localhost:8080
    ```

4. Start the server:
    ```bash
    npm run dev
    ```

### Extension Setup

1. Navigate to the extension directory:

    ```bash
    cd extension
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Generate icons:

    ```bash
    npm run generate-icons
    ```

4. Build the extension:

    ```bash
    npm run build
    ```

5. Load the extension in your browser:
    - Chrome: Open `chrome://extensions/`, enable Developer mode, click "Load unpacked", and select the `extension/dist` directory.
    - Firefox: Open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select any file in the `extension/dist` directory.

## Development

### Backend Development

-   Run the server in development mode:

    ```bash
    cd backend
    npm run dev
    ```

-   Run tests:

    ```bash
    npm test
    ```

-   Run linting:
    ```bash
    npm run lint
    ```

### Extension Development

-   Run webpack in watch mode:

    ```bash
    cd extension
    npm run dev
    ```

-   Generate icons:

    ```bash
    npm run generate-icons
    ```

-   Run tests:

    ```bash
    npm test
    ```

-   Run linting:
    ```bash
    npm run lint
    ```

## API Documentation

### Authentication Endpoints

-   `POST /api/auth/register`: Register a new user

    -   Request body: `{ email, password }`
    -   Response: `{ message, token, user }`

-   `POST /api/auth/verify-email`: Verify user email

    -   Request body: `{ token }`
    -   Response: `{ message, token, user }`

-   `POST /api/auth/login`: Login a user

    -   Request body: `{ email, password }`
    -   Response: `{ message, token, user }`

-   `GET /api/auth/me`: Get current user (requires authentication)

    -   Response: `{ user }`

-   `POST /api/auth/forgot-password`: Request password reset

    -   Request body: `{ email }`
    -   Response: `{ message }`

-   `POST /api/auth/reset-password`: Reset password
    -   Request body: `{ token, password }`
    -   Response: `{ message, token, user }`

### Session Endpoints

-   `GET /api/sessions`: Get all sessions for the authenticated user

    -   Response: Array of session objects

-   `GET /api/sessions/domain/:domain`: Get sessions for a specific domain

    -   Response: Array of session objects for the domain

-   `GET /api/sessions/:id`: Get a single session by ID

    -   Response: Session object

-   `POST /api/sessions`: Create a new session

    -   Request body: `{ name, domain, faviconUrl, cookies, localStorage, sessionStorage, hasHttpOnlyCookies }`
    -   Response: `{ message, session }`

-   `PUT /api/sessions/:id`: Update a session

    -   Request body: `{ name, faviconUrl, cookies, localStorage, sessionStorage, hasHttpOnlyCookies }`
    -   Response: `{ message, session }`

-   `PATCH /api/sessions/:id/lastUsed`: Update last used timestamp

    -   Response: `{ message, session }`

-   `DELETE /api/sessions/:id`: Delete a session
    -   Response: `{ message }`

## Security Considerations

-   All communication between the extension and backend uses HTTPS
-   Passwords are securely hashed using bcrypt before storage
-   JWT tokens are used for authentication
-   Rate limiting is implemented to prevent brute-force attacks
-   Input validation is performed on all API endpoints
-   **Important Note**: Session data is not encrypted at rest in the database. This is a potential security risk and should be considered when using the extension with sensitive websites. Use the blacklist feature to prevent saving sessions for sensitive websites.

## Limitations

-   **HttpOnly Cookies**: The extension can save and restore HttpOnly cookies, but with limitations. During save, the extension can only retrieve metadata about HttpOnly cookies (name, domain, path) but not their values. During restore, the extension will attempt to set these cookies, but success depends on whether the server accepts the session based solely on setting these known cookies.
-   **Website Structure Changes**: If a website drastically changes its login mechanism, cookie structure, or reliance on localStorage/sessionStorage after a session is saved, restoring that session may fail or not result in a logged-in state.

## License

MIT
