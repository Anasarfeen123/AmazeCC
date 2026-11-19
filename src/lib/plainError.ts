/**
 * Turn an error into something a student can read.
 *
 * Errors thrown inside the app carry developer text ("Failed to fetch",
 * "Server error 500 (club-admin/feed)", "Unexpected token < in JSON",
 * "Invalid profile payload"). Logs and bug reports keep the original
 * (`reportError`); screens show this instead. Messages that are already
 * written for people (no technical markers) pass through unchanged.
 */

const NETWORK = /failed to fetch|networkerror|network request failed|load failed|err_internet|offline|net::/i;
const TIMEOUT = /timed? ?out|timeout|aborted|aborterror/i;
const STATUS = /\b(?:server error|status|http|returned)\D{0,12}(\d{3})\b/i;
const UNREADABLE = /unexpected token|json|payload|invalid response|unexpected shape|did not include|parse/i;
const TECHNICAL =
  /\b(?:fetch|api|http|status|payload|endpoint|undefined|null|typeerror|referenceerror|syntaxerror|cannot read|is not a function|worker|chunk)\b/i;

export function plainErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
  const text = raw.trim();
  if (!text) return fallback;

  // A status code is more specific than "failed to fetch", so it goes first.
  const status = Number(text.match(STATUS)?.[1] ?? 0);
  if (status === 401 || status === 403) return "Your sign-in has expired. Sign in again and retry.";
  if (status === 404) return "This isn't available right now. It may need a server update.";
  if (status === 429) return "Too many tries in a row. Wait a minute and try again.";
  if (status >= 500) return "The server had a problem. Try again in a minute.";

  if (NETWORK.test(text)) return "Couldn't reach the server. Check your internet and try again.";
  if (TIMEOUT.test(text)) return "That took too long. Please try again.";

  if (UNREADABLE.test(text)) return "The server sent something we couldn't read. Try again later.";
  if (TECHNICAL.test(text)) return fallback;
  return text;
}
