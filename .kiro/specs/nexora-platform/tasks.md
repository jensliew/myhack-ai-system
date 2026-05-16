# Implementation Plan: Nexora Platform

## Overview

This plan implements the Nexora AI-powered ecosystem relationship intelligence platform as a Next.js App Router application with TypeScript, Tailwind CSS, shadcn/ui, Zustand, and Firebase (Auth, Firestore, Storage). AI integration uses Gemini API via Next.js Route Handlers with Gemma as fallback. Implementation proceeds from foundational setup through core features to integration and wiring.

## Tasks

- [x] 1. Project setup and configuration
  - [x] 1.1 Initialize Next.js project with TypeScript, Tailwind CSS, and install dependencies
    - Create Next.js App Router project with TypeScript
    - Install dependencies: firebase, @google/genai, zustand, fast-check, vitest, @testing-library/react
    - Configure Tailwind CSS with professional SaaS light-mode theme
    - Initialize shadcn/ui with default light theme configuration
    - Add shadcn/ui components: Button, Card, Input, Label, Select, Badge, Avatar, Tabs, Dialog, Toast, Separator, Sheet, DropdownMenu, Table
    - _Requirements: 14.1, 14.4_

  - [x] 1.2 Create TypeScript type definitions
    - Create `src/types/user.types.ts` with UserDocument, UserRole types
    - Create `src/types/startup.types.ts` with StartupDocument, StartupProfile types
    - Create `src/types/mentor.types.ts` with MentorDocument, MentorProfile types
    - Create `src/types/matching.types.ts` with InterestRecord, RelationshipRecord, MatchingState types
    - Create `src/types/document.types.ts` with DocumentMetadataRecord, DocumentUploadParams types
    - Create `src/types/ai.types.ts` with AIRecommendation, VerificationResult, AIResponse types
    - Define ServiceResult<T> and ServiceError interfaces in `src/types/common.types.ts`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 1.3 Set up project folder structure and utility modules
    - Create folder structure matching design: /app, /components, /features, /services, /firebase, /ai, /hooks, /types, /lib, /stores
    - Create `src/lib/utils.ts` with cn() utility (shadcn pattern) and common helpers
    - Create `src/lib/validators.ts` with registration validation, file size validation functions
    - Create `src/lib/formatters.ts` with date, score, and text formatting utilities
    - _Requirements: 14.4_

  - [ ]* 1.4 Write property tests for registration input validation
    - **Property 1: Registration input validation**
    - Test that passwords < 8 chars OR empty entityId always produce validation errors
    - Test that valid inputs (password ≥ 8, non-empty entityId) pass validation
    - Use fast-check to generate random strings of varying lengths
    - **Validates: Requirements 1.4, 1.5**

  - [ ]* 1.5 Write property test for file size validation
    - **Property 21: File size validation**
    - Test that files > 10MB (10,485,760 bytes) are always rejected
    - Test that files ≤ 10MB always pass size validation
    - Use fast-check to generate random file sizes
    - **Validates: Requirements 10.6**

- [x] 2. Firebase setup and configuration
  - [x] 2.1 Configure Firebase client SDK and collection references
    - Create `src/firebase/config.ts` with Firebase app initialization using environment variables
    - Create `src/firebase/collections.ts` with typed collection references for all 9 collections (users, startups, mentors, mentor_interests, relationships, documents, feedback, ai_recommendations, engagement_history)
    - Create `.env.local.example` with required Firebase and Gemini API key placeholders
    - _Requirements: 12.1_

  - [x] 2.2 Create Firestore security rules and indexes
    - Create `firestore.rules` with role-based access control for all collections
    - Enforce document visibility rules (public vs private documents)
    - Create `firestore.indexes.json` with composite indexes per design specification
    - _Requirements: 3.1, 3.2, 3.3, 10.3, 10.4_

- [x] 3. Authentication system
  - [x] 3.1 Implement Auth service layer
    - Create `src/services/firebase/auth.service.ts` implementing AuthService interface
    - Implement register() — creates Firebase Auth account + Firestore user document with role, entityId, profileStatus 'pending'
    - Implement login() — authenticates with email/password
    - Implement logout() — signs out and clears session
    - Implement getCurrentUser() and onAuthChange() for session state
    - _Requirements: 1.1, 1.3, 2.1, 2.3, 2.4_

  - [x] 3.2 Create Zustand auth store and useAuth hook
    - Create `src/stores/auth.store.ts` with AuthState interface (user, loading, error, setUser, setLoading, setError)
    - Create store provider following Zustand Next.js per-request pattern
    - Create `src/hooks/useAuth.ts` hook wrapping auth store + auth service with onAuthStateChanged listener
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Implement Next.js middleware for route protection
    - Create `src/app/middleware.ts` with auth token verification
    - Redirect unauthenticated users to /login for protected routes
    - Redirect authenticated users with role mismatch to their own dashboard
    - Define public routes (login, register) that bypass auth checks
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.4 Write property tests for route protection
    - **Property 4: Route protection — unauthenticated access**
    - Generate random protected routes, verify all redirect to /login when unauthenticated
    - **Property 5: Route protection — role mismatch**
    - Generate random user/role/route combinations, verify role X accessing role Y route redirects to /{X}
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [ ]* 3.5 Write property test for registration document creation
    - **Property 2: Registration creates correct user document**
    - Generate valid registration inputs, verify created document contains email, role, entityId, profileStatus 'pending', valid createdAt
    - **Validates: Requirements 1.1, 12.2**

  - [x] 3.6 Build registration page with role selection
    - Create `src/app/(auth)/register/page.tsx` with registration form
    - Include fields: email, password, role selection (startup/mentor radio or select), entityId
    - Implement client-side validation (password length, required fields)
    - Display inline error messages for validation failures and auth errors (email already in use)
    - On success, redirect to role-specific dashboard
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 3.7 Build login page
    - Create `src/app/(auth)/login/page.tsx` with login form
    - Include fields: email, password
    - Display error messages for invalid credentials
    - On success, redirect to role-specific dashboard
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 3.8 Write property test for role-based redirect
    - **Property 3: Role-based redirect**
    - Generate random authenticated users with roles, verify redirect path matches /{role}
    - **Validates: Requirements 1.2, 2.2**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Layout and navigation
  - [x] 5.1 Create AppShell layout with sidebar navigation
    - Create `src/components/layout/AppShell.tsx` with sidebar + header + main content area
    - Create `src/components/layout/Sidebar.tsx` with role-based navigation items
    - Create `src/components/layout/Header.tsx` with user info and logout button
    - Implement responsive design: collapsible sidebar on tablet, sheet overlay on mobile
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 5.2 Create dashboard layout with role-based routing
    - Create `src/app/(dashboard)/layout.tsx` wrapping AppShell with auth check
    - Create route groups: `/admin`, `/startup`, `/mentor` with respective page.tsx stubs
    - Wire sidebar navigation items per role (admin: Dashboard, Applications, Analytics, Users; startup: Dashboard, Documents, Mentors, Profile; mentor: Dashboard, Startups, Relationships, Profile)
    - _Requirements: 14.2, 3.1, 3.2, 3.3_

  - [ ]* 5.3 Write property test for sidebar navigation role filtering
    - **Property 23: Sidebar navigation shows role-appropriate items**
    - Generate random roles, verify sidebar only shows items for that role and none from other roles
    - **Validates: Requirements 14.2**

  - [x] 5.4 Create Zustand UI store
    - Create `src/stores/ui.store.ts` with UIState (sidebarOpen, activeFilters, searchQuery)
    - Implement toggleSidebar, setFilters, setSearchQuery actions
    - _Requirements: 14.2, 14.3_

- [x] 6. Mentor dashboard — Startup discovery
  - [x] 6.1 Implement Firestore service for startup queries
    - Create `src/services/firebase/firestore.service.ts` with getApprovedStartups() function
    - Query startups collection filtering by profileStatus 'approved'
    - Support pagination with Firestore cursors
    - _Requirements: 4.1_

  - [x] 6.2 Build StartupCard component
    - Create `src/components/cards/StartupCard.tsx` displaying: name, industry, stage, goals, funding stage, description
    - Include "Interested" button with loading and disabled states
    - Style with shadcn/ui Card + Badge components and Tailwind
    - _Requirements: 4.2, 5.1_

  - [x] 6.3 Implement startup search and filter functionality
    - Create `src/hooks/useStartupDiscovery.ts` hook with search query and filter state
    - Implement client-side filtering: search by name/description, filter by industry, stage, funding stage
    - Support multiple simultaneous filters (AND logic)
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ]* 6.4 Write property tests for startup filtering
    - **Property 6: Startup filtering returns only matching results**
    - Generate random startup sets and filter criteria, verify all results match every active filter
    - **Property 7: Only approved startups displayed**
    - Generate startups with mixed profileStatus, verify only 'approved' appear in results
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.5**

  - [ ]* 6.5 Write property test for StartupCard data completeness
    - **Property 8: Startup card data completeness**
    - Generate valid startup data, verify rendered card includes name, industry, stage, goals, funding stage, description
    - **Validates: Requirements 4.2**

  - [x] 6.6 Build mentor startup discovery page
    - Create `src/app/(dashboard)/mentor/page.tsx` as the mentor dashboard
    - Create `src/app/(dashboard)/mentor/startups/page.tsx` with full startup list, search bar, and filter controls
    - Wire StartupCard list with useStartupDiscovery hook
    - Add filter UI: search input, industry dropdown, stage dropdown, funding stage dropdown
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Mentor interest expression
  - [x] 7.1 Implement interest service
    - Create `src/services/matching/interest.service.ts` with expressInterest() and hasExpressedInterest() functions
    - expressInterest() creates InterestRecord in mentor_interests collection with status 'pending'
    - Simultaneously create engagement_history record with actionType 'interested'
    - hasExpressedInterest() checks if mentor already expressed interest in a startup
    - _Requirements: 5.2, 5.3, 13.1_

  - [x] 7.2 Create useMatching hook and wire interest button
    - Create `src/hooks/useMatching.ts` hook with expressInterest action and interest state tracking
    - Wire "Interested" button in StartupCard to call interest service
    - Disable button when interest already expressed (check on mount)
    - Handle errors with toast notification and retry capability
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 7.3 Write property tests for interest expression
    - **Property 9: Interest expression creates valid records**
    - Generate valid mentor/startup IDs, verify InterestRecord contains mentorId, startupId, status 'pending', valid createdAt, AND engagement_history record created
    - **Property 10: Interest expression is idempotent in UI**
    - Generate mentor-startup pairs with existing InterestRecord, verify button is disabled
    - **Validates: Requirements 5.2, 5.3, 12.3, 13.1**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. AI integration — Recommendations engine
  - [x] 9.1 Configure AI module and prompt templates
    - Create `src/ai/config.ts` with Gemini model configuration and timeout settings
    - Create `src/ai/prompts.ts` with system prompts for mentor recommendation generation
    - Define structured output format for recommendations (JSON schema with mentorId, score, reasoning)
    - _Requirements: 6.1, 6.5_

  - [x] 9.2 Implement AI recommendations Route Handler
    - Create `src/app/api/ai/recommendations/route.ts` as POST endpoint
    - Fetch startup profile, mentor profiles, and engagement history from Firestore (using Firebase Admin or service account)
    - Build prompt with startup context, mentor pool, and historical engagement data
    - Call Gemini API with structured JSON output using @google/genai SDK
    - Implement Gemma fallback on Gemini failure (timeout 10s)
    - Store generated recommendations in ai_recommendations collection
    - Return recommendations to client
    - _Requirements: 6.1, 6.4, 6.5, 7.5, 13.4_

  - [x] 9.3 Implement AI service client and fallback logic
    - Create `src/services/ai/recommendations.service.ts` calling the Route Handler
    - Create `src/services/ai/fallback.service.ts` with Gemma fallback implementation
    - Implement retry logic with exponential backoff (max 3 attempts)
    - Handle graceful degradation when both providers fail
    - _Requirements: 6.1, 6.4_

  - [x] 9.4 Create useRecommendations hook
    - Create `src/hooks/useRecommendations.ts` hook fetching AI recommendations for a startup
    - Manage loading, error, and data states
    - Support manual refresh/retry
    - _Requirements: 6.1, 6.3_

  - [ ]* 9.5 Write property test for AI recommendation storage
    - **Property 12: AI recommendation storage completeness**
    - Generate recommendation data, verify stored document contains startupId, mentorId, compatibilityScore (0-100), reasoning (non-empty), modelUsed ('gemini' or 'gemma'), status 'pending', valid createdAt
    - **Validates: Requirements 6.5, 12.6**

- [x] 10. Startup dashboard — AI suggestions and interested mentors
  - [x] 10.1 Build MentorCard component
    - Create `src/components/cards/MentorCard.tsx` displaying: mentor name, expertise, industry specialization, compatibility score, mentorship success rate, AI reasoning summary
    - Include "Accept" and "Reject" action buttons
    - Style with shadcn/ui Card + Badge components, show compatibility score as a visual indicator
    - _Requirements: 6.2, 7.1_

  - [ ]* 10.2 Write property test for MentorCard data completeness
    - **Property 11: Mentor card data completeness**
    - Generate valid AI recommendation data, verify rendered card includes mentor name, expertise, industry specialization, compatibility score, success rate, AI reasoning
    - **Validates: Requirements 6.2**

  - [x] 10.3 Implement matching service (accept/reject)
    - Create `src/services/matching/matching.service.ts` with acceptMentor() and rejectMentor() functions
    - acceptMentor() creates RelationshipRecord with status 'active', source ('ai_recommendation' or 'mentor_interest'), records engagement_history with actionType 'accepted'
    - rejectMentor() updates source record status to 'rejected', records engagement_history with actionType 'rejected'
    - Implement getInterestedMentors() querying mentor_interests by startupId ordered by createdAt DESC
    - _Requirements: 7.2, 7.3, 7.4, 13.2_

  - [ ]* 10.4 Write property tests for accept/reject workflow
    - **Property 13: Acceptance creates valid relationship**
    - Generate valid acceptance actions, verify RelationshipRecord contains startupId, mentorId, status 'active', correct source, valid createdAt, AND engagement_history record created
    - **Property 14: Rejection records decision correctly**
    - Generate valid rejection actions, verify source record status updated to 'rejected' AND engagement_history record created with actionType 'rejected'
    - **Property 15: Accepted mentor removal from pending lists**
    - Generate accepted mentor, verify they no longer appear in AI recommendations or interested mentors lists
    - **Validates: Requirements 7.2, 7.3, 7.4, 12.4, 13.2**

  - [x] 10.5 Build startup dashboard page with both sections
    - Create `src/app/(dashboard)/startup/page.tsx` with two sections:
      - Section 1 (top): "AI Suggested Mentors" — displays MentorCards from AI recommendations
      - Section 2 (below): "Mentors Interested" — displays MentorCards from interest records
    - Wire Accept/Reject buttons to matching service
    - Remove accepted/rejected mentors from lists immediately (optimistic UI)
    - Show empty states when no recommendations or no interested mentors
    - _Requirements: 6.3, 7.1, 7.4, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 10.6 Write property test for interested mentors ordering
    - **Property 16: Interested mentors ordered by recency**
    - Generate random InterestRecords with timestamps, verify display order is descending by createdAt
    - **Validates: Requirements 8.3**

  - [x] 10.7 Create Zustand matching store
    - Create `src/stores/matching.store.ts` with MatchingState (recommendations, interestedMentors, loading)
    - Implement setRecommendations, setInterestedMentors, removeFromList actions
    - _Requirements: 7.4, 8.1_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Admin dashboard — Verification and analytics
  - [x] 12.1 Implement AI verification Route Handler
    - Create `src/app/api/ai/verification/route.ts` as POST endpoint
    - Accept application ID and document metadata
    - Call Gemini API to extract company/mentor information from documents
    - Generate verification summary with recommendation (approve/reject/pending review)
    - Implement Gemma fallback on Gemini failure
    - _Requirements: 9.1, 9.2, 9.3, 9.6_

  - [x] 12.2 Implement verification service client
    - Create `src/services/ai/verification.service.ts` calling the verification Route Handler
    - Implement analyzeApplication() and getVerificationSummary() functions
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 12.3 Write property test for verification result validity
    - **Property 17: Verification result validity**
    - Generate verification results, verify recommendation is exactly 'approve', 'reject', or 'pending review', AND summary contains non-empty company/mentor info and completeness assessment
    - **Validates: Requirements 9.2, 9.3**

  - [x] 12.4 Build admin applications queue page
    - Create `src/app/(dashboard)/admin/applications/page.tsx` with pending applications list
    - Display AI verification summary and recommendation for each application
    - Include "Approve" and "Reject" buttons per application
    - On admin decision, update user profileStatus in Firestore and record decision with admin userId and timestamp
    - _Requirements: 9.4, 9.5_

  - [ ]* 12.5 Write property test for admin decision workflow
    - **Property 18: Admin decision updates status and records action**
    - Generate admin approval/rejection decisions, verify user profileStatus updated AND decision recorded with admin userId and timestamp
    - **Validates: Requirements 9.5**

  - [x] 12.6 Build admin analytics dashboard
    - Create `src/app/(dashboard)/admin/page.tsx` as admin dashboard home with overview metrics
    - Create `src/app/(dashboard)/admin/analytics/page.tsx` with detailed analytics
    - Display ecosystem metrics: total startups, total mentors, new registrations over time
    - Display active mentorship count and engagement metrics
    - Use chart components (bar chart, line chart) and metric cards
    - Create `src/components/charts/` with MetricCard, BarChart, LineChart components
    - Create `src/hooks/useAnalytics.ts` hook fetching aggregated data from Firestore
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 12.7 Build admin user management page
    - Create `src/app/(dashboard)/admin/users/page.tsx` with user listing table
    - Display user email, role, profileStatus, createdAt
    - Support filtering by role and status
    - _Requirements: 9.5_

- [x] 13. Document management
  - [x] 13.1 Implement document service
    - Create `src/services/documents/document.service.ts` with uploadDocument(), getDocuments(), deleteDocument()
    - uploadDocument() validates file size (≤ 10MB), uploads to Firebase Storage at `documents/{startupId}/{documentId}/{filename}`, creates metadata record in Firestore
    - getDocuments() queries documents collection by startupId with optional visibility filter
    - deleteDocument() removes file from Storage and metadata from Firestore
    - _Requirements: 10.1, 10.2, 10.6_

  - [x] 13.2 Create useDocuments hook
    - Create `src/hooks/useDocuments.ts` hook managing document upload, listing, and deletion
    - Handle upload progress, error states, and retry logic
    - _Requirements: 10.1, 10.5_

  - [x] 13.3 Build document upload and listing page
    - Create `src/app/(dashboard)/startup/documents/page.tsx` with upload form and document list
    - Upload form: file input, document type selector (meeting-minutes, monthly-report, general), visibility toggle (public/private)
    - Document list: display file name, type, visibility badge, upload date, delete button
    - Validate file size client-side before upload, show error for files > 10MB
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 13.4 Write property tests for document management
    - **Property 19: Document metadata completeness**
    - Generate successful uploads, verify metadata contains valid fileUrl, createdAt, documentType, visibility, startupId, uploadedBy
    - **Property 20: Document visibility enforcement**
    - Generate documents with public/private visibility and various user roles, verify access granted/denied correctly
    - **Validates: Requirements 10.1, 10.3, 10.4**

- [x] 14. Behavioral learning and engagement tracking
  - [x] 14.1 Implement engagement history service
    - Create engagement tracking utility in `src/services/firebase/engagement.service.ts`
    - Implement recordEngagement() creating engagement_history documents with userId, actionType, targetId, targetType, createdAt
    - Support action types: 'interested', 'accepted', 'rejected', 'viewed'
    - Wire into existing services: interest expression, accept/reject, profile views
    - _Requirements: 12.5, 13.1, 13.2, 13.3_

  - [ ]* 14.2 Write property test for engagement history records
    - **Property 22: Engagement history records contain required fields**
    - Generate engagement records, verify each contains valid userId, actionType in ['interested', 'accepted', 'rejected', 'viewed'], non-empty targetId, targetType, valid createdAt
    - **Validates: Requirements 12.5, 13.3**

  - [x] 14.3 Wire engagement tracking across all interaction points
    - Add 'viewed' tracking when startup views mentor profile or mentor views startup profile
    - Verify 'interested' tracking fires on mentor interest expression
    - Verify 'accepted'/'rejected' tracking fires on startup decisions
    - Ensure AI recommendation engine queries engagement_history for personalization
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 15. Profile management pages
  - [x] 15.1 Build startup profile page
    - Create `src/app/(dashboard)/startup/profile/page.tsx` with editable startup profile form
    - Fields: name, industry, stage, funding stage, goals, description, team size, location, website
    - Save updates to startups collection in Firestore
    - _Requirements: 6.1_

  - [x] 15.2 Build mentor profile page
    - Create `src/app/(dashboard)/mentor/profile/page.tsx` with editable mentor profile form
    - Fields: name, expertise (multi-select), industry specialization (multi-select), experience, availability, bio, location
    - Save updates to mentors collection in Firestore
    - _Requirements: 5.1_

  - [x] 15.3 Build active relationships pages
    - Create `src/app/(dashboard)/startup/mentors/page.tsx` showing active mentor relationships for the startup
    - Create `src/app/(dashboard)/mentor/relationships/page.tsx` showing active startup relationships for the mentor
    - Display relationship status, engagement score, meeting count, last interaction
    - _Requirements: 12.4_

- [x] 16. Integration and final wiring
  - [x] 16.1 Wire error boundaries and toast notifications
    - Add React Error Boundaries around major dashboard sections
    - Implement global toast notification system using shadcn/ui Toast
    - Wire all service errors to display user-friendly toast messages with retry options
    - _Requirements: 5.4, 10.5_

  - [x] 16.2 Add loading states and empty states across all pages
    - Add skeleton loaders for card lists and data tables
    - Add empty state components with helpful messages for: no recommendations, no interested mentors, no documents, no applications
    - _Requirements: 8.4_

  - [x] 16.3 Ensure responsive layout across breakpoints
    - Test and fix layout at 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (large desktop)
    - Ensure sidebar collapses properly on smaller screens
    - Verify card grids reflow correctly
    - _Requirements: 14.3_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between major feature groups
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The AI Route Handlers protect the Gemini API key from client exposure
- All Firestore operations use the client SDK with security rules for access control
- Zustand stores follow the per-request pattern for Next.js SSR compatibility
