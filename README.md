# Smart display

A landscape kiosk for an old Android photo frame. It is built for **Android System WebView 106** (Chrome 106) at **1280×800**, with large type. The shell (`html`, `body`, `#root`) is the full viewport: `100%` and `100vh`, with `--vh` set from `window.innerHeight` on resize because this WebView has no `dvh`. The left rail runs the full height, and each screen’s list fills the space under its header.

The UI started from the Home HQ dashboard in [Wes Bos’s photo-frame-dashboard](https://github.com/wesbos/photo-frame-dashboard), `dashboard/` folder, commit [`0bff55e`](https://github.com/wesbos/photo-frame-dashboard/commit/0bff55ef3fb2a3bfdab05bc8e3bd0c9d69f63189). That project is MIT licensed. The copyright notice and license terms are in [`LICENSE`](LICENSE). Archivo and Instrument Serif are bundled under the SIL Open Font License; see [`dashboard/fonts/OFL.txt`](dashboard/fonts/OFL.txt).

The frame never requests fonts or images from another host. The rail is:

- **Today** — the weekday in large type, the date and live time, up to three events that have not started, and the current weather
- **Calendar** — upcoming events for the next 14 days
- **Weather** — a five-day forecast (today included) and today’s hourly temperatures, or Morning / Afternoon / Evening / Night when the hours would be too small

Shopping is still implemented (`dashboard/js/views/shopping.js` and the `shopping.json` fetch) but hidden. Set `shopping: true` in [`dashboard/js/config.js`](dashboard/js/config.js) to put it back on the rail. Colors live in the theme block at the top of [`dashboard/css/tokens.css`](dashboard/css/tokens.css).

Chores, photos, climate, and the other original tiles are not mounted. Their view modules are still in `dashboard/js/views/` so they can be deleted without touching these screens.

Calendar, weather, and the shopping list come from JSON on the same origin. Each file is fetched with cookies (`credentials: 'same-origin'`), `cache: 'no-store'`, and a `?t=` query so a WebView cannot keep the previous body. If the page URL has a `frame_k` query parameter, that key is sent on every data request and is kept when the rail changes the hash. The timeout is **15 seconds**, with **one retry** (that retry uses a new query). The three files refresh every **5 minutes**. The timer checks `Date.now()` about every 15 seconds, and again when the page becomes visible, so a sleeping WebView still fetches once it wakes if five minutes have passed. When a file parses, it **replaces** the built-in sample. An empty list stays empty and the screen says “No events” or “No items”. The sample is kept only when the response is missing, not JSON, or not the shape below.

A timed event opens one modal 30 minutes before it starts (all-day events never do). The modal lists every event in that window, soonest first, with the title, start time, location, notes, and a countdown (`in 12 min`, then `Now`). A tap anywhere on it dismisses every event it is showing, and so does the Dismiss button at the bottom. Those dismissals are stored in `localStorage` under `frame.dismissedAlerts`, keyed by event id and start time, so a refresh or a reload does not bring them back. A short chime plays when the modal opens or a new event joins the list. If the WebView blocks audio, the failure is ignored.

A small status line at the bottom reads `calendar live` or `calendar sample`, plus the time from the latest fetch. That time prefers `calendar.json` `generated` and is shown in **America/New_York** (so `2026-10-24T14:45:00-04:00` reads 2:45 PM). If `generated` is missing, the line uses the time the file was fetched, also in New York. Weather still on the sample is called out on that same line. Shopping is called out only when that tab is enabled.

If the device clock is still in a year before 2024 (the frame can boot at 1969 until NTP), “today” is taken from the server `generated` timestamp, or the HTTP `Date` header if that field is missing. A clock that is already in 2024 or later is left alone.

## Build

From this repo:

```sh
cd dashboard
npm ci
npm test
npm run build
```

Vite uses `base: '/frame/'` and a JavaScript target of `es2020` / `chrome106`. The CSS target is `chrome61` so the minifier does not emit 4- or 8-digit hex colors, which this WebView rejects. Do not use `oklch()`, `color-mix()`, `:has()`, or CSS nesting.

The static site is written to `dashboard/dist/`.

## Deploy

Copy the **contents** of `dashboard/dist/` into the web server’s `frame/` folder (the directory served at `/frame/`). `index.html` should be reachable at `/frame/` or `/frame/index.html`.

```text
web-root/
  frame/
    index.html
    assets/…
    data/
      calendar.json
      weather.json
      shopping.json
```

`data/` is not part of the build. The dashboard asks for:

- `/frame/data/calendar.json`
- `/frame/data/weather.json`
- `/frame/data/shopping.json`

Examples you can copy are in [`dashboard/examples/`](dashboard/examples/).

## Data files

### `calendar.json`

Feeds Today and Calendar. A parsed file replaces the sample entirely, including when `events` is `[]`. One bad event is skipped. `null` for `location`, `loc`, `notes`, or `travelMinutes` does not reject the event. `people: []` is an event with no person, not an error.

```json
{
  "generated": "2026-10-24T12:00:00",
  "name": "Home",
  "events": [
    {
      "title": "test event",
      "start": "2026-10-24T13:30:00",
      "end": "2026-10-24T14:30:00",
      "allDay": false,
      "people": [],
      "location": null,
      "loc": null,
      "notes": null,
      "travelMinutes": null
    },
    {
      "title": "afternoon event",
      "start": "2026-10-24T15:00:00",
      "end": "2026-10-24T16:00:00",
      "people": [],
      "loc": "Kitchen"
    }
  ]
}
```

Columns are derived from this file. Nothing is hard-coded to a person.

- No `calendars` array, and events have no person (or only one): **one full-width column** with every event. The label is `calendars[0].name`, or the root `name` / `title`, or “Calendar”.
- `calendars` with two or more entries: **one column per calendar**. Events use a `calendar` id. Events with no id sit in the first column so they are not dropped.
- No `calendars` array, but events name two or more people: **one column per person id**. There is no built-in name list.

```json
{
  "calendars": [
    { "id": "home", "name": "Home", "color": "#2255AA" },
    { "id": "work", "name": "Work", "color": "#AA3322" }
  ],
  "events": [
    {
      "title": "Dentist",
      "start": "2026-10-24T13:30:00",
      "end": "2026-10-24T14:30:00",
      "calendar": "home",
      "people": []
    }
  ]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `events` | yes | Array. Empty is valid and clears the calendar. |
| `generated` | no | When the file was written. Shown on the status line. Also used as “now” if the device year is before 2024. |
| `name` or `title` | no | Label for the single column when `calendars` is absent. |
| `calendars` | no | `[{ id, name, color }]`. `color` is `#RGB` or `#RRGGBB`. |
| `id` | no | String. One is generated when omitted. |
| `title` | yes | Non-empty string. An event without one is skipped. |
| `start`, `end` | yes | Local `YYYY-MM-DDTHH:mm:ss` (seconds optional). A trailing `Z` or offset is ignored and the clock digits are kept. `end` must be after `start`. |
| `allDay` | no | `true` for an all-day row. |
| `people` | no | Array of ids. `[]` or `null` means no person. Unknown ids are labels, not looked up in a built-in list. |
| `calendar` | no | Id from `calendars`. |
| `loc` or `location` | no | Place string. `null` is ignored. `loc` wins when both are set. |
| `travel` or `travelMinutes` | no | Minutes. `null` is ignored. |
| `notes` | no | String. `null` is ignored. |

Today lists at most three timed events whose start is still ahead. Events that have already started are left off so later ones can take a slot, and `+N more` appears when more than three remain. An empty or past-only file still says “No events” and does not fall back to the sample. Calendar lists events that overlap the next 14 days, grouped by day, and dims ones that have already ended. If that window is empty, the screen says “No events”.

### `weather.json`

Feeds the weather on Today. This file is an [Open-Meteo](https://open-meteo.com/en/docs) forecast saved as-is, in Fahrenheit and `America/New_York`:

```text
https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FNew_York
```

`current.temperature_2m` and `current.weather_code` are required. A timezone other than `America/New_York`, or a temperature unit other than `°F`, rejects the file and the tile keeps the sample. A full Open-Meteo response is in [`dashboard/examples/data/weather.json`](dashboard/examples/data/weather.json).

Hourly data is optional. Without it, Today still shows the current conditions and Weather hides the hour strip. Either shape is accepted:

Open-Meteo parallel arrays (what the feed sends today):

- `hourly.time` — `YYYY-MM-DDTHH:MM` in `America/New_York`
- `hourly.temperature_2m` — °F
- `hourly.weather_code` — WMO code
- `hourly.precipitation_probability` — 0–100; `null` means 0

Or a list of rows:

```json
"hourly": [
  { "time": "2026-10-25T14:00", "temp": 65, "precip_prob": 10, "weather_code": 1 }
]
```

`time` and `temp` (or `temperature_2m`) are required on each row. `precip_prob` (or `precipitation_probability`) defaults to 0. `weather_code` is optional.

`daily` is optional. When it is present, `time`, `temperature_2m_max`, `temperature_2m_min`, and `weather_code` are parallel arrays (index 0 is today). `precipitation_probability_max` is the day’s rain chance. The Weather tab draws five days starting at index 0: short weekday, an icon from `weather_code`, high and low, and the rain percent when it is 20 or more. Today’s high and low on the Today screen prefer `daily` index 0. A missing or unusable `daily` block leaves the current weather up. Daily temperatures in a unit other than `°F` are ignored the same way.

Today lists at most three timed events whose start is still ahead, and drops events that have already started so later ones can take their place. If more than three remain it shows `+N more`. There is no five-day strip on Today.

### `shopping.json`

Feeds the Shopping view.

```json
{
  "generated": "2026-10-24T08:00:00",
  "items": [
    { "title": "Oat milk", "done": false },
    { "title": "Eggs", "done": true }
  ]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `items` | yes | Array. Empty is valid and shows “No items”. |
| `title` | yes | Non-empty string. `name` is accepted as an alias. |
| `done` | no | `true` or `false`. Anything else is not done. |
| `generated` | no | Shown as the updated time when the calendar file has none. |

A tap checks an item off on the frame only. The next refresh loads the file again.
