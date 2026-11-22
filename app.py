import os
import urllib.parse
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import yt_dlp
import httpx
import asyncio

app = FastAPI(title="InstaPlaya API", description="Precision player backend for Instagram Reels & Videos")

# Ensure static directory exists
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

class ExtractRequest(BaseModel):
    url: str

def run_ytdlp_extract(target_url: str):
    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'extract_flat': False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(target_url, download=False)
        return info

@app.post("/api/extract")
async def extract_video_info(payload: ExtractRequest):
    url = payload.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL requise")

    # Clean URL query params if instagram reel/p
    parsed = urllib.parse.urlparse(url)
    if "instagram.com" in parsed.netloc:
        # keep path without tracking query params if it's a standard reel/p link
        path = parsed.path.rstrip('/')
        if not path.endswith('/'):
            path += '/'
        clean_url = f"{parsed.scheme}://{parsed.netloc}{path}"
    else:
        clean_url = url

    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, run_ytdlp_extract, clean_url)
    except Exception as e:
        # Retry with original URL just in case query params were needed
        try:
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, run_ytdlp_extract, url)
        except Exception as retry_err:
            raise HTTPException(status_code=422, detail=f"Erreur d'extraction : {str(retry_err)}")

    if not info:
        raise HTTPException(status_code=404, detail="Impossible d'extraire les données de cette vidéo")

    # Determine direct video URL
    video_url = info.get("url")
    if not video_url and "formats" in info:
        # find best format with video
        formats = [f for f in info["formats"] if f.get("vcodec") != "none"]
        if formats:
            video_url = formats[-1].get("url")

    if not video_url:
        raise HTTPException(status_code=404, detail="Aucun flux vidéo direct trouvé")

    # Create stream proxy URL
    encoded_url = urllib.parse.quote(video_url, safe="")
    proxy_stream_url = f"/api/stream?url={encoded_url}"

    return {
        "success": True,
        "id": info.get("id"),
        "title": info.get("title") or "Instagram Reel",
        "uploader": info.get("uploader") or info.get("channel") or "Instagram Creator",
        "duration": info.get("duration"),
        "thumbnail": info.get("thumbnail"),
        "direct_url": video_url,
        "stream_url": proxy_stream_url,
        "width": info.get("width"),
        "height": info.get("height"),
    }

@app.get("/api/stream")
async def stream_video(request: Request, url: str = Query(...)):
    """
    Reverse proxy with HTTP 206 Partial Content / Range Request support.
    This guarantees full seekability (jump, frame-by-frame, loop) and bypasses CORS.
    """
    decoded_url = urllib.parse.unquote(url)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/",
        "Accept": "*/*",
    }
    
    range_header = request.headers.get("range")
    if range_header:
        headers["Range"] = range_header

    client = httpx.AsyncClient(timeout=45.0, follow_redirects=True)
    try:
        req = client.build_request("GET", decoded_url, headers=headers)
        upstream_resp = await client.send(req, stream=True)
    except Exception as e:
        await client.aclose()
        raise HTTPException(status_code=502, detail=f"Échec de connexion au CDN vidéo: {str(e)}")

    response_headers = {
        "Accept-Ranges": "bytes",
        "Content-Type": upstream_resp.headers.get("content-type", "video/mp4"),
        "Cache-Control": "public, max-age=3600",
    }
    
    if "content-length" in upstream_resp.headers:
        response_headers["Content-Length"] = upstream_resp.headers["content-length"]
    if "content-range" in upstream_resp.headers:
        response_headers["Content-Range"] = upstream_resp.headers["content-range"]

    async def body_stream():
        try:
            async for chunk in upstream_resp.aiter_bytes(chunk_size=128 * 1024):
                yield chunk
        finally:
            await upstream_resp.aclose()
            await client.aclose()

    return StreamingResponse(
        body_stream(),
        status_code=upstream_resp.status_code,
        headers=response_headers,
    )

@app.get("/api/download")
async def download_video(url: str = Query(...), filename: Optional[str] = "reel.mp4"):
    """Download video with proper attachment header"""
    decoded_url = urllib.parse.unquote(url)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://www.instagram.com/",
    }
    client = httpx.AsyncClient(timeout=60.0, follow_redirects=True)
    req = client.build_request("GET", decoded_url, headers=headers)
    upstream_resp = await client.send(req, stream=True)

    async def body_stream():
        try:
            async for chunk in upstream_resp.aiter_bytes(chunk_size=128 * 1024):
                yield chunk
        finally:
            await upstream_resp.aclose()
            await client.aclose()

    response_headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": "video/mp4",
    }
    return StreamingResponse(body_stream(), status_code=200, headers=response_headers)

# Mount static & assets files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
assets_dir = os.path.join(STATIC_DIR, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/")
async def root():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>InstaPlaya Frontend not found</h1>")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    print(f"Démarrage d'InstaPlaya sur http://localhost:{port} ...")
    uvicorn.run("app:app", host="127.0.0.1", port=port, reload=True)
