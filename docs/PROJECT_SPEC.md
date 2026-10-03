# UP TamHa — Project Specification

UP TamHa is a lost-and-found centre for University of Phayao. It replaces short-lived social-media posts with structured reports that can be filtered by building, room, category, date, and status.

## Core journey

1. A student creates an account with a nickname, unique username, and password, then can optionally upload a profile image.
2. The student selects a teaching building or campus area such as the library, canteen, university bus, road, outdoor space, dormitory, sports area, or Ang Luang, followed by a suggested area or a custom room/location.
3. Other students search and filter the public feed.
4. A potential owner submits private proof through a claim request.
5. The claimant and reporter can reply privately before the reporter approves or rejects the claim and marks the item as returned.

## MVP scope

- Responsive public report feed and item detail pages
- Lightweight account with nickname, username, password, persistent session, and optional avatar
- Create, edit, close, and review reports
- Lost/found, building, room, category, date, and status filters
- Up to three JPG, PNG, or WebP images per report
- Private claim proof, threaded replies, and approval workflow
- Personal dashboard for reports and claims
- In-memory demo mode and Azure SQL production mode

## Out of scope

- AI matching
- Real-time push notifications (claim replies refresh with the page)
- Maps and indoor positioning
- Email or SMS delivery
- Payments, points, and gamification

## Acceptance criteria

- `npm run check` passes from the repository root.
- The application works locally without an Azure subscription.
- No credentials are committed to source control.
- Public responses never include private contact notes or claim proof.
- An authenticated session is required to modify a report or review its claims; legacy profile IDs are temporary migration credentials only.

