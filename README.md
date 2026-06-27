# Video Segment Timestamp Capture

A Chrome extension that adds floating `Start`, `End`, and `Stop` buttons to pages with HTML video players.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder: `/Users/thi/Downloads/segment_videos`.

## Use

- Click `Start` to capture the current video timestamp as the segment start.
- Click `End` to capture the current video timestamp as the segment end and store a segment.
- Click `Delete` next to a stored segment to remove it before exporting.
- Drag the small dotted grip next to the buttons to move the floating controls anywhere on the page.
- Click `Stop` to show all stored segments as:

```bash
VIDEO_URL="https://vdownload-5.sb-cd.com/1/2/12053619-480p.mp4?secure=h72YBOaLeKg_4qZwdvDJ2A,1782601010&m=5&d=4&_tid=12053619"

SEGMENTS=(
  "14:28-07:05"
  "08:05-10:54"
  "11:19-13:40"
)
```

The modal includes a `Copy` button for the generated output.
