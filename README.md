# Render worker

This is a separate long-running process from the Next.js app. It polls
Supabase for videos with `status = 'rendering'`, assembles the final MP4
with ffmpeg (images + voiceover + burned-in subtitles), uploads it to
Supabase Storage, and flips the row to `status = 'ready'`.

## Why this isn't a serverless API route

ffmpeg encoding a 30-60s vertical video easily takes 20-90+ seconds and
needs local disk for temp files. That's a bad fit for Vercel's serverless
function timeout and ephemeral filesystem. A small always-on worker avoids
both problems and is cheap to run.

## Deploying

Pick one:
- **Railway** - "Deploy from repo", set the start command to `npm run worker`,
  add an `ffmpeg` buildpack or use a Docker image that includes it.
- **Render.com Background Worker** - same idea, native support for
  non-web long-running processes.
- **A small VPS** - `apt-get install ffmpeg`, run `npm run worker` under
  `pm2` or a systemd service so it restarts on crash/reboot.

## Required environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Known limitations to improve later

- Subtitle timing is estimated from word count (~150 wpm), not real
  word-level timestamps. For tighter sync, swap in a forced-aligner (e.g.
  Whisper's word timestamps) fed the same audio file.
- No image transition/motion (Ken Burns effect, crossfades) - currently a
  hard cut between scenes. `ffmpeg zoompan` filter is the natural next step.
- No retry/backoff if ffmpeg crashes mid-job; a crashed job just leaves the
  video in `rendering` forever. Add a timeout + retry counter for production.
