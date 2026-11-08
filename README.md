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
