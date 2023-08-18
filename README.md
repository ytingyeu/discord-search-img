# discord-search-img

Search and post an image on discord channel

# Discord command

`<search_term>.jpg` - searches and returns a static image from Google
`<search_term>.gif` - searches and returns a gif image from Google
`<search_term>.duckjpg` - searches and returns a gif image from DuckDuckGo
`<search_term>.duckgif` - searches and returns a gif image from DuckDuckGo

Setting of search safety are disabled for both search engines.

# Development

Requirements
```
npm install -g cross-env
npm install -g babel-cli
npm install -g pm2
```

Copy `.env.example` and rename it to `.env`
Add you keys for Google Custom Search Engine API and Discord bot.

Build then run locally or host it with `pm2`

- `npm run build`: build project
- `npm run dev`: start bot locally with dev mode
- `npm run host`: host bot with pm2
