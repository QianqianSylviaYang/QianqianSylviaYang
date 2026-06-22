# Portfolio Automation

This profile README is generated from curated `portfolio.json` files in the
private project repositories listed in `portfolio-projects.json`.

## Source of Truth

Each private project repo should include:

```text
portfolio.json
portfolio-assets/
```

The `portfolio.json` file should contain only public-safe information:

- project title and slug
- ready flag
- summary and longer description
- tech stack
- current status
- timeline entries
- screenshots for the newest ready timeline entry

The public profile README shows one section per ready project. It uses the
newest timeline entry where `ready` is not `false`.

## Update Flow

1. Update the private project's `portfolio.json`.
2. Add or replace screenshots referenced by the newest timeline entry.
3. Set `"ready": true` on the project and the timeline entry when it is safe to publish.
4. From the profile repo, run:

```bash
node scripts/update-portfolio.js
```

5. Review the README and copied images before committing.

## Privacy Rule

Do not put private repo links, secrets, unfinished implementation details, or
anything not meant for the public profile into `portfolio.json`.
