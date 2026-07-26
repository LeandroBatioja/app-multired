from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, File as FileModel, Share, Notification
from schemas import ShareCreate, ShareResponse
from auth import get_current_user

router = APIRouter(prefix="/shares", tags=["shares"])


@router.get("/shared-with-me", response_model=list[dict])
def shared_with_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shares = db.query(Share).filter(Share.shared_with_id == current_user.id).all()
    result = []
    for s in shares:
        f = db.query(FileModel).filter(FileModel.id == s.file_id).first()
        owner = db.query(User).filter(User.id == s.owner_id).first()
        if f and owner:
            result.append({
                "id": f.id,
                "name": f.name,
                "size": f.size,
                "extension": f.extension,
                "shared_by": owner.name,
                "permission": s.permission,
                "created_at": f.created_at,
            })
    return result


@router.post("/{file_id}", response_model=ShareResponse)
def share_file(
    file_id: int,
    data: ShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.user_id == current_user.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    target_user = db.query(User).filter(User.email == data.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes compartir contigo mismo")

    existing = db.query(Share).filter(
        Share.file_id == file_id,
        Share.shared_with_id == target_user.id,
    ).first()
    if existing:
        existing.permission = data.permission
        db.commit()
        db.refresh(existing)
        return ShareResponse(
            id=existing.id,
            file_id=existing.file_id,
            shared_with_name=target_user.name,
            shared_with_email=target_user.email,
            permission=existing.permission,
            created_at=existing.created_at,
        )

    share = Share(
        file_id=file_id,
        owner_id=current_user.id,
        shared_with_id=target_user.id,
        permission=data.permission,
    )
    db.add(share)

    notification = Notification(
        user_id=target_user.id,
        message=f"{current_user.name} compartió '{f.name}' contigo",
    )
    db.add(notification)
    db.commit()
    db.refresh(share)

    return ShareResponse(
        id=share.id,
        file_id=share.file_id,
        shared_with_name=target_user.name,
        shared_with_email=target_user.email,
        permission=share.permission,
        created_at=share.created_at,
    )


@router.get("/{file_id}", response_model=list[ShareResponse])
def list_shares(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shares = db.query(Share).filter(Share.file_id == file_id).all()
    result = []
    for s in shares:
        user = db.query(User).filter(User.id == s.shared_with_id).first()
        if user:
            result.append(ShareResponse(
                id=s.id,
                file_id=s.file_id,
                shared_with_name=user.name,
                shared_with_email=user.email,
                permission=s.permission,
                created_at=s.created_at,
            ))
    return result


@router.delete("/{share_id}")
def revoke_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    share = db.query(Share).filter(
        Share.id == share_id,
        Share.owner_id == current_user.id,
    ).first()
    if not share:
        raise HTTPException(status_code=404, detail="Compartición no encontrada")

    db.delete(share)
    db.commit()
    return {"detail": "Acceso revocado"}
