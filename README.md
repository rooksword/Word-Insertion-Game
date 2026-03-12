# Word Insertion Game

Insert random words into your flow—pick by frequency and part of speech.

- **Word types:** Common (100–500), Uncommon (500–3000), Rare (3000+) from a frequency list
- **Parts of speech:** Filter by Penn tags (nouns, verbs, adjectives, etc.) with optional solo buttons
- **Timer:** Set interval between words; run infinitely or for a set number of rounds
- **Minimum word length** and **speech** (browser TTS) supported

## Run locally

Serve the folder over HTTP so the word list can load (e.g. `python -m http.server 8000` or your editor’s live server). Open `index.html` via that URL (opening the file directly may block `fetch` for the word list).

## Word list

Uses `google-10000-english-no-swears.txt`. Edit that file to add or remove words.
