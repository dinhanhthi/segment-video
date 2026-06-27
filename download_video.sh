#!/bin/bash

# download_video.sh
#
# This script downloads multiple time ranges from a remote MP4 video, saves each
# range as a temporary segment file, then merges those segment files into one
# output video.
#
# Requirements:
# - ffmpeg must be installed and available in your PATH.
#
# How to use:
# 1. Copy VIDEO_URL and SEGMENTS from the extension's Stop output.
# 2. Replace the fake VIDEO_URL value below with the copied VIDEO_URL.
# 3. Replace OUTPUT with the file name you want to create.
# 4. Replace the sample SEGMENTS values with your copied SEGMENTS values.
# 5. Run: ./download_video.sh

VIDEO_URL="https://example.com/path/to/video.mp4?secure=FAKE_TOKEN"
OUTPUT="output-video.mp4"

# Segment list. Each segment uses HH:MM:SS or MM:SS format.
SEGMENTS=(
  "00:00-00:30"
  "01:10-02:05"
  "03:00-03:45"
)

# Create the concat list file.
> list.txt
i=1
for seg in "${SEGMENTS[@]}"; do
  start=$(echo "$seg" | cut -d'-' -f1)
  end=$(echo "$seg" | cut -d'-' -f2)
  segfile="segment${i}.mp4"

  ffmpeg -i "$VIDEO_URL" -ss "$start" -to "$end" -c copy "$segfile" -y
  echo "file '$segfile'" >> list.txt
  ((i++))
done

# Merge all temporary segments into the final output file.
ffmpeg -f concat -safe 0 -i list.txt -c copy "$OUTPUT"

# Remove temporary files.
rm -f segment*.mp4 list.txt

echo "Done. File created: $OUTPUT"
