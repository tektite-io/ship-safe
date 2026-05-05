# Ship Safe Content Agent

The content agent monitors configured web, RSS, Reddit, and Hacker News sources, scores recent items against Ship Safe's product keywords, drafts a source-cited blog post, and can publish to an external CMS webhook when explicitly enabled.

## Endpoint

```bash
curl -H "Authorization: Bearer $CONTENT_AGENT_SECRET" \
  https://www.shipsafecli.com/api/content-agent
```

Draft with custom inputs:

```bash
curl -X POST \
  -H "Authorization: Bearer $CONTENT_AGENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "Ship Safe",
    "mode": "draft",
    "primaryKeywords": ["AI agent security", "MCP security", "supply chain security"]
  }' \
  https://www.shipsafecli.com/api/content-agent
```

Authenticated users can run and review drafts from `/app/content-agent`. That page stores each run and draft in Postgres, then lets the user approve, reject, or move a draft back into review.

The page also includes **Set up Hermes**, which creates or reuses a dedicated `Ship Safe Content Research Agent` using the user's saved AI keys from Settings. Deploy that agent from its agent detail page. Once it has a running deployment, content-agent runs automatically pass its `hermesAgentId` and use Hermes for the draft intelligence step.

Programmatic authenticated runs use:

```bash
POST /api/content-agent/runs
```

## Publishing

The agent does not publish by default. To allow CMS publishing:

```bash
CONTENT_AGENT_SECRET=...
CONTENT_AGENT_ALLOW_AUTOPUBLISH=true
CONTENT_AGENT_CMS_WEBHOOK_URL=https://cms.example.com/webhooks/blog
CONTENT_AGENT_CMS_TOKEN=...
CONTENT_AGENT_PROVIDER=hermes # optional: hermes | unset
CONTENT_AGENT_HERMES_AGENT_ID=... # required when provider is hermes
OPENAI_API_KEY=... # optional, falls back to deterministic drafting without it
CONTENT_AGENT_MODEL=gpt-4.1-mini
```

The CMS webhook receives:

```json
{
  "post": {
    "slug": "example-post",
    "title": "Example Post",
    "description": "SEO summary",
    "date": "2026-05-04",
    "author": "Ship Safe Content Agent",
    "tags": ["AI security"],
    "keywords": ["AI agent security"],
    "content": "Markdown body"
  },
  "sources": []
}
```

## Cron

The existing `/api/cron` route can run the content agent once per day around 09:00 UTC:

```bash
CONTENT_AGENT_CRON_ENABLED=true
```

It still requires the normal `CRON_SECRET` authorization used by the app's cron route.

## Local Blog Integration

Generated posts can be added to `webapp/data/generated-blog-posts.json`. The public blog imports this file and automatically merges generated posts with the hand-written posts.

Approved drafts can be published as GitHub pull requests from the draft detail page. The publisher creates a `codex/content-*` branch, updates `webapp/data/generated-blog-posts.json`, opens a PR, and marks the draft as published with the PR URL.

Optional env vars:

```bash
CONTENT_AGENT_GITHUB_REPO=asamassekou10/ship-safe
CONTENT_AGENT_POSTS_PATH=webapp/data/generated-blog-posts.json
CONTENT_AGENT_BASE_BRANCH=main
```

GitHub authentication uses `CONTENT_AGENT_GITHUB_TOKEN` when configured, then the existing GitHub App installation when available, then the signed-in user's GitHub OAuth token.

Keep human review on for active incidents, named-company claims, legal risk, customer-impact claims, and anything sourced only from social discussion.

## Hermes Provider

Set `CONTENT_AGENT_PROVIDER=hermes` and `CONTENT_AGENT_HERMES_AGENT_ID` to a deployed, running Hermes agent ID. The content agent still owns discovery, storage, approvals, and publishing state; Hermes only performs the intelligence step that turns selected sources into structured blog JSON.

If the Hermes agent is missing, stopped, or returns invalid JSON, the workflow falls back to the OpenAI provider when `OPENAI_API_KEY` is available, then to the deterministic draft generator.

## Database

The content workflow uses:

- `ContentAgentRun` for discovery/drafting run history
- `ContentDraft` for reviewable drafts, source topics, citations, guardrails, and publish status

Run the migration before using the review UI in production:

```bash
npx prisma migrate deploy
```
