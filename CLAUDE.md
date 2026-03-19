# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

BookSharingApp is a **community-based book lending platform** that enables users to share physical books with others in their communities. The app facilitates the entire borrowing lifecycle from discovery to return, with built-in chat, notifications, and dispute resolution.

**Core Value Proposition:**
- Discover books available in your communities
- Request to borrow books from other members
- Track lending/borrowing status through a structured workflow
- Communicate with lenders/borrowers via real-time chat
- Manage your personal library and share availability

## Technology Stack

### Mobile Application (This Repository)
- **React Native 0.81.4** with **React 19.1.0**
- **Expo SDK 54** - Development platform and build system
- **TypeScript 5.9.2** with strict mode enabled
- **React Navigation 7.x** - Navigation framework
- **React Query 5.90.11** - Server state management and caching
- **SignalR 9.0.6** - Real-time chat functionality
- **Expo SecureStore** - Encrypted token storage
- **Expo Camera** - Barcode scanning for ISBN lookup

### Backend API (BookSharingWebAPI)
Located at: `/home/landonlaptop/code/BookSharingWebAPI/`

- **ASP.NET Core 8.0** (.NET 8) - Minimal APIs pattern
- **PostgreSQL 15** - Relational database (via Docker)
- **Entity Framework Core 9.0.8** - ORM with Code-First migrations
- **ASP.NET Core Identity** - User management and authentication
- **JWT Authentication** - Access tokens (24h) + refresh tokens (7d)
- **SignalR** - WebSocket-based real-time messaging
- **OpenLibrary API** - External book search integration
- **Docker & Docker Compose** - Containerized deployment

## Development Commands

### Starting Development Server
```bash
npm start              # Start Expo development server
npm run android        # Start with Android emulator/device
npm run ios           # Start with iOS simulator/device  
npm run web           # Start web version in browser
```

### Development Workflow
- The entry point is `index.ts` which registers `App.tsx` as the root component
- Use Expo Go app on physical devices for testing during development
- Web version runs in browser for quick testing of UI components

## Core Entities & Domain Model

### User
- Unique identifier (GUID)
- Profile: email, firstName, lastName, fullName
- Authentication via JWT tokens stored in SecureStore
- Can join multiple communities

### Book
- Basic book information: id, title, author, thumbnailUrl
- Unique constraint on (title, author) combination
- Thumbnails downloaded from OpenLibrary or stored locally
- Multiple users can own the same book

### UserBook (Library Entry)
- Links User to Book (ownership relationship)
- **Status enum**: Available(1), BeingShared(2), Unavailable(3)
- Users manage their personal library of books
- Only available books can be requested by others

### Share (Lending Transaction)
The core entity representing a book-sharing relationship between lender and borrower.

**Key Properties:**
- `userBookId` - The lender's book being shared
- `borrower` - User ID of the borrower
- `returnDate` - Expected return date (set by lender)
- `status` - Current workflow state

**ShareStatus Workflow:**
1. **Requested** - Borrower requests to borrow → Lender gets notification
2. **Ready** - Lender approves → Book ready for pickup
3. **PickedUp** - Borrower confirms pickup → Book in borrower's possession
4. **Returned** - Borrower returns book → Awaiting lender confirmation
5. **HomeSafe** - Lender confirms receipt → Transaction complete ✓

**Alternative Paths:**
- **Declined** - Lender rejects request (terminal state)
- **Disputed** - Either party raises issue at any stage (terminal state)

**Authorization:**
- Lender-only actions: Ready, HomeSafe, Declined, SetReturnDate
- Borrower-only actions: PickedUp, Returned
- Either party: Disputed, Archive/Unarchive

### ShareUserState (Archive State)
- Tracks per-user archive status for shares
- Allows borrower and lender to independently archive completed shares
- Only terminal states (HomeSafe, Disputed, Declined) can be archived

### Community
- Groups of users who share books with each other
- Users can join multiple communities
- Book searches are scoped to shared communities (privacy by design)
- Users limited to creating 5 communities
- Creator automatically becomes moderator
- Community deleted when last member leaves

### ChatMessage & ChatThread
- Each share has a dedicated chat thread
- Real-time messaging via SignalR WebSocket
- Message types: user messages + system messages (status changes)
- Rate limited: 30 messages per 2 minutes per user
- Paginated message history (50 per page, max 100)

### Notification
- **Types**: ShareStatusChanged, ShareDueDateChanged, ShareMessageReceived
- Separate read tracking for share vs. chat notifications
- Includes share details, message content, and actor information
- Auto-created when share status changes or messages are sent
- Persists even if share is archived

## Key Features & User Workflows

### 1. Authentication (`/src/features/auth/`)
- **Login** - Email/password authentication
- **Register** - New user account creation
- JWT tokens stored in Expo SecureStore (encrypted)
- AuthContext provides global auth state
- Refresh token support (7-day expiration)

### 2. Book Search (`Search` Tab - `/src/features/books/`)
- **Search by title or author** with 500ms debouncing
- Searches books available in your communities only
- Shows owner name and community name
- Filter by availability status
- Create share requests directly from search results
- Results limited to books you don't own

**Technical:** Uses PostgreSQL function `search_accessible_books()` for community-scoped search

### 3. Library Management (`Library` Tab - `/src/features/library/`)
**Screens:**
- **LibraryScreen** - View and manage your book collection
- **BarcodeScanner** - Scan ISBN barcode to add books
- **ExternalBookSearch** - Manual search via OpenLibrary API
- **BookConfirmation** - Confirm book details before adding

**Capabilities:**
- Add books via ISBN scan or manual search
- Update book status (Available, BeingShared, Unavailable)
- Remove books from library
- Search/filter your collection
- Books automatically set to "Available" when added

### 4. Shares Management (`Shares` Tab - `/src/features/shares/`)
**Main Screens:**
- **SharesScreen** - Two tabs:
  - "My Borrows" - Books you're borrowing from others
  - "My Lent Books" - Books you're lending to others
- **ShareDetailsScreen** - Full share information with:
  - Visual status timeline
  - Status update actions (context-aware based on role)
  - Return date management
  - Archive/unarchive functionality
  - Link to chat
- **ShareChatScreen** - Real-time chat for coordination
- **ArchivedSharesScreen** - View completed/archived shares

**Share Lifecycle:**
1. Borrower searches for book → Creates share request
2. Lender receives notification → Approves (Ready) or Declines
3. Borrower picks up book → Updates status to PickedUp
4. Borrower returns book → Updates status to Returned
5. Lender confirms → Updates to HomeSafe (complete)
6. Either party can archive once in terminal state

**Validation:**
- Cannot borrow own books
- Must share a community with book owner
- No duplicate active shares for same book by the same borrower
- Cannot skip workflow stages or move backwards
- Only available books can be requested

### 5. Real-time Chat (`/src/features/shares/`)
**Technology:** SignalR WebSocket with REST API fallback

**Features:**
- Share-specific chat rooms
- Real-time message delivery
- System messages for status changes (e.g., "Book is ready for pickup!")
- Connection status indicator
- Paginated message history
- Auto-reconnection with exponential backoff

**Rate Limiting:** 30 messages per 2 minutes per user

### 6. Notifications (`/src/features/notifications/`)
**Notification Types:**
- Share status changes (Requested, Ready, PickedUp, etc.)
- Return date set/updated
- New chat messages

**Features:**
- Unread count badge on Shares tab
- Separate mark-as-read for share vs. chat notifications
- Auto-mark read when viewing ShareDetails screen
- Polling every 30 seconds for real-time updates
- Optimistic UI updates

### 7. Communities Management (`Communities` Tab - `/src/features/communities/`)
- View communities you've joined (with member counts)
- Create new communities (limit: 5 per user)
- Leave communities
- Books are only discoverable within shared communities

### 8. Settings (`/src/features/settings/`)
- User preferences
- Logout functionality (clears tokens + React Query cache)

## Project Architecture

### Mobile App File Structure
```
src/
├── components/          # Shared UI components (3 files)
│   ├── BookCardStyles.ts
│   ├── SearchInput.tsx
│   └── TabNavigator.tsx
├── contexts/            # React Context providers
│   └── AuthContext.tsx  # Global auth state
├── features/            # Feature modules (main app logic)
│   ├── auth/           # Login & registration
│   ├── books/          # Book search & browsing
│   ├── communities/    # Community management
│   ├── library/        # Personal book library
│   ├── notifications/  # Notification system
│   ├── settings/       # User settings
│   └── shares/         # Book sharing & chat (largest feature)
├── hooks/              # Shared custom hooks
│   └── useDebounceValue.ts
├── lib/                # Core configurations
│   ├── api.ts          # API client (fetch-based)
│   ├── constants.ts    # App constants & enums
│   ├── queryClient.ts  # React Query setup
│   └── queryConfig.ts  # React Query configuration
├── navigation/         # Navigation setup
│   ├── AppNavigator.tsx  # Root navigator (auth check)
│   └── AuthStack.tsx     # Auth flow navigation
├── services/           # Business logic services
│   └── authService.ts  # Token management
├── types/              # Global type definitions
│   └── auth.ts
└── utils/              # Utility functions
    └── imageUtils.ts   # Image URL handling
```

**Total Source Files:** 59 TypeScript/TSX files

**Feature Structure Pattern:**
```
feature/
├── api/          # API calls for this feature
├── components/   # Feature-specific UI components
├── hooks/        # Feature-specific custom hooks
├── types/        # Feature-specific TypeScript types
├── screens/      # Sub-screens (for complex features)
└── services/     # Feature-specific services (e.g., SignalR)
```

### Backend API Structure
```
BookSharingWebAPI/
├── Common/              # Shared constants and enums
├── Data/                # EF Core DbContext and seeding
├── Endpoints/           # Minimal API endpoint definitions
├── Hubs/                # SignalR hubs (ChatHub)
├── Middleware/          # Custom middleware (rate limiting)
├── Migrations/          # EF Core migrations (~26 files)
├── Models/              # Entity models and DTOs
├── Services/            # Business logic layer
├── Validators/          # Business rule validators
└── wwwroot/images/      # Book cover thumbnails
```

### Navigation Structure
```
AppNavigator (checks auth status)
├─ AuthStack (unauthenticated)
│  ├─ Login
│  └─ Register
└─ TabNavigator (authenticated)
   ├─ Search (BookSearchPage)
   ├─ Library (LibraryStack)
   │  ├─ LibraryMain
   │  ├─ BarcodeScanner
   │  ├─ ExternalBookSearch
   │  └─ BookConfirmation
   ├─ Shares (SharesStack) [badge: unread count]
   │  ├─ SharesList
   │  ├─ ShareDetails
   │  ├─ ShareChat
   │  └─ ArchivedShares
   ├─ Communities
   └─ Settings
```

### Configuration Notes
- TypeScript configured with strict mode
- Expo supports iOS, Android, and web platforms
- Edge-to-edge display enabled for Android
- API base URL read from `EXPO_PUBLIC_API_URL` environment variable (see Environment Configuration below)

## Architecture Patterns (Based on Bulletproof React)

### Project Organization
- **Feature-based structure**: Organize code within features folder for scalability
- **Unidirectional architecture**: Code flows from shared → features → app
- **Minimize cross-feature imports**: Keep features independent
- **Co-location principle**: Keep components, hooks, and utilities close to usage

### Recommended Folder Structure (For Scaling)
```
src/
├── components/        # Shared UI components
├── hooks/            # Shared custom hooks
├── lib/              # Third-party library configurations
├── types/            # Global type definitions
├── utils/            # Shared utility functions
├── assets/           # Shared assets
└── features/         # Feature modules
    └── [feature]/
        ├── api/      # Feature-specific API calls
        ├── components/ # Feature-specific components
        ├── hooks/    # Feature-specific hooks
        ├── stores/   # Feature-specific state
        ├── types/    # Feature-specific types
        └── utils/    # Feature-specific utilities
```

### State Management Strategy

**Current Implementation:** Hybrid approach combining multiple strategies

#### 1. React Query (Primary - Server State)
- **Purpose:** Server data caching and synchronization
- **Configuration:**
  - `staleTime: 30 seconds`
  - `gcTime: 5 minutes`
  - Auto-refetch on window focus & reconnect
  - 1 retry on failure
- **Usage Pattern:** Notifications feature uses React Query with:
  - 30-second polling for real-time feel
  - Optimistic updates for instant UI feedback
  - Query invalidation after mutations
  - Multiple derived hooks from same cache

#### 2. React Context (Global App State)
- **Purpose:** Authentication state management
- **Implementation:** `AuthContext` provides:
  - `user`, `isLoading`, `isAuthenticated`
  - `login()`, `register()`, `logout()` methods
  - Automatic token loading on app start
  - React Query cache clearing on logout

#### 3. Custom Hooks with useState (Feature State)
- **Purpose:** Feature-specific state management
- **Pattern:** Most features use custom hooks that encapsulate API calls + local state
- **Example:** `useShares()`, `useUserBooks()`, `useBookSearch()`
- **Benefits:**
  - Simpler API for components
  - Consistent interface across features
  - Easy to add business logic (sorting, filtering)
  - Can be migrated to React Query later if needed

#### 4. SignalR Service (Real-time State)
- **Purpose:** WebSocket connection management
- **Implementation:** Singleton service at `/src/features/shares/services/signalRService.ts`
- **Features:**
  - Event-based message broadcasting
  - Automatic reconnection with exponential backoff (max 5 attempts)
  - Connection status tracking (Disconnected, Connecting, Connected, Reconnecting, Failed)

#### 5. Component State (Local UI State)
- **Use for:** Form inputs, tab selections, loading states, search queries
- **Tools:** `useState`, `useDebounceValue` hook for search inputs

**Future Considerations:**
- Migrate more features to React Query for better caching
- Add React Hook Form for form management
- Implement Zod or Yup for schema validation

### Component Patterns
- Extract distinct UI units into separate components
- Avoid nested rendering functions
- Limit component props and use composition
- Keep styling close to components
- Consider headless component libraries for flexibility

### API Layer

**Current Implementation:** Simple fetch-based REST client

**API Client** (`/src/lib/api.ts`):
- Centralized fetch wrapper with methods: `get`, `post`, `put`, `patch`, `delete`
- Automatic JWT token injection from SecureStore
- Base URL configuration switches based on environment
- Error handling with response parsing

**Authentication Flow:**
1. Tokens stored in Expo SecureStore (`auth_token`, `refresh_token`, `user_data`)
2. Every API call reads token from SecureStore
3. Token added to Authorization header: `Bearer {token}`
4. No automatic token refresh (manual refresh via `/auth/refresh` endpoint)

**API Organization by Feature:**
```
/src/features/{feature}/api/
├── booksApi.ts          # Book search and management
├── userBooksApi.ts      # Library operations
├── sharesApi.ts         # Share lifecycle
├── chatApi.ts           # Chat messages
├── notificationsApi.ts  # Notifications
└── communitiesApi.ts    # Community management
```

**Type Safety:**
- All API functions return typed promises
- Request/response types defined in feature `/types/` folders
- TypeScript strict mode enforced throughout

### Error Handling

**Current Implementation:** Try-catch with local error state

**Pattern:**
```typescript
try {
  await apiCall();
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Default error';
  setError(errorMessage);
  console.error('Context:', err);
}
```

**Feedback Methods:**
- React Native Toast Messages for user notifications
- Local error state in components
- Console logging for debugging


### Testing Strategy

**Current State:** No tests implemented yet

**Recommended Approach:**
- Focus on integration and E2E tests over unit tests
- Test user experience, not implementation details
- Use Testing Library for user-centric testing
- Consider Maestro or Detox for E2E mobile testing
- Use MSW for API mocking during development
## Backend API Reference

**API Base URL:** `http://localhost:5155` (development)

### Main Endpoints

#### Authentication (`/auth`)
- `POST /auth/register` - Create account
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh access token

#### Books (`/books`)
- `GET /books` - List all books
- `GET /books/{id}` - Get book by ID
- `POST /books?addToUser={bool}` - Add new book (downloads thumbnail)
- `GET /books/search?title={}&author={}&includeExternal={bool}` - Search (local + OpenLibrary)
- `GET /books/isbn/{isbn}` - Lookup by ISBN (OpenLibrary)

#### User Books / Library (`/user-books`)
- `GET /user-books/user/{userId}` - Get user's library
- `POST /user-books` - Add book to library (body: bookId)
- `PUT /user-books/{id}/status` - Update availability status
- `DELETE /user-books/{id}` - Remove from library
- `GET /user-books/search?search={query}` - Search accessible books in communities

#### Shares (`/shares`)
- `POST /shares?userbookid={id}` - Request to borrow book
- `GET /shares/borrower` - Get shares as borrower (non-archived)
- `GET /shares/lender` - Get shares as lender (non-archived)
- `GET /shares/borrower/archived` - Get archived borrows
- `GET /shares/lender/archived` - Get archived lends
- `PUT /shares/{id}/status` - Update share status (body: status enum)
- `PUT /shares/{id}/return-date` - Set return date (lender only)
- `POST /shares/{id}/archive` - Archive share (terminal states only)
- `POST /shares/{id}/unarchive` - Unarchive share

#### Chat (`/shares/{shareId}/chat`)
- `GET /shares/{shareId}/chat/messages?page={}&pageSize={}` - Get messages (paginated)
- `POST /shares/{shareId}/chat/messages` - Send message (rate limited)

#### Notifications (`/notifications`)
- `GET /notifications` - Get all unread notifications
- `PATCH /notifications/shares/{shareId}/read` - Mark share notifications read
- `PATCH /notifications/shares/{shareId}/chat/read` - Mark chat notifications read

#### Communities (`/communities`)
- `GET /communities` - List all communities
- `GET /communities/{id}` - Get community details
- `POST /communities?name={name}` - Create community
- `DELETE /communities/{id}` - Delete community

#### Community Users (`/community-users`)
- `POST /community-users/join/{communityId}` - Join community
- `DELETE /community-users/leave/{communityId}` - Leave community
- `GET /community-users/user/{userId}` - Get user's communities (with member counts)
- `GET /community-users/community/{communityId}` - Get community members

### SignalR Hub (`/chathub`)
**Authentication:** JWT via query string `?access_token={token}`

**Client → Server Methods:**
- `JoinShareChat(shareId)` - Subscribe to share's messages
- `LeaveShareChat(shareId)` - Unsubscribe from share
- `SendMessage(shareId, content)` - Send chat message

**Server → Client Events:**
- `ReceiveMessage(messageDto)` - Broadcast new message to group
- `JoinedChat(shareId)` - Join confirmation
- `LeftChat(shareId)` - Leave confirmation
- `Error(message)` - Error notification

## Development Notes

### Running the Full Stack

### Database Seeding
Backend includes DatabaseSeeder with test data:
- 5 users (user-001 to user-005, all password: "password")
- 2 communities with members
- 20+ books across genres
- Sample shares in various states

### Environment Configuration
**Backend:** Uses `.env` file for:
- Database connection string
- JWT signing key (32+ characters)
- PostgreSQL credentials

**Mobile:** Uses `EXPO_PUBLIC_*` environment variables (Expo SDK 49+ native support)
- Copy `.env.example` to `.env.development` and set `EXPO_PUBLIC_API_URL` to your local or ngrok URL
- `.env.development` and `.env.production` are gitignored — never committed
- `src/lib/config.ts` exports `API_BASE_URL` and throws at startup if the variable is missing
- Tests set `EXPO_PUBLIC_API_URL=http://localhost:5155` via `jest.config.js` (no `.env` file needed for tests)