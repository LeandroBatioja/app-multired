from sqlalchemy import Column, Integer, String, BigInteger, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    files = relationship("File", back_populates="owner")
    folders = relationship("Folder", back_populates="owner")
    notifications = relationship("Notification", back_populates="user")


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    parent_id = Column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="folders")
    files = relationship("File", back_populates="folder")
    children = relationship("Folder", backref="parent", remote_side=[id])


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    original_name = Column(String(255))
    size = Column(BigInteger, default=0)
    extension = Column(String(10))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)
    synced = Column(Boolean, default=True)
    backup_locations = Column(Integer, default=1)
    deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="files")
    folder = relationship("Folder", back_populates="files")
    shares = relationship("Share", back_populates="file", cascade="all, delete-orphan")
    versions = relationship("Version", back_populates="file", cascade="all, delete-orphan")


class Share(Base):
    __tablename__ = "shares"
    __table_args__ = (UniqueConstraint("file_id", "shared_with_id"),)

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id", ondelete="CASCADE"))
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    shared_with_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    permission = Column(String(20), default="viewer")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    file = relationship("File", back_populates="shares")
    owner = relationship("User", foreign_keys=[owner_id])
    shared_with = relationship("User", foreign_keys=[shared_with_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")


class Version(Base):
    __tablename__ = "versions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id", ondelete="CASCADE"))
    version_number = Column(Integer, nullable=False)
    size = Column(BigInteger, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    file = relationship("File", back_populates="versions")
