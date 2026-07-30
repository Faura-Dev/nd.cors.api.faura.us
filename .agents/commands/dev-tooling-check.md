# Dev Tooling Check

Use this command flow when reviewing a repository's managed developer tooling state.

1. Run `npm exec --yes --package=@faura-dev/dev-tooling@1.12.0 -- dev-tooling doctor` if package access, auth, selected profile, or local setup is uncertain.
2. Run `npm exec --yes --package=@faura-dev/dev-tooling@1.12.0 -- dev-tooling check` for the human-readable committed-state check.
3. Run `npm exec --yes --package=@faura-dev/dev-tooling@1.12.0 -- dev-tooling check --json` when CI output or machine-readable diagnostics are needed.
4. Run `npm exec --yes --package=@faura-dev/dev-tooling@1.12.0 -- dev-tooling diff` to preview pinned-bundle drift.
5. Run `npm exec --yes --package=@faura-dev/dev-tooling@<bundleVersion> -- dev-tooling diff --to <bundleVersion>` before reviewing a target bundle update.
6. Run `npm exec --yes --package=@faura-dev/dev-tooling@<bundleVersion> -- dev-tooling update --to <bundleVersion> --dry-run` before applying updates.

Report conflicts instead of overwriting local repository-owned changes.
