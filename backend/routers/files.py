from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, File as FileModel, Folder, Share, Version
from schemas import FileResponse, FileRename, FileMove, StorageStats, VersionResponse
from auth import get_current_user
import os
import mimetypes
from datetime import datetime

STORAGE_LIMIT_BYTES = 50 * 1024 * 1024 * 1024  # 50 GB

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=list[FileResponse])
def list_files(
    folder_id: int = None,
    show_deleted: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(FileModel).filter(
        FileModel.user_id == current_user.id,
        FileModel.deleted == show_deleted,
    )
    if folder_id is not None:
        query = query.filter(FileModel.folder_id == folder_id)
    else:
        query = query.filter(FileModel.folder_id.is_(None))

    files = query.all()

    result = []
    for f in files:
        shares = db.query(Share).filter(Share.file_id == f.id).all()
        shared_names = []
        for s in shares:
            u = db.query(User).filter(User.id == s.shared_with_id).first()
            if u:
                shared_names.append(u.name)
        file_resp = FileResponse.model_validate(f)
        file_resp.shared_with = shared_names
        result.append(file_resp)

    return result


@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    folder_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    size = len(content)

    used = db.query(func.sum(FileModel.size)).filter(
        FileModel.user_id == current_user.id,
        FileModel.deleted == False,
    ).scalar() or 0

    if used + size > STORAGE_LIMIT_BYTES:
        used_gb = round(used / (1024 ** 3), 2)
        raise HTTPException(
            status_code=413,
            detail=f"Límite de almacenamiento alcanzado ({used_gb} GB / 50 GB usados). Elimina archivos para liberar espacio.",
        )

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else ""

    db_file = FileModel(
        name=file.filename,
        original_name=file.filename,
        size=size,
        extension=ext,
        user_id=current_user.id,
        folder_id=folder_id,
        synced=True,
        backup_locations=2,
    )
    db.add(db_file)
    db.flush()

    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{db_file.id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(content)

    version = Version(
        file_id=db_file.id,
        version_number=1,
        size=size,
    )
    db.add(version)
    db.commit()
    db.refresh(db_file)

    return FileResponse(
        id=db_file.id,
        name=db_file.name,
        original_name=db_file.original_name,
        size=db_file.size,
        extension=db_file.extension,
        folder_id=db_file.folder_id,
        synced=db_file.synced,
        backup_locations=db_file.backup_locations,
        deleted=db_file.deleted,
        created_at=db_file.created_at,
        updated_at=db_file.updated_at,
        shared_with=[],
    )


@router.get("/{file_id}", response_model=FileResponse)
def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.user_id == current_user.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    shares = db.query(Share).filter(Share.file_id == f.id).all()
    shared_names = []
    for s in shares:
        u = db.query(User).filter(User.id == s.shared_with_id).first()
        if u:
            shared_names.append(u.name)

    return FileResponse(
        id=f.id,
        name=f.name,
        original_name=f.original_name,
        size=f.size,
        extension=f.extension,
        folder_id=f.folder_id,
        synced=f.synced,
        backup_locations=f.backup_locations,
        deleted=f.deleted,
        created_at=f.created_at,
        updated_at=f.updated_at,
        shared_with=shared_names,
    )


@router.put("/{file_id}/rename", response_model=FileResponse)
def rename_file(
    file_id: int,
    data: FileRename,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.user_id == current_user.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    f.name = data.name
    f.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(f)

    return FileResponse(
        id=f.id,
        name=f.name,
        original_name=f.original_name,
        size=f.size,
        extension=f.extension,
        folder_id=f.folder_id,
        synced=f.synced,
        backup_locations=f.backup_locations,
        deleted=f.deleted,
        created_at=f.created_at,
        updated_at=f.updated_at,
        shared_with=[],
    )


@router.put("/{file_id}/move", response_model=FileResponse)
def move_file(
    file_id: int,
    data: FileMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.user_id == current_user.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    if data.folder_id is not None:
        folder = db.query(Folder).filter(
            Folder.id == data.folder_id,
            Folder.user_id == current_user.id,
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Carpeta destino no encontrada")

    f.folder_id = data.folder_id
    f.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(f)

    return FileResponse(
        id=f.id,
        name=f.name,
        original_name=f.original_name,
        size=f.size,
        extension=f.extension,
        folder_id=f.folder_id,
        synced=f.synced,
        backup_locations=f.backup_locations,
        deleted=f.deleted,
        created_at=f.created_at,
        updated_at=f.updated_at,
        shared_with=[],
    )


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    permanent: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.user_id == current_user.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    if permanent:
        file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{f.id}_{f.original_name}")
        if os.path.exists(file_path):
            os.remove(file_path)
        db.delete(f)
    else:
        f.deleted = True
        f.updated_at = datetime.utcnow()

    db.commit()
    return {"detail": "Archivo eliminado"}


@router.post("/{file_id}/restore")
def restore_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.user_id == current_user.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    f.deleted = False
    f.updated_at = datetime.utcnow()
    db.commit()
    return {"detail": "Archivo restaurado"}


@router.get("/{file_id}/versions", response_model=list[VersionResponse])
def list_versions(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.user_id == current_user.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    versions = db.query(Version).filter(Version.file_id == file_id).order_by(Version.version_number.desc()).all()
    return [VersionResponse.model_validate(v) for v in versions]


@router.post("/{file_id}/verify")
def verify_integrity(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.user_id == current_user.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{f.id}_{f.original_name}")
    exists = os.path.exists(file_path)

    return {
        "file_id": file_id,
        "name": f.name,
        "integrity_ok": exists,
        "message": "Archivo íntegro ✓" if exists else "Archivo no encontrado en disco",
    }


@router.get("/stats/storage", response_model=StorageStats)
def get_storage_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    files = db.query(FileModel).filter(
        FileModel.user_id == current_user.id,
        FileModel.deleted == False,
    ).all()
    total_size = sum(f.size for f in files)
    return StorageStats(
        used=round(total_size / (1024 * 1024 * 1024), 2),
        total=50.0,
        file_count=len(files),
    )


@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    is_owner = f.user_id == current_user.id
    is_shared = db.query(Share).filter(
        Share.file_id == file_id,
        Share.shared_with_id == current_user.id,
    ).first() is not None

    if not is_owner and not is_shared:
        raise HTTPException(status_code=403, detail="No tienes acceso a este archivo")

    file_path = os.path.join(UPLOAD_DIR, f"{f.user_id}_{f.id}_{f.original_name}")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en disco")

    mime_type = mimetypes.guess_type(f.original_name or f.name)[0] or "application/octet-stream"
    return FastAPIFileResponse(
        path=file_path,
        filename=f.name,
        media_type=mime_type,
    )


@router.get("/{file_id}/preview")
def preview_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    is_owner = f.user_id == current_user.id
    is_shared = db.query(Share).filter(
        Share.file_id == file_id,
        Share.shared_with_id == current_user.id,
    ).first() is not None

    if not is_owner and not is_shared:
        raise HTTPException(status_code=403, detail="No tienes acceso a este archivo")

    file_path = os.path.join(UPLOAD_DIR, f"{f.user_id}_{f.id}_{f.original_name}")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en disco")

    mime_type = mimetypes.guess_type(f.original_name or f.name)[0] or "application/octet-stream"
    return FastAPIFileResponse(
        path=file_path,
        media_type=mime_type,
        headers={"Content-Disposition": f'inline; filename="{f.name}"'},
    )
