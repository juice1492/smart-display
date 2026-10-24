# Smart display

A landscape kiosk dashboard for an old Android photo frame. It is built for **Android System WebView 106** (Chrome 106) at about **1280×800**.

The UI is the Home HQ dashboard from [Wes Bos’s photo-frame-dashboard](https://github.com/wesbos/photo-frame-dashboard), `dashboard/` folder, commit [`0bff55e`](https://github.com/wesbos/photo-frame-dashboard/commit/0bff55ef3fb2a3bfdab05bc8e3bd0c9d69f63189). That project is MIT licensed. The copyright notice and license terms are in [`LICENSE`](LICENSE). Archivo and Instrument Serif are bundled under the SIL Open Font License; see [`dashboard/fonts/OFL.txt`](dashboard/fonts/OFL.txt).

The frame never requests fonts or images from another host. Calendar, chores, indoor climate, and the weather tile come from JSON files on the same origin, and fall back to the built-in sample when a file is missing or invalid. Photos come from a local album.

## Build

From this repo:

```sh
cd dashboard
npm ci
npm run build
```

Vite is configured with `base: '/frame/'` and a JavaScript target of `es2020` / `chrome106`. The CSS target is older on purpose (`chrome61`) so the minifier does not emit 4- or 8-digit hex colors, which this WebView rejects.

The static site is written to `dashboard/dist/`.

## Deploy

Copy the **contents** of `dashboard/dist/` into the web server’s `frame/` folder (the directory that is served at `/frame/`). `index.html` should be reachable at `/frame/` or `/frame/index.html`.

```text
web-root/
  frame/
    index.html
    assets/…
    icon-192.png
    icon-512.png
    manifest.webmanifest
    data/
      calendar.json
      reminders.json
      climate.json
      weather.json
    photos/
      manifest.json
      harbour.jpg
```

`data/` and `photos/` are not part of the build. Place them next to the built files on the server. The dashboard asks for these URLs:

- `/frame/data/calendar.json`
- `/frame/data/reminders.json`
- `/frame/data/climate.json`
- `/frame/data/weather.json`
- `/frame/photos/manifest.json`

Each data file is loaded with a short timeout. If the response is missing, not JSON, or does not match the schema below, that part of the screen keeps the built-in sample. Calendar events in the sample are generated relative to today. The weather sample is a fixed mock day, used only when `weather.json` is missing or invalid. A photo manifest that is missing, empty, or has no usable entries shows a neutral placeholder instead of a sample album. Image files named by the manifest are loaded only from `/frame/photos/`.

Examples you can copy onto the server are in [`dashboard/examples/`](dashboard/examples/).

## Data files

People ids used by events and reminders:

| id | Name on screen |
| --- | --- |
| `alex` | Wes |
| `jordan` | Claudia |
| `maya` | Buzzsaw |
| `otto` | Skidmark |
| `any` | Anyone (reminders only) |

Unknown people ids are drawn as the family chip.

### `calendar.json`

Feeds the Today and Calendar views.

```json
{
  "events": [
    {
      "id": "piano",
      "title": "Piano lesson",
      "start": "2026-10-24T15:45:00",
      "end": "2026-10-24T16:30:00",
      "people": ["otto"],
      "loc": "Ms. Park's Studio",
      "travel": 12,
      "notes": "Bring the blue theory book."
    },
    {
      "id": "pajama",
      "title": "Pajama Day at school",
      "allDay": true,
      "start": "2026-10-24T00:00:00",
      "end": "2026-10-25T00:00:00",
      "people": ["otto"]
    }
  ]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `events` | yes | Array. An empty array is valid and clears the calendar. |
| `id` | no | String. One is generated when omitted. |
| `title` | yes | Non-empty string. |
| `start`, `end` | yes | Local date-time `YYYY-MM-DDTHH:mm:ss` (seconds optional). A date by itself (`YYYY-MM-DD`) is local midnight. No timezone suffix. `end` must be after `start`. |
| `allDay` | no | `true` for an all-day bar. Use midnight-to-midnight, and make `end` the morning after the last day (exclusive). |
| `people` | no | Array of people ids. Omit it, or use `[]`, for an unassigned event. |
| `loc` | no | Place string. |
| `travel` | no | Minutes of travel before `start`. The home screen uses this for “leave by”. |
| `notes` | no | String shown in the event sheet. |

One bad event rejects the whole file, and the sample calendar is kept.

### `reminders.json`

Feeds the Chores view and the chore rings on Today. Routines are `morning` (midnight–11:00), `after` (11:00–17:00), and `evening` (17:00–midnight). The rings follow the clock.

```json
{
  "reminders": [
    {
      "id": "bed-maya",
      "title": "Make bed",
      "who": "maya",
      "routine": "morning",
      "emoji": "🛏️",
      "stars": 1,
      "done": true
    },
    {
      "id": "recycling",
      "title": "Take out recycling",
      "who": "alex",
      "routine": "after",
      "emoji": "♻️",
      "stars": 0,
      "done": false,
      "overdue": true
    }
  ],
  "stars": { "maya": 42, "otto": 57 },
  "week": {
    "maya": [1, 1, 0, 1, 1, 0, 1],
    "otto": [1, 0, 1, 1, 1, 1, 0]
  }
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `reminders` | yes | Array. An empty array is valid and clears the chore list. |
| `id` | no | String. |
| `title` | yes | Non-empty string. |
| `who` | no | People id, or `any`. Defaults to `any`. |
| `routine` | yes | `morning`, `after`, or `evening`. |
| `emoji` | no | Short string shown beside the title. |
| `stars` | no | Number of stars awarded when the chore is checked. Kids with a `stars` total (below) earn them. |
| `done` | no | Boolean. |
| `overdue` | no | `true` flags the row. |
| `doneBy` | no | People id, used when an `any` chore was completed by someone. |
| `stars` (top-level) | no | Object of people id → number, the running star totals. |
| `week` | no | Object of people id → seven values, Monday through Sunday. Each value is `1` (done), `0` (missed), or `null` (future). |

A wrong shape rejects the file. The sample chores stay in place.

### `climate.json`

Feeds the thermostat on the Home tab (indoor temperature, setpoint, mode). The outdoor weather tile is `weather.json`, not this file.

```json
{
  "indoor": {
    "current": 20.5,
    "set": 21.5,
    "mode": "heat",
    "humidity": 42,
    "outside": 14
  }
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `indoor.current` | yes | Number. Indoor temperature. |
| `indoor.set` | yes | Number. Thermostat setpoint. |
| `indoor.mode` | yes | `heat`, `cool`, `auto`, or `off`. |
| `indoor.humidity` | yes | Number. Indoor humidity, percent. |
| `indoor.outside` | no | Number. Outdoor temperature stored with the thermostat. When omitted, the sample value stays. |

### `weather.json`

Feeds the weather tile: current temperature, the hourly outlook, and the short tip under them. This file is an [Open-Meteo](https://open-meteo.com/en/docs) forecast response saved as-is. Request Fahrenheit and `America/New_York`, then write the JSON body to `weather.json` with no reshaping:

```text
https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&temperature_unit=fahrenheit&timezone=America%2FNew_York
```

```json
{
  "latitude": 40.7128,
  "longitude": -74.006,
  "timezone": "America/New_York",
  "timezone_abbreviation": "EDT",
  "utc_offset_seconds": -14400,
  "current_units": {
    "time": "iso8601",
    "interval": "seconds",
    "temperature_2m": "°F",
    "weather_code": "wmo code"
  },
  "current": {
    "time": "2026-10-24T13:45",
    "interval": 900,
    "temperature_2m": 61.7,
    "weather_code": 3
  },
  "hourly_units": {
    "time": "iso8601",
    "temperature_2m": "°F",
    "weather_code": "wmo code",
    "precipitation_probability": "%"
  },
  "hourly": {
    "time": ["2026-10-24T00:00", "2026-10-24T01:00"],
    "temperature_2m": [45.8, 45.1],
    "weather_code": [0, 1],
    "precipitation_probability": [0, 5]
  }
}
```

`hourly.time`, `hourly.temperature_2m`, `hourly.weather_code`, and `hourly.precipitation_probability` are parallel arrays of equal length, which is how Open-Meteo returns them. A real response is longer than the two hours above and may also include `elevation` and `generationtime_ms`. Those extra fields are ignored. A full response saved from the URL above is in [`dashboard/examples/data/weather.json`](dashboard/examples/data/weather.json).

| Field | Required | Meaning |
| --- | --- | --- |
| `timezone` | no | When present, must be `America/New_York`. Times in the file are that zone’s wall clock (`2026-10-24T13:45`), not UTC. |
| `current_units.temperature_2m` | no | When present, must be `°F`. A Celsius body is rejected so it is not shown as Fahrenheit. |
| `hourly_units.temperature_2m` | no | Same check as the current units. |
| `current.temperature_2m` | yes | Number. Current temperature in °F. Shown as the big figure, rounded. |
| `current.weather_code` | yes | Number. [WMO weather code](https://open-meteo.com/en/docs). |
| `current.time` | no | ISO local time. Used to pick the day or night icon. |
| `hourly.time` | yes | Array of `YYYY-MM-DDTHH:mm` local times. |
| `hourly.temperature_2m` | yes | Array of °F, same length as `time`. Today’s high and low are the max and min of the hours that fall on today’s New York date. |
| `hourly.weather_code` | yes | Array of WMO codes, same length. |
| `hourly.precipitation_probability` | yes | Array of 0–100, or `null` (treated as 0). Same length. The tip treats 50 or above as rain. |

WMO codes on the tile:

| Codes | Tile |
| --- | --- |
| 0, 1 | Clear. Sun from 6:00 through 19:59 New York time, moon otherwise. |
| 2 | Partly cloudy. |
| 3 | Overcast. |
| 45, 48 | Fog. |
| 51–67, 80–82 | Rain. The tip says when it starts or ends if the chance stays at 50% or more. |
| 71–77, 85, 86 | Snow. |
| 95, 96, 99 | Thunderstorm. |

One bad array, a timezone other than `America/New_York`, or a temperature unit other than `°F` rejects the file. The weather tile then keeps the built-in sample.

### `photos/manifest.json`

```json
{
  "photos": [
    {
      "file": "harbour.jpg",
      "orientation": "landscape",
      "date": "2025-07-19",
      "place": "Toronto Harbour",
      "from": "otto",
      "tag": "sail"
    }
  ]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `photos` | yes | Array. Empty, missing, or not an array shows the placeholder. |
| `file` | yes | Path relative to `/frame/photos/`, such as `harbour.jpg` or `2025/harbour.jpg`. `src` is accepted as an alias. Absolute URLs, leading slashes, and `..` are ignored so the frame cannot be pointed at another host. |
| `date` | yes | `YYYY-MM-DD`. Used for “on this day” and the caption. |
| `orientation` | no | `landscape` or `portrait` (`l` / `p` also work). Default `landscape`. `o` is an alias. |
| `place` | no | Caption place. |
| `from` | no | People id of who took it. |
| `tag` | no | String. Photos that share a tag can be paired in the slideshow. |

Entries that fail those checks are skipped. If none remain, the placeholder is shown. Put the image files in `/frame/photos/` next to `manifest.json`.
