# Role Model and Access Rights

## Role Model Overview

The system uses a hierarchical role model with three access levels. Access rights are checked based on role weights: a role with a lower weight has more rights.

## User Roles

### SUPERUSER

Superuser with maximum access rights.

**Rights:**
- Full access to all system functions
- System settings management: changing, enabling/disabling registration and other application parameters
- Administrator assignment: changing user roles (including assigning ADMIN role)
- News management
- User password reset
- All ADMIN and USER rights

**Weight:** 0 (highest priority)

### ADMIN

Administrator with rights to manage users and configurations.

**Rights:**
- User management (viewing, verification)
- Configuration management (adding/removing time)
- Request management (applying, denying)
- Notification management (cleanup)
- Session management (token revocation, cleanup)
- XUI integration
- CRUD operations for all entities
- All USER rights

**Weight:** 1

### USER

Regular user with basic rights.

**Rights:**
- Viewing and managing own configurations
- Viewing news
- Managing own profile
- Managing own sessions
- Creating requests (verification, configuration update)

**Weight:** 2 (lowest priority)

## Role Hierarchy

### Role Weights

Roles have numeric weights for access rights comparison:

- **SUPERUSER** - weight 0 (highest)
- **ADMIN** - weight 1
- **USER** - weight 2 (lowest)

Weight is determined by the role order in the `UserRoles` enumeration.

### Access Rights Check

Rights check is based on role weight comparison:

```python
user_role_weight <= required_role_weight
```

If the user's role weight is less than or equal to the required weight - access is granted.

**Examples:**
- SUPERUSER (0) <= ADMIN (1) - access granted
- ADMIN (1) <= ADMIN (1) - access granted
- USER (2) <= ADMIN (1) - access denied

When rights are insufficient, `permission_error` (HTTP 403) is returned.

## Rights Distribution by Endpoints

### Public Endpoints

Do not require authentication:

- `GET /api/app/v1/health` - status check

### Endpoints for Authenticated Users

Require **USER** role and authentication:

- `GET /api/app/v1/settings` - application settings
- `GET /api/backend/v1/news` - news list
- `GET /api/backend/v1/client/configs` - configuration list (requires verification)
- `GET /api/backend/v1/client/configs/by-type/{type}` - get configuration (requires verification)
- `POST /api/backend/v1/client/configs/{config_id}/renew` - renewal request (requires verification)
- `POST /api/backend/v1/client/configs/{config_id}/update-limits` - update limits request (requires verification)
- All endpoints `/api/auth/v1/account/*` - account management
- All endpoints `/api/auth/v1/sessions/*` - session management

### Endpoints for Administrators

Require **ADMIN** role or higher:

- `GET /api/admin/v1/entities/*` - CRUD operations for all entities
- `GET /api/admin/v1/users/{user_id}/profile` - user profile
- `POST /api/admin/v1/users/{user_id}/verify` - user verification
- `POST /api/admin/v1/users/{user_id}/unverify` - remove verification
- `POST /api/admin/v1/configs/{config_id}/time/add` - add configuration time
- `POST /api/admin/v1/configs/{config_id}/time/remove` - remove configuration time
- `POST /api/admin/v1/requests/{request_id}/apply` - apply request
- `POST /api/admin/v1/requests/{request_id}/deny` - deny request
- `POST /api/admin/v1/notifications/cleanup` - notification cleanup
- `POST /api/admin/v1/sessions/revoke/token` - token revocation
- `POST /api/admin/v1/sessions/cleanup` - session cleanup
- `GET /api/admin/v1/xui/*` - XUI integration

### Endpoints for Superusers

Require **SUPERUSER** role:

- `PATCH /api/app/v1/settings` - update application settings
- `POST /api/admin/v1/users/{user_id}/update/role` - change user role
- `POST /api/admin/v1/users/{user_id}/password/reset` - reset user password
- `GET /api/admin/v1/entities/news` - news list (CRUD)
- `POST /api/admin/v1/entities/news` - create news
- `PATCH /api/admin/v1/entities/news/{news_id}` - update news
- `DELETE /api/admin/v1/entities/news/{news_id}` - delete news

## User Statuses

In addition to roles, users have statuses that affect access to some functions:

### NOT_VERIFIED

User is not verified (default status on registration).

**Restrictions:**
- Cannot manage configurations
- Can create verification requests

### VERIFICATION_PENDING

Verification request sent, awaiting administrator review.

### VERIFIED

User is verified by administrator.

**Access:**
- Full access to all functions according to role
- Can manage configurations

**Note:** Some endpoints require a verified user (e.g., configuration management). Check is performed via dependency `required_verified_user`.

## Role Management

### Role Assignment

On registration, user is automatically assigned **USER** role. **SUPERUSER** role is created automatically on first application startup (configured via `APP_SUPERUSER_LOGIN` and `APP_SUPERUSER_PASSWORD`).

### Role Changes

Changing user role is available only for **SUPERUSER**:

**POST** `/api/admin/v1/users/{user_id}/update/role?name={role}`

After role change, all active user sessions are automatically terminated.

### Rights Check in Code

Rights check is performed via dependency `required_role`:

```python
from src.dependencies import required_role
from src.core.enums import UserRoles

@router.get('/endpoint', dependencies=[Depends(required_role(UserRoles.ADMIN))])
async def endpoint():
    ...
```

Or programmatically:

```python
from src.utils.permission import check_required_role

check_required_role(user_role, required_role)
```

## Usage Examples

**Example 1: Endpoint for USER and above**

```python
@router.get('/configs', dependencies=[Depends(required_role(UserRoles.USER))])
async def get_configs():
    ...
```

**Example 2: Endpoint only for ADMIN and above**

```python
@router.post('/users/{user_id}/verify', dependencies=[Depends(required_role(UserRoles.ADMIN))])
async def verify_user():
    ...
```

**Example 3: Endpoint only for SUPERUSER**

```python
@router.patch('/settings', dependencies=[Depends(required_role(UserRoles.SUPERUSER))])
async def update_settings():
    ...
```

**Example 4: Programmatic Rights Check**

```python
from src.utils.permission import check_required_role

user_role = UserRoles(user.role)
check_required_role(user_role, UserRoles.ADMIN)  # Will raise PermissionError if insufficient rights
```

