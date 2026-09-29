# Security and authorization

- Use your own Jev API key. The toolkit does not include or proxy the maintainer's key. Keep `.env` out of Git.
- Reviewer evidence is limited to the configured phase evidence. Do not include secrets, wallet information, personal data, private logs, or unrelated source files.
- Phase self-reviews are sent to the configured reviewer. Keep evidence concise and use file/test references instead of copying sensitive source contents or raw logs.
- The CLI runs only npm script names listed in the current phase and present in the target project's `package.json`. Those scripts can still perform arbitrary project-defined actions; review the project configuration and scripts before running them.
- Store state and review records under the project directory. Configured storage paths must be relative and cannot use `..` to escape the project root. Avoid placing these paths beneath symlinked directories that point outside the project.
- Gate approval never authorizes a new scope, deployment, publication, transaction signing/broadcast, destructive operation, or other high-impact external action.
- A failed check, unavailable reviewer, low confidence, or high-risk request cannot advance the phase. Do not lower the threshold to manufacture approval.
- The local records contain decisions and check exit statuses. Protect them like other project development records and review them before sharing.
