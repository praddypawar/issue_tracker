"""add issue_tags association table for Issue-Tag many-to-many relation

Revision ID: f9d63a3f63c7
Revises: e1bbc3d2ba7e
Create Date: 2025-07-20 16:54:43.959270

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f9d63a3f63c7'
down_revision: Union[str, Sequence[str], None] = 'e1bbc3d2ba7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('idx_permissions_type'), table_name='permissions')
    op.drop_index(op.f('idx_permissions_user_id'), table_name='permissions')
    op.drop_table('permissions')
    op.alter_column('comments', 'issue_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('comments', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.drop_index(op.f('idx_comments_issue_id'), table_name='comments')
    op.drop_index(op.f('idx_comments_user_id'), table_name='comments')
    op.create_index(op.f('ix_comments_id'), 'comments', ['id'], unique=False)
    op.create_index(op.f('ix_comments_issue_id'), 'comments', ['issue_id'], unique=False)
    op.create_index(op.f('ix_comments_user_id'), 'comments', ['user_id'], unique=False)
    op.drop_constraint(op.f('comments_user_id_fkey'), 'comments', type_='foreignkey')
    op.drop_constraint(op.f('comments_issue_id_fkey'), 'comments', type_='foreignkey')
    op.create_foreign_key(None, 'comments', 'issues', ['issue_id'], ['id'])
    op.create_foreign_key(None, 'comments', 'users', ['user_id'], ['id'])
    op.drop_index(op.f('idx_issue_tags_issue_id'), table_name='issue_tags')
    op.drop_index(op.f('idx_issue_tags_tag_id'), table_name='issue_tags')
    op.alter_column('issues', 'description',
               existing_type=sa.TEXT(),
               nullable=False)
    op.alter_column('issues', 'status',
               existing_type=postgresql.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', name='issue_status'),
               nullable=False,
               existing_server_default=sa.text("'OPEN'::issue_status"))
    op.alter_column('issues', 'priority',
               existing_type=postgresql.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='issue_priority'),
               nullable=False,
               existing_server_default=sa.text("'MEDIUM'::issue_priority"))
    op.alter_column('issues', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('issues', 'updated_at',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.drop_index(op.f('idx_issues_assigned_to'), table_name='issues')
    op.drop_index(op.f('idx_issues_created_by'), table_name='issues')
    op.drop_index(op.f('idx_issues_priority'), table_name='issues')
    op.drop_index(op.f('idx_issues_status'), table_name='issues')
    op.create_index(op.f('ix_issues_id'), 'issues', ['id'], unique=False)
    op.drop_index(op.f('idx_tags_name'), table_name='tags')
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)
    op.alter_column('team_members', 'role',
               existing_type=sa.VARCHAR(length=20),
               nullable=False,
               existing_server_default=sa.text("'MEMBER'::character varying"))
    op.alter_column('team_members', 'joined_at',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.drop_index(op.f('idx_team_members_invited_by'), table_name='team_members')
    op.drop_index(op.f('idx_team_members_user_id'), table_name='team_members')
    op.drop_constraint(op.f('team_members_user_id_fkey'), 'team_members', type_='foreignkey')
    op.create_foreign_key(None, 'team_members', 'users', ['user_id'], ['id'])
    op.alter_column('user_activities', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('user_activities', 'details',
               existing_type=postgresql.JSONB(astext_type=sa.Text()),
               type_=sa.JSON(),
               existing_nullable=True)
    op.alter_column('user_activities', 'user_agent',
               existing_type=sa.TEXT(),
               type_=sa.String(),
               existing_nullable=True)
    op.alter_column('user_activities', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.drop_index(op.f('idx_user_activities_created_at'), table_name='user_activities')
    op.drop_index(op.f('idx_user_activities_user_id'), table_name='user_activities')
    op.create_index(op.f('ix_user_activities_id'), 'user_activities', ['id'], unique=False)
    op.alter_column('users', 'role',
               existing_type=postgresql.ENUM('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', name='user_role'),
               nullable=False,
               existing_server_default=sa.text("'MEMBER'::user_role"))
    op.alter_column('users', 'status',
               existing_type=postgresql.ENUM('ACTIVE', 'INACTIVE', 'AWAY', 'SUSPENDED', name='user_status'),
               nullable=False,
               existing_server_default=sa.text("'ACTIVE'::user_status"))
    op.alter_column('users', 'last_login',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True)
    op.alter_column('users', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('users', 'updated_at',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.drop_index(op.f('idx_users_email'), table_name='users')
    op.drop_index(op.f('idx_users_role'), table_name='users')
    op.drop_index(op.f('idx_users_status'), table_name='users')
    op.drop_index(op.f('idx_users_username'), table_name='users')
    op.drop_constraint(op.f('users_email_key'), 'users', type_='unique')
    op.drop_constraint(op.f('users_username_key'), 'users', type_='unique')
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.create_unique_constraint(op.f('users_username_key'), 'users', ['username'], postgresql_nulls_not_distinct=False)
    op.create_unique_constraint(op.f('users_email_key'), 'users', ['email'], postgresql_nulls_not_distinct=False)
    op.create_index(op.f('idx_users_username'), 'users', ['username'], unique=False)
    op.create_index(op.f('idx_users_status'), 'users', ['status'], unique=False)
    op.create_index(op.f('idx_users_role'), 'users', ['role'], unique=False)
    op.create_index(op.f('idx_users_email'), 'users', ['email'], unique=False)
    op.alter_column('users', 'updated_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('users', 'created_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('users', 'last_login',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True)
    op.alter_column('users', 'status',
               existing_type=postgresql.ENUM('ACTIVE', 'INACTIVE', 'AWAY', 'SUSPENDED', name='user_status'),
               nullable=True,
               existing_server_default=sa.text("'ACTIVE'::user_status"))
    op.alter_column('users', 'role',
               existing_type=postgresql.ENUM('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', name='user_role'),
               nullable=True,
               existing_server_default=sa.text("'MEMBER'::user_role"))
    op.drop_index(op.f('ix_user_activities_id'), table_name='user_activities')
    op.create_index(op.f('idx_user_activities_user_id'), 'user_activities', ['user_id'], unique=False)
    op.create_index(op.f('idx_user_activities_created_at'), 'user_activities', ['created_at'], unique=False)
    op.alter_column('user_activities', 'created_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('user_activities', 'user_agent',
               existing_type=sa.String(),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('user_activities', 'details',
               existing_type=sa.JSON(),
               type_=postgresql.JSONB(astext_type=sa.Text()),
               existing_nullable=True)
    op.alter_column('user_activities', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.drop_constraint(None, 'team_members', type_='foreignkey')
    op.create_foreign_key(op.f('team_members_user_id_fkey'), 'team_members', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_index(op.f('idx_team_members_user_id'), 'team_members', ['user_id'], unique=False)
    op.create_index(op.f('idx_team_members_invited_by'), 'team_members', ['invited_by'], unique=False)
    op.alter_column('team_members', 'joined_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('team_members', 'role',
               existing_type=sa.VARCHAR(length=20),
               nullable=True,
               existing_server_default=sa.text("'MEMBER'::character varying"))
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.create_index(op.f('idx_tags_name'), 'tags', ['name'], unique=False)
    op.drop_index(op.f('ix_issues_id'), table_name='issues')
    op.create_index(op.f('idx_issues_status'), 'issues', ['status'], unique=False)
    op.create_index(op.f('idx_issues_priority'), 'issues', ['priority'], unique=False)
    op.create_index(op.f('idx_issues_created_by'), 'issues', ['reporter_id'], unique=False)
    op.create_index(op.f('idx_issues_assigned_to'), 'issues', ['assignee_id'], unique=False)
    op.alter_column('issues', 'updated_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('issues', 'created_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('issues', 'priority',
               existing_type=postgresql.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='issue_priority'),
               nullable=True,
               existing_server_default=sa.text("'MEDIUM'::issue_priority"))
    op.alter_column('issues', 'status',
               existing_type=postgresql.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', name='issue_status'),
               nullable=True,
               existing_server_default=sa.text("'OPEN'::issue_status"))
    op.alter_column('issues', 'description',
               existing_type=sa.TEXT(),
               nullable=True)
    op.create_index(op.f('idx_issue_tags_tag_id'), 'issue_tags', ['tag_id'], unique=False)
    op.create_index(op.f('idx_issue_tags_issue_id'), 'issue_tags', ['issue_id'], unique=False)
    op.drop_constraint(None, 'comments', type_='foreignkey')
    op.drop_constraint(None, 'comments', type_='foreignkey')
    op.create_foreign_key(op.f('comments_issue_id_fkey'), 'comments', 'issues', ['issue_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('comments_user_id_fkey'), 'comments', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.drop_index(op.f('ix_comments_user_id'), table_name='comments')
    op.drop_index(op.f('ix_comments_issue_id'), table_name='comments')
    op.drop_index(op.f('ix_comments_id'), table_name='comments')
    op.create_index(op.f('idx_comments_user_id'), 'comments', ['user_id'], unique=False)
    op.create_index(op.f('idx_comments_issue_id'), 'comments', ['issue_id'], unique=False)
    op.alter_column('comments', 'created_at',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('comments', 'issue_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.create_table('permissions',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('permission_type', postgresql.ENUM('CREATE_ISSUE', 'READ_ISSUE', 'UPDATE_ISSUE', 'DELETE_ISSUE', 'CREATE_COMMENT', 'READ_COMMENT', 'UPDATE_COMMENT', 'DELETE_COMMENT', 'MANAGE_USERS', 'MANAGE_ROLES', 'VIEW_ANALYTICS', 'MANAGE_PROJECTS', name='permission_type'), autoincrement=False, nullable=False),
    sa.Column('granted', sa.BOOLEAN(), server_default=sa.text('true'), autoincrement=False, nullable=True),
    sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('permissions_user_id_fkey'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('permissions_pkey')),
    sa.UniqueConstraint('user_id', 'permission_type', name=op.f('permissions_user_id_permission_type_key'), postgresql_include=[], postgresql_nulls_not_distinct=False)
    )
    op.create_index(op.f('idx_permissions_user_id'), 'permissions', ['user_id'], unique=False)
    op.create_index(op.f('idx_permissions_type'), 'permissions', ['permission_type'], unique=False)
    # ### end Alembic commands ###
