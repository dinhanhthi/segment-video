<p align="center">
  <img src="icons/icon-128.png" alt="Segment Videos logo" width="96" height="96">
</p>

<h1 align="center">Segment Videos</h1>

<p align="center">
  Capture video timestamps, collect segments, and export ffmpeg-ready ranges from any page with an HTML video player.
</p>

<p align="center">
  <strong>Start</strong> · <strong>End</strong> · <strong>Delete</strong> · <strong>Copy</strong>
</p>

## Install From GitHub Release

Each push to `main` with a new `version` in `manifest.json` creates a GitHub Release tagged `v{version}` and attaches `segment-videos-{version}.zip`.

1. Open the repository on GitHub.
2. Go to `Releases`.
3. Download the latest `segment-videos-{version}.zip` asset.
4. Unzip the downloaded file.
5. Open `chrome://extensions`.
6. Enable `Developer mode`.
7. Click `Load unpacked`.
8. Select the unzipped `segment-videos` folder.

Bump `version` in `manifest.json` before merging to `main` when you want a new release. If the tag already exists, the workflow still builds the ZIP artifact but skips creating another release.

Chrome cannot load the ZIP file directly with `Load unpacked`; unzip it first, then select the extracted folder.

## Use

- Click `Start` to capture the current video timestamp as the segment start.
- Click `End` to capture the current video timestamp as the segment end and store a segment.
- Click `Delete` next to a stored segment to remove it before exporting.
- Drag the small dotted grip next to the buttons to move the floating controls anywhere on the page.
- Click `Stop` to show all stored segments as:

```bash
VIDEO_URL="https://video-url/video_file.mp4?secure=TOKEN"

SEGMENTS=(
  "14:28-07:05"
  "08:05-10:54"
  "11:19-13:40"
)
```

The modal includes a `Copy` button for the generated output.

## Download With ffmpeg

This extension does not download or cut video files inside Chrome. To download the selected segments locally, install `ffmpeg`, then use `download_video.sh`.

1. Copy the `VIDEO_URL` and `SEGMENTS` output from the extension.
2. Open `download_video.sh`.
3. Replace the fake `VIDEO_URL`, `OUTPUT`, and sample `SEGMENTS` values.
4. Run:

```bash
./download_video.sh
```

The script downloads each segment with `ffmpeg`, merges the temporary segment files into one output video, and removes the temporary files.

## Development

### Prerequisites

- Google Chrome
- Node.js 18+ (for Playwright tests)
- Python 3 (for manifest validation in CI and local builds)
- `ffmpeg` (only if you use `download_video.sh`)

### Load the extension locally

1. Clone the repository.
2. Open `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the repository root folder.

After changing `content.js`, `styles.css`, or `manifest.json`, click the extension's reload button on `chrome://extensions` to pick up changes.

### Build the extension ZIP locally

```bash
VERSION=$(python -c "import json; print(json.load(open('manifest.json'))['version'])")

rm -rf dist
mkdir -p dist/segment-videos/icons

cp manifest.json content.js styles.css dist/segment-videos/
cp icons/icon-16.png icons/icon-48.png icons/icon-128.png dist/segment-videos/icons/

cd dist
zip -r "segment-videos-${VERSION}.zip" segment-videos
```

The output is `dist/segment-videos-{version}.zip`, matching the GitHub Actions release artifact.

### Release a new version

1. Bump `version` in `manifest.json`.
2. Merge to `main`.
3. GitHub Actions builds `segment-videos-{version}.zip` and creates release tag `v{version}` if that tag does not already exist.
