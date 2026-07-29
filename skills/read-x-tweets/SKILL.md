---
name: read-x-tweets
description: Read public X/Twitter posts, full threads, and recent user timelines without credentials or API keys. Use when given an x.com or twitter.com status link, asked what a tweet or thread says, or asked to check an account's recent public posts. Read-only and public-only — not for posting, DMs, search, or bulk historical pulls.
---

# Read X Tweets

Public X posts are readable without any authentication. Do not assume X is fully login-walled and
give up, and do not ask the user to paste a tweet before trying the recipe below. No API keys,
cookies, or browser automation are required for public content.

## Preferred path: the bundled script

When shell access is available, run the deterministic reader — it encodes the whole fallback chain
and thread reconstruction:

```
node scripts/read-x-tweets.mjs <status-url-or-id>          # post + full visible thread (markdown)
node scripts/read-x-tweets.mjs <status-url-or-id> --json   # normalized JSON instead
node scripts/read-x-tweets.mjs --single <status-url-or-id> # just the one post, skip thread
node scripts/read-x-tweets.mjs --timeline <handle>         # ~100 most recent posts by a user
```

Paths are relative to this skill directory. The script needs `curl` on PATH (it honors proxy
environment variables and custom CA bundles, which plain `fetch` in Node 22 does not).

## Manual recipe (no script, or verifying its output)

All endpoints below are unauthenticated GETs. Ordered by usefulness:

1. **fxtwitter JSON API** — `https://api.fxtwitter.com/status/{id}`
   Richest single-post source: text, author, timestamps, like/repost/reply/view counts, media URLs
   (`pbs.twimg.com`, append `?name=orig` for full resolution), quoted post, and
   `replying_to_status` (the parent id, for walking a reply chain upward). A handle in the path is
   accepted but optional. `api.vxtwitter.com/{handle}/status/{id}` is an equivalent independent
   mirror with the same no-auth model — use it if fxtwitter is down.
2. **Status page HTML** — `https://x.com/{handle}/status/{id}` (any handle works; it redirects)
   The server-rendered page contains the post text in the `og:description` meta tag, and — the key
   to threads — every status id in the visible conversation embedded in the markup. Extract unique
   matches of `status/(\d{15,})`, then fetch each id via endpoint 1 to reconstruct the thread.
3. **Syndication CDN** — `https://cdn.syndication.twimg.com/tweet-result?id={id}&token=a`
   X's own embed backend. Single-post JSON (`text`, `user`, `created_at`, counts). Any short token
   value is currently accepted.
4. **oEmbed** — `https://publish.twitter.com/oembed?url={full-status-url}` (follow redirects)
   Official and stable, but text-only inside an HTML blockquote. Last-resort text extraction.
5. **User timeline** — `https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}`
   Returns a page whose `__NEXT_DATA__` JSON script tag holds roughly the 100 most recent posts
   (`props.pageProps.timeline.entries[].content.tweet` with `id_str`, `created_at`, `full_text`).
   Use it for "what has this account posted lately" and for finding thread continuations. It
   rate-limits aggressively per IP (HTTP 429 after a couple of requests) — wait a minute between
   calls and treat 429 as transient, not as a login wall.

## Thread reconstruction

To read a full thread from one status link: fetch the status page HTML (endpoint 2), extract all
embedded status ids, fetch each via endpoint 1, then sort by timestamp. Posts by the linked
author form the thread; other authors are replies. If the linked post is mid-thread, also walk
`replying_to_status` upward to the root. This returns the visible conversation — long reply tails
behind "show more" are not included.

## Fallback chain

On an empty result or timeout: retry once, then move to the next endpoint. If every endpoint
returns nothing, the post is protected, deleted, or age/login-gated — say so and ask the user to
paste the content. Do not present a guess as the post's text.

## Media

Image URLs arrive in the JSON (endpoint 1 and 3). When image content matters, download and view
them with vision rather than relying on alt text.

## Caveats

- **Public posts only.** Protected accounts and logged-in-only content are out of reach; that is a
  hard wall, not a retry-able failure.
- **fxtwitter and vxtwitter are third-party mirrors.** They can rate-limit or disappear; the
  chain degrades to X-owned endpoints 2-4.
- **Read-only.** Engagement counts are approximate snapshots. For posting, DMs, search, or bulk
  historical pulls, use the official X API or dedicated tooling instead — this skill is not that.
