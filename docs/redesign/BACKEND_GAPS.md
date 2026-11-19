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
