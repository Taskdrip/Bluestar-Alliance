---
name: Direct messaging architecture
description: How user↔admin direct messages work (not tied to applications) and what was built to support them.
---

Messages in Bluestar are split into two systems:

1. **Application messages** (`messages` table, `/api/messages/:applicationId`) — tied to a specific application ID. Only available for users who have applied.

2. **Direct messages** (`direct_messages` table, `/api/direct-messages`) — email-scoped, no application required. Lets admin message any registered user.

**Why:** Users with zero applications had no way to receive admin messages. The Messages tab showed "No conversations yet" because it was gated behind `applications.length > 0`.

**How to apply:** When admin needs to contact a user who hasn't applied, use `/api/direct-messages/:email`. The user's Messages tab always shows a "Bluestar HR" direct channel at the top, regardless of application count.

**Broadcast:** `/api/push/blast` now always creates in-app notifications for all matched users first, then optionally sends web push if VAPID keys are set. Works without VAPID. Segment `all_registered` targets all `role=user` accounts.

**Admin Chat tab:** Has two modes toggled by button — "Application Threads" (existing per-application chats) and "All Users (Direct DM)" (shows all registered users, search, opens DM thread via direct-messages API).

**Badge count:** Dashboard polls `/api/direct-messages` every 10s and counts unread messages where `senderRole === "admin"` for the Messages tab badge.

**SW:** sw.js v3 — push notification click navigates to `/dashboard` (was `/apply`).
