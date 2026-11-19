# Backend gaps found during the redesign (2026-11-19)

Checked against the live API `https://hono.amazecc.com` (status codes only,
no user data) and the `api/` worktree.

| Feature                    | Frontend calls                            | Live API     | api/ repo                                                                                       | Effect                                                                                         |
| -------------------------- | ----------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Club Hub                   | `club-enrollment` (POST), `clubs/details` | 404 both     | `club-enrollment` **removed** in `6d9e70c` ("unused endpoints"); `clubs/details` exists in code | Club Hub shows "isn't available yet"                                                           |
| Event Hub                  | `events/preview`, `events/profile`, …     | 404          | routes exist under `src/app/api/events/*`                                                       | Event Hub shows "isn't available yet"                                                          |
| Social / timetable sharing | `social/*`                                | 401 (exists) | exists                                                                                          | Works when signed in (Amaze ID); 6 frontend tests fail on a teammate's in-progress auth change |

To make the hubs work (needs the backend owner and a deploy, not done here):

1. Deploy the `events/*` and `clubs/details` routes to the hono server.
2. Either restore `club-enrollment` or remove the frontend's call to it
   (`ClubHubTab.fetchEnrollment`); the directory already works without it.
3. The frontend now says "isn't available yet" on 404 instead of "HTTP 404".

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
