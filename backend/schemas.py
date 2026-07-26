from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth
class UserCreate(BaseModel):
    email: str
    name: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Folders
class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None


class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Files
class FileResponse(BaseModel):
    id: int
    name: str
    original_name: Optional[str]
    size: int
    extension: Optional[str]
    folder_id: Optional[int]
    synced: bool
    backup_locations: int
    deleted: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    shared_with: Optional[List[str]] = []

    class Config:
        from_attributes = True


class FileRename(BaseModel):
    name: str


class FileMove(BaseModel):
    folder_id: Optional[int]


# Shares
class ShareCreate(BaseModel):
    email: str
    permission: str = "viewer"


class ShareResponse(BaseModel):
    id: int
    file_id: int
    shared_with_name: str
    shared_with_email: str
    permission: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Notifications
class NotificationResponse(BaseModel):
    id: int
    message: str
    read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Versions
class VersionResponse(BaseModel):
    id: int
    file_id: int
    version_number: int
    size: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Stats
class StorageStats(BaseModel):
    used: float
    total: float
    file_count: int


class BackupStatus(BaseModel):
    total_files: int
    backed_up_files: int
    single_backup_files: int
