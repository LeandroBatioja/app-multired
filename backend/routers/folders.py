from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Folder
from schemas import FolderCreate, FolderResponse
from auth import get_current_user

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("", response_model=list[FolderResponse])
def list_folders(
    parent_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Folder).filter(Folder.user_id == current_user.id)
    if parent_id is not None:
        query = query.filter(Folder.parent_id == parent_id)
    else:
        query = query.filter(Folder.parent_id.is_(None))

    return [FolderResponse.model_validate(f) for f in query.all()]


@router.post("", response_model=FolderResponse)
def create_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.parent_id is not None:
        parent = db.query(Folder).filter(
            Folder.id == data.parent_id,
            Folder.user_id == current_user.id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Carpeta padre no encontrada")

    folder = Folder(
        name=data.name,
        user_id=current_user.id,
        parent_id=data.parent_id,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return FolderResponse.model_validate(folder)


@router.put("/{folder_id}", response_model=FolderResponse)
def rename_folder(
    folder_id: int,
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    folder.name = data.name
    db.commit()
    db.refresh(folder)
    return FolderResponse.model_validate(folder)


@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Carpeta no encontrada")

    db.delete(folder)
    db.commit()
    return {"detail": "Carpeta eliminada"}
