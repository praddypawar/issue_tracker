"""Add USER_UPDATED to activity_type enum

Revision ID: 799a00569368
Revises: fc29704ddcc9
Create Date: 2025-07-20 18:30:26.655967

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "799a00569368"
down_revision: Union[str, Sequence[str], None] = "fc29704ddcc9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Robustly add USER_UPDATED to activity_type enum if not present
    op.execute(
        """
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
            RAISE NOTICE 'Enum type activity_type does not exist.';
        ELSIF NOT EXISTS (
            SELECT 1 FROM unnest(enum_range(NULL::activity_type)) v WHERE v = 'USER_UPDATED'
        ) THEN
            ALTER TYPE activity_type ADD VALUE 'USER_UPDATED';
        END IF;
    END$$;
    """
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # Downgrading enums in Postgres is non-trivial and usually not supported.
    pass
    # ### end Alembic commands ###
