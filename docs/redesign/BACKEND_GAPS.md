# Backend gaps found during the redesign (2026-11-19)

Checked against the live API `https://hono.amazecc.com` (status codes only,
no user data) and the `api/` worktree.

| Feature                    | Frontend calls              | Live API     | api/ repo                                               | Effect                                                                                      |
| -------------------------- | --------------------------- | ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Club Hub                   | `clubs/details`             | 404          | public route exists under `src/app/api/clubs/details`   | Club Hub shows "isn't available yet"                                                        |
| Event Hub                  | `events/*`                  | 404          | routes exist under `src/app/api/events/*`              | Event Hub shows "isn't available yet"                                                        |
| Social / timetable sharing | `social/*`                  | 401 (exists) | exists                                                  | Requires Amaze ID sign-in and VTOP credentials; focused frontend auth and error tests pass |

The frontend no longer calls the removed `club-enrollment` endpoint. Club Hub
uses the public directory only; the VTOP membership list and CLUB/CHAPTER
classification remain unavailable until an API endpoint for them is restored.

To make the hubs work in production (needs the backend owner and a deploy, not
done here):

1. Deploy the `events/*` and `clubs/details` routes to the hono server.
2. Verify the deployed paths and upstream credentials in a production smoke test.
3. The frontend reports unavailable routes clearly instead of presenting a
   404 response as an empty directory.

## Find Classmates: semester choice (user request, 2026-11-19)

User: classmates must be for the selected semester and class only; never
show someone from another year/semester as a classmate; allow choosing the
semester (current / next).

Current state (checked in code):

- Server (`api/src/app/api/social/ffcs-match/route.ts`) already matches only
  within one `semesterId`: it keeps class IDs that start with that semester
  and finds people in the same sections. So cross-semester "classmates"
  cannot happen.
- But only **Winter 2026-27 (CH20262705)** is supported
  (`api/src/lib/ffcsReport.ts` `FFCS_REPORT_FILES`), and the frontend
  hard-codes it (`FriendFinderTab` `UPCOMING_FFCS_SEMESTER`,
  `lib/ffcsClassmates.ts` `classmatesSemester`).

To offer a semester picker:

1. API: add each semester to `FFCS_REPORT_FILES` (e.g. Fall 2026-27
   `CH20262701` -> `fall-2026-2027-final-ffcs.csv`, already in
   `frontend/public/ffcs/`), deploy.
2. Frontend: map those ids in `classmatesSemester`, add a SegmentedControl /
   OptionPicker on Find Classmates (default: the current semester if
   supported, else the upcoming one), and pass it as `semesterId`. Each
   semester's enrollment is separate, so choosing "next year" only ever
   matches next-year sections.
