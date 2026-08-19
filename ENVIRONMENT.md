# Project Julie — Environment Variables Reference

| Variable | Description | Required | Default Value |
|---|---|---|---|
| `VITE_APP_NAME` | Display name of the application | No | `Julie` |
| `VITE_APP_ENV` | Environment mode (`development` / `production`) | No | `development` |
| `VITE_ENABLE_DEMO_MODE` | Enables sandbox demo bar and ERP timetable shift simulation | No | `true` |
| `VITE_SUPABASE_URL` | Supabase project API endpoint URL | No (uses IndexedDB if absent) | `""` |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anon client key | No | `""` |
| `VITE_AI_PROVIDER` | AI reasoning provider (`gemini`, `openai`, `anthropic`, `local`) | No | `gemini` |
| `VITE_AI_API_KEY` | API key for Gemini / OpenAI | No | `""` |
| `VITE_AI_MODEL` | Target AI model identifier | No | `gemini-1.5-pro` |
| `VITE_STT_PROVIDER` | Speech-to-Text provider (`web_speech`, `whisper`) | No | `web_speech` |
| `VITE_TTS_PROVIDER` | Text-to-Speech provider (`web_speech`, `elevenlabs`) | No | `web_speech` |
| `VITE_ELEVENLABS_API_KEY`| API key for ElevenLabs high-fidelity TTS | No | `""` |
| `VITE_ERP_API_BASE_URL` | Base URL for university college ERP REST API | No | `""` |
| `VITE_ERP_CLIENT_ID` | OAuth Client ID for University ERP portal | No | `""` |
| `VITE_ERP_CLIENT_SECRET` | OAuth Client Secret for University ERP portal | No | `""` |
