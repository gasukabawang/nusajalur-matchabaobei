from typing import Optional
from sqlalchemy.orm import Session
from app.domain.models import ApiKey


class ApiKeyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        return (
            self.db.query(ApiKey)
            .filter(ApiKey.key_hash == key_hash, ApiKey.is_active == True)  # noqa: E712
            .first()
        )

    def create(self, key_hash: str, name: str, owner_group: str) -> ApiKey:
        key = ApiKey(
            key_hash=key_hash,
            name=name,
            owner_group=owner_group,
            is_active=True,
        )
        self.db.add(key)
        self.db.commit()
        self.db.refresh(key)
        return key
