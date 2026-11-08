# Grounded AI

A dedicated chat assistant for Grounded 1 and Grounded 2.

## Current prototype

- Cloudflare Worker serves the chat page and `/api/chat` endpoint.
- Cloudflare Workers AI generates replies.
- Game mode starts in Grounded 2 and changes only when the user explicitly says `Switch to Grounded 1` or `Switch to Grounded 2`.
- The selected game mode is stored in the browser.
- The model is instructed not to invent game facts. A verified Grounded knowledge base is a later development stage.

## Deploy

This repository uses the Cloudflare Workers AI binding named `AI`. Deploy the Worker named `grounded` with `wrangler.jsonc` or the Cloudflare dashboard. Do not commit API tokens or secrets.

## API

- `GET /` — chat interface
- `GET /health` — health check
- `POST /api/chat` — accepts `{ "message": "...", "gameMode": "grounded1|grounded2", "history": [] }`

Workers AI model: `@cf/google/gemma-4-26b-a4b-it`.

## Personality and per-device memory

- The Worker sets an anonymous, random, HttpOnly, Secure, SameSite=Lax cookie named `grounded_uid` for each browser.
- The cookie is only a device/browser identifier; it does not identify a real-world person or follow someone across devices.
- Cloudflare KV namespace `GROUNDED_USER_PROFILES` stores that browser's private relationship score, behaviour marks, evolving conversation-style traits, and short interaction summaries.
- The AI evaluates each conversation and can keep or adjust the relationship and personality gradually. A single interaction should not automatically determine the relationship.
- Profiles expire after two years. Clearing browser cookies causes the browser to receive a new identity; the old profile is not automatically linked to it.
- People sharing the same browser profile will share its Grounded AI relationship history. Do not store sensitive personal information in these profiles.
- The relationship and behaviour marks are internal and are not shown in the chat interface.
