#!/usr/bin/env node
// Read public X/Twitter posts, threads, and user timelines without credentials.
// Endpoint order, fallbacks, and caveats are documented in ../SKILL.md.
//
// Usage:
//   node read-x-tweets.mjs <status-url-or-id>            post + full visible thread (markdown)
//   node read-x-tweets.mjs <status-url-or-id> --json     normalized JSON instead of markdown
//   node read-x-tweets.mjs --single <status-url-or-id>   just the linked post, skip thread
//   node read-x-tweets.mjs --timeline <handle>           ~100 most recent posts by a user
//
// Uses curl for transport so proxy environment variables and custom CA bundles apply.

import { spawnSync } from "node:child_process";
import process from "node:process";

const TIMEOUT_SECONDS = 25;

function curlText(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = spawnSync("curl", ["-sSL", "-m", String(TIMEOUT_SECONDS), url], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (result.status === 0 && result.stdout) return result.stdout;
  }
  return null;
}

function curlJson(url) {
  const text = curlText(url);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseStatusRef(input) {
  if (/^\d+$/.test(input)) return { id: input, handle: null };
  const match = input.match(
    /(?:x\.com|twitter\.com|fxtwitter\.com|vxtwitter\.com|fixupx\.com|nitter\.[a-z.]+)\/(?:i\/web\/|([A-Za-z0-9_]+)\/)?status(?:es)?\/(\d+)/,
  );
  if (!match) return null;
  return { id: match[2], handle: match[1] && match[1] !== "i" ? match[1] : null };
}

function normalizeFx(tweet) {
  return {
    id: tweet.id,
    url: tweet.url,
    author: tweet.author?.name ?? null,
    handle: tweet.author?.screen_name ?? null,
    created_at: tweet.created_at ?? null,
    created_timestamp: tweet.created_timestamp ?? null,
    text: tweet.text ?? "",
    replies: tweet.replies ?? null,
    retweets: tweet.retweets ?? null,
    likes: tweet.likes ?? null,
    views: tweet.views ?? null,
    media: (tweet.media?.all ?? []).map((m) => m.url).filter(Boolean),
    quoted_url: tweet.quote?.url ?? null,
    replying_to_id: tweet.replying_to_status ?? null,
  };
}

function normalizeSyndication(id, tweet) {
  const media = (tweet.mediaDetails ?? []).map((m) => m.media_url_https).filter(Boolean);
  return {
    id,
    url: `https://x.com/${tweet.user?.screen_name ?? "i"}/status/${id}`,
    author: tweet.user?.name ?? null,
    handle: tweet.user?.screen_name ?? null,
    created_at: tweet.created_at ?? null,
    created_timestamp: tweet.created_at ? Date.parse(tweet.created_at) / 1000 : null,
    text: tweet.text ?? "",
    replies: tweet.conversation_count ?? null,
    retweets: null,
    likes: tweet.favorite_count ?? null,
    views: null,
    media,
    quoted_url: null,
    replying_to_id: tweet.in_reply_to_status_id_str ?? null,
  };
}

function fetchPost(id) {
  const fx = curlJson(`https://api.fxtwitter.com/status/${id}`);
  if (fx?.code === 200 && fx.tweet) return normalizeFx(fx.tweet);
  const syn = curlJson(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=a`);
  if (syn?.text !== undefined) return normalizeSyndication(id, syn);
  return null;
}

function fetchConversationIds(handle, id) {
  const html = curlText(`https://x.com/${handle ?? "i"}/status/${id}`);
  if (!html) return [];
  return [...new Set([...html.matchAll(/status\/(\d{15,})/g)].map((m) => m[1]))];
}

function fetchThread(handle, id) {
  const main = fetchPost(id);
  if (!main) return null;

  const ids = new Set(fetchConversationIds(main.handle ?? handle, id));
  ids.add(id);
  // If the linked post is mid-thread, walk parent links up to the root.
  for (let parent = main.replying_to_id, hops = 0; parent && hops < 20; hops++) {
    if (ids.has(parent)) break;
    ids.add(parent);
    parent = fetchPost(parent)?.replying_to_id ?? null;
  }

  const posts = [main];
  for (const otherId of ids) {
    if (otherId === id) continue;
    const post = fetchPost(otherId);
    if (post) posts.push(post);
  }
  posts.sort((a, b) => (a.created_timestamp ?? 0) - (b.created_timestamp ?? 0));
  return { main, posts };
}

function fetchTimeline(handle) {
  const html = curlText(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`);
  if (!html) return null;
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return null;
  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return null;
  }
  const entries = data?.props?.pageProps?.timeline?.entries ?? [];
  return entries
    .map((entry) => entry?.content?.tweet)
    .filter(Boolean)
    .map((tweet) => ({
      id: tweet.id_str,
      url: `https://x.com/${tweet.user?.screen_name ?? handle}/status/${tweet.id_str}`,
      handle: tweet.user?.screen_name ?? handle,
      created_at: tweet.created_at ?? null,
      text: tweet.full_text ?? tweet.text ?? "",
    }));
}

function renderPost(post) {
  const stats = [
    post.likes != null ? `${post.likes} likes` : null,
    post.retweets != null ? `${post.retweets} reposts` : null,
    post.replies != null ? `${post.replies} replies` : null,
    post.views != null ? `${post.views} views` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const lines = [`## ${post.author ?? post.handle} (@${post.handle}) — ${post.created_at}`, "", post.text];
  for (const url of post.media) lines.push("", `media: ${url}`);
  if (post.quoted_url) lines.push("", `quoting: ${post.quoted_url}`);
  lines.push("", `${stats}${stats ? " · " : ""}${post.url}`);
  return lines.join("\n");
}

function failUnreadable() {
  console.error(
    "Could not read this post from any endpoint. It is likely protected, deleted, or login-gated — ask the user to paste the content.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const single = args.includes("--single");
const timelineFlag = args.indexOf("--timeline");
const positional = args.filter((a) => !a.startsWith("--"));

if (timelineFlag !== -1) {
  const handle = (positional[0] ?? "").replace(/^@/, "").replace(/^https?:\/\/(?:x|twitter)\.com\//, "");
  if (!handle) {
    console.error("Usage: read-x-tweets.mjs --timeline <handle>");
    process.exit(2);
  }
  const posts = fetchTimeline(handle);
  if (!posts || posts.length === 0) {
    console.error(
      "Could not read this timeline. The syndication timeline endpoint rate-limits aggressively per IP (HTTP 429) — wait a minute and retry. If it keeps failing, the account is protected, renamed, or gone.",
    );
    process.exit(1);
  }
  if (asJson) {
    console.log(JSON.stringify(posts, null, 2));
  } else {
    console.log(`# Recent posts by @${handle} — ${posts.length} found\n`);
    for (const post of posts) console.log(`## ${post.created_at}\n\n${post.text}\n\n${post.url}\n`);
  }
  process.exit(0);
}

const ref = positional[0] ? parseStatusRef(positional[0]) : null;
if (!ref) {
  console.error("Usage: read-x-tweets.mjs <status-url-or-id> [--json|--single] | --timeline <handle>");
  process.exit(2);
}

if (single) {
  const post = fetchPost(ref.id);
  if (!post) failUnreadable();
  console.log(asJson ? JSON.stringify(post, null, 2) : renderPost(post));
  process.exit(0);
}

const thread = fetchThread(ref.handle, ref.id);
if (!thread) failUnreadable();

if (asJson) {
  console.log(JSON.stringify(thread.posts, null, 2));
} else {
  const threadPosts = thread.posts.filter((p) => p.handle === thread.main.handle);
  const replyPosts = thread.posts.filter((p) => p.handle !== thread.main.handle);
  console.log(`# Thread by @${thread.main.handle} — ${threadPosts.length} post(s), ${replyPosts.length} repl(y/ies)\n`);
  for (const post of threadPosts) console.log(renderPost(post) + "\n");
  if (replyPosts.length > 0) {
    console.log("---\n\n# Replies from others\n");
    for (const post of replyPosts) console.log(renderPost(post) + "\n");
  }
}
