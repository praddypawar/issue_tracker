# """Add CREATE_USER to activity_type enum

# Revision ID: fc29704ddcc9
# Revises: 07caf539115b
# Create Date: 2025-07-20 18:08:02.000861

# """
# from typing import Sequence, Union

# from alembic import op
# import sqlalchemy as sa


# # revision identifiers, used by Alembic.
# revision: str = 'fc29704ddcc9'
# down_revision: Union[str, Sequence[str], None] = '07caf539115b'
# branch_labels: Union[str, Sequence[str], None] = None
# depends_on: Union[str, Sequence[str], None] = None


# def upgrade() -> None:
#     """Upgrade schema."""
#     # ### commands auto generated by Alembic - please adjust! ###
#     pass
#     # ### end Alembic commands ###


# def downgrade() -> None:
#     """Downgrade schema."""
#     # ### commands auto generated by Alembic - please adjust! ###
#     pass
#     # ### end Alembic commands ###
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "fc29704ddcc9"
down_revision = "07caf539115b"
branch_labels = None
depends_on = None


def upgrade():
    # Robustly add CREATE_USER to activity_type enum if not present
    op.execute(
        """
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
            RAISE NOTICE 'Enum type activity_type does not exist.';
        ELSIF NOT EXISTS (
            SELECT 1 FROM unnest(enum_range(NULL::activity_type)) v WHERE v = 'CREATE_USER'
        ) THEN
            ALTER TYPE activity_type ADD VALUE 'CREATE_USER';
        END IF;
    END$$;
    """
    )


def downgrade():
    # Downgrading enums in Postgres is non-trivial and usually not supported.
    pass
