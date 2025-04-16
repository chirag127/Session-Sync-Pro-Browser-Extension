# Session Sync Pro Browser Extension

Session Sync Pro is a browser extension that allows users to save and restore complete web sessions (including cookies, localStorage, and sessionStorage) for any website. It provides a secure user authentication system to synchronize saved sessions across multiple devices.

## Features

-   Save and restore complete web sessions (cookies, localStorage, sessionStorage)
-   Secure user authentication (Email/Password)
-   Synchronization of saved sessions across multiple devices
-   Intuitive user interface (Browser Action Popup & Context Menu)
-   Offline capabilities for local session management
-   Automatic pre-restore session backup

## Project Structure

-   `/extension`: Browser extension code (Manifest V3)
-   `/backend`: Node.js/Express.js server code

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

    ```
    cd backend
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Create a `.env` file with the following variables:

    ```
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/session-sync-pro
    JWT_SECRET=your_jwt_secret_key_change_in_production
    JWT_EXPIRES_IN=7d
    ```

4. Start the server:
    ```
    npm run dev
    ```

### Extension Setup

cd extension
npm install
npm run generate-icons
npm run build

1. Navigate to the extension directory:

    ```
    cd extension
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Generate icons:

    ```
    npm run generate-icons
    ```

4. Build the extension:

    ```
    npm run build
    ```

5. Load the extension in your browser:
    - Chrome: Open `chrome://extensions/`, enable Developer mode, click "Load unpacked", and select the `extension/dist` directory.
    - Firefox: Open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select any file in the `extension/dist` directory.

## Development

### Backend Development

cd backend
npm install
npm run dev

-   Run the server in development mode:

    ```
    npm run dev
    ```

-   Run tests:

    ```
    npm test
    ```

-   Run linting:
    ```
    npm run lint
    ```

### Extension Development

-   Run webpack in watch mode:

    ```
    npm run dev
    ```

-   Generate icons:

    ```
    npm run generate-icons
    ```

-   Run tests:

    ```
    npm test
    ```

-   Run linting:
    ```
    npm run lint
    ```

## API Documentation

### Authentication Endpoints

-   `POST /api/auth/register`: Register a new user

    -   Request body: `{ email, password }`
    -   Response: `{ message, token, user }`

-   `POST /api/auth/login`: Login a user

    -   Request body: `{ email, password }`
    -   Response: `{ message, token, user }`

-   `GET /api/auth/me`: Get current user (requires authentication)
    -   Response: `{ user }`

### Session Endpoints

-   `GET /api/sessions`: Get all sessions for the authenticated user

    -   Response: Array of session objects

-   `GET /api/sessions/domain/:domain`: Get sessions for a specific domain

    -   Response: Array of session objects for the domain

-   `GET /api/sessions/:id`: Get a single session by ID

    -   Response: Session object

-   `POST /api/sessions`: Create a new session

    -   Request body: `{ name, domain, cookies, localStorage, sessionStorage, hasHttpOnlyCookies }`
    -   Response: `{ message, session }`

-   `PUT /api/sessions/:id`: Update a session

    -   Request body: `{ name, cookies, localStorage, sessionStorage, hasHttpOnlyCookies }`
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

## License

MIT
