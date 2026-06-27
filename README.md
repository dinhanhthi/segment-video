<p align="center">
  <img src="icons/icon-128.png" alt="Video Segment Timestamp Capture logo" width="96" height="96">
</p>

<h1 align="center">Video Segment Timestamp Capture</h1>

<p align="center">
  Capture video timestamps, collect segments, and export ffmpeg-ready ranges from any page with an HTML video player.
</p>

<p align="center">
  <strong>Start</strong> · <strong>End</strong> · <strong>Delete</strong> · <strong>Copy</strong>
</p>

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder: `/Users/thi/Downloads/segment_videos`.

## Install From GitHub Actions ZIP

The GitHub Actions workflow builds a ZIP artifact named `segment-videos`.

1. Open the repository on GitHub.
2. Go to `Actions`.
3. Open the latest `Build Extension ZIP` workflow run.
4. Download the `segment-videos` artifact.
5. Unzip the downloaded artifact.
6. Open `chrome://extensions`.
7. Enable `Developer mode`.
8. Click `Load unpacked`.
9. Select the unzipped `segment-videos` folder.

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
