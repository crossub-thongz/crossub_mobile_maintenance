# Changelog

## 2026-06-28

### Added
- Real completion-photo upload (Phase C of the maintenance zero-mock plan): the completion-evidence screen now uploads each selected file for real (base64 → R2) via a new `uploadJobPhoto` client helper (`POST /api/v1/contractor/jobs/{jobId}/photos/upload`) and a `ContractorDataProvider.uploadJobPhotos(jobId, files)` seam (reads each `File` with the existing `fileToBase64`, posts it, and the server appends the stored URL to the job's result photos) — offline it stays a no-op, matching the old mock upload.
- Live Notifications (Phase B of the maintenance zero-mock plan): `Notifications` now reads the contractor's real feed from the v1 facade (`GET /api/v1/contractor/notifications`) via new `lib/crossub-api/contractor-client.ts` helpers (`fetchNotifications`/`markNotificationRead`/`markAllNotificationsRead`), a `mapContractorNotifications` mapper (`ContractorNotificationResponseDto` → the `ContractorNotification` view-model, `type` lowercased), and a `CONTRACTOR_NOTIFICATION_TYPE` mirror + FE map in `constants/api-enums.ts`.
- Live Communication Hub (Phase A of the maintenance zero-mock plan): `Messages` now reads the contractor's real threads from the v1 facade (`GET /api/v1/contractor/messages`) via new `lib/crossub-api/contractor-client.ts` helpers (`fetchMessages`/`createMessageThread`/`replyToThread`), a `mapContractorMessageThreads` mapper (`ContractorMessageThreadResponseDto` → the `MessageThread` view-model), and `CommUserType`/`CommChannel` mirrors + role/channel maps in `constants/api-enums.ts`.

### Changed
- The job-completion flow now uploads the selected completion photos to the facade before marking the job complete (was a discarded mock file picker); upload failures surface a toast and block completion so evidence is never silently lost.
- `ContractorDataProvider` loads notifications live (same per-domain `Promise.allSettled`, falling back to `DEMO_NOTIFICATIONS`); the Notifications screen gained a "Mark all read" control and marks a notification read on open, both persisting to the facade (`PATCH /contractor/notifications/{id}/read`, `POST /contractor/notifications/read-all`) with optimistic local flips.
- `ContractorDataProvider` loads messages live (per-domain `Promise.allSettled`, falling back to `DEMO_MESSAGES` on error) and the message-detail reply box now persists to the facade (`POST /api/v1/contractor/messages/{id}/reply`) with optimistic local fallback — no screen restructure.

## 2026-06-27

### Added
- Typed contractor-facade read path: `lib/crossub-api/contractor-mappers.ts` (maps `ContractorJobResponseDto` → the `MaintenanceJob` view-model) and `constants/api-enums.ts` mirroring the API's `MaintenanceStatus` / `MaintenanceOrderType` Prisma enums.

### Changed
- Jobs and Dashboard render live data from the typed v1 contractor facade (`/api/v1/contractor/jobs`) instead of the legacy non-v1 `/maintenance/state`; data flows through the existing `ContractorDataProvider` refresh seam so no screen component changed, with graceful fallback to demo seeds on error.
- Accept and Complete now persist to the real facade (`APPROVED → SCHEDULED → COMPLETED`) with optimistic local fallback; quote, decline and invoice stay optimistic-local until their facades land.

### Removed
- Legacy non-v1 maintenance client and mapper now fully unused: `lib/crossub-api/maintenance-client.ts` (`/maintenance/state`, `/maintenance/quotations/*`, completion-evidence/invoice patches), `lib/data/map-jobs.ts`, and the hand-rolled `lib/crossub-api/types.ts` they shared.
