# MediaMTX Next MVC RBAC LiveGrid - Topbar + Recording/Snapshot Fix

## Fixes in this version

- Single-cell fullscreen top bar is smaller and uses less vertical space.
- Recording now tries multiple FFmpeg input URLs and returns readable errors.
- Snapshot now tries RTSP and HLS fallback inputs.
- Snapshot/Record buttons now show errors in the UI instead of failing silently.

## Important server requirement

Install FFmpeg on the VPS:

```bash
sudo apt update
sudo apt install -y ffmpeg
```

## Recommended `.env` for your MediaMTX server

If MediaMTX playback/RTSP needs username/password, use authenticated RTSP:

```env
FFMPEG_INPUT_TEMPLATE="rtsp://admin:admin123@127.0.0.1:8554/{streamKey}"
FFMPEG_HLS_INPUT_TEMPLATE="http://127.0.0.1:8888/{streamKey}/index.m3u8"
```

If your Next.js app is not running on the same VPS as MediaMTX, replace `127.0.0.1` with your MediaMTX server IP.

## Notes

Recording and snapshot are server-side features. They will not work unless the Next.js server can reach the MediaMTX stream URL.

## Server-side recording

This version supports two server recording modes.

### Recommended: MediaMTX native recording

```env
SERVER_RECORDING_MODE="mediamtx"
MEDIAMTX_RECORD_PATH="./recordings/%path/%Y-%m-%d_%H-%M-%S-%f"
MEDIAMTX_RECORD_FORMAT="fmp4"
```

When the operator clicks **Record**, the app enables `record: true` for the selected MediaMTX path through the MediaMTX API. The recording is saved by MediaMTX on the server, not by the browser.

### Fallback: FFmpeg server recording

```env
SERVER_RECORDING_MODE="ffmpeg"
MEDIAMTX_INTERNAL_HOST="127.0.0.1"
MEDIAMTX_RTSP_BASE_URL="rtsp://admin:admin123@127.0.0.1:8554"
MEDIAMTX_HLS_BASE_URL="http://127.0.0.1:8888"
```

Install ffmpeg:

```bash
sudo apt update
sudo apt install -y ffmpeg
```

If the Next.js app runs inside Docker, replace `127.0.0.1` with the MediaMTX container name or VPS IP, for example:

```env
MEDIAMTX_RTSP_BASE_URL="rtsp://admin:admin123@mediamtx:8554"
MEDIAMTX_HLS_BASE_URL="http://mediamtx:8888"
```
