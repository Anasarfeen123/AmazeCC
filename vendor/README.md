# vendor/

`amazeui-2.0.0.tgz` is a packed build of AmazeUI's Calm Notebook work
(`feat/calm-notebook` on github.com/Anasarfeen123/AmazeUI), committed so a fresh
clone installs without access to that branch or an npm release.

To update it, in AmazeUI run `npm run build && pnpm pack`, copy the tarball
here, then run `pnpm install` in AmazeCC so the lockfile picks up the new
checksum. Replace this with a normal npm version once AmazeUI 2.0 is published.
