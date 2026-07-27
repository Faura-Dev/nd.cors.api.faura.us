# Developer Tooling Instructions

- Treat `.faura-dev-tooling.json` as the committed state for the selected tooling bundle and profile.
- Preserve repository-owned source, runtime configuration, deployment behavior, package-manager choice, editor preferences, and secrets unless the selected profile explicitly owns that behavior.
- Use `npm exec --yes --package=@faura-dev/dev-tooling@1.12.0 -- dev-tooling doctor` when package access, auth, or local setup is uncertain.
- Use `npm exec --yes --package=@faura-dev/dev-tooling@1.12.0 -- dev-tooling check` before changing managed tooling, and use `npm exec --yes --package=@faura-dev/dev-tooling@1.12.0 -- dev-tooling diff` to review planned changes.
- Use `npm exec --yes --package=@faura-dev/dev-tooling@<bundleVersion> -- dev-tooling update --to <bundleVersion> --dry-run` before applying bundle updates.
- Do not commit token-bearing `.npmrc` files, PATs, package tokens, hosted secrets, generated observability output, or local runtime artifacts.
