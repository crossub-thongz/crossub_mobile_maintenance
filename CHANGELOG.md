# Changelog

## 2026-06-27

### Added
- Typed contractor-facade read path: `lib/crossub-api/contractor-mappers.ts` (maps `ContractorJobResponseDto` → the `MaintenanceJob` view-model) and `constants/api-enums.ts` mirroring the API's `MaintenanceStatus` / `MaintenanceOrderType` Prisma enums.

### Changed
- Jobs and Dashboard render live data from the typed v1 contractor facade (`/api/v1/contractor/jobs`) instead of the legacy non-v1 `/maintenance/state`; data flows through the existing `ContractorDataProvider` refresh seam so no screen component changed, with graceful fallback to demo seeds on error.
- Accept and Complete now persist to the real facade (`APPROVED → SCHEDULED → COMPLETED`) with optimistic local fallback; quote, decline and invoice stay optimistic-local until their facades land.

### Removed
- Legacy non-v1 maintenance client and mapper now fully unused: `lib/crossub-api/maintenance-client.ts` (`/maintenance/state`, `/maintenance/quotations/*`, completion-evidence/invoice patches), `lib/data/map-jobs.ts`, and the hand-rolled `lib/crossub-api/types.ts` they shared.
