from pathlib import Path

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

DIST_DIR = Path(__file__).resolve().parents[1] / "static" / "dist"
INDEX_HTML = DIST_DIR / "index.html"

router = APIRouter(tags=["frontend"])


@router.get("/", include_in_schema=False)
async def index() -> FileResponse:
    return FileResponse(INDEX_HTML)


def register_frontend(app: FastAPI) -> None:
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="frontend-assets")
    app.include_router(router)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str) -> FileResponse:
        file_path = (DIST_DIR / full_path).resolve()
        dist_root = DIST_DIR.resolve()

        if not str(file_path).startswith(f"{dist_root}/") and file_path != dist_root:
            raise HTTPException(status_code=404)

        if file_path.is_file():
            return FileResponse(file_path)

        return FileResponse(INDEX_HTML)
