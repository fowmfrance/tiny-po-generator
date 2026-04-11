

## Problem

The `redirectByRole` logic in `Auth.tsx` only fires on login events. But if `clement@sapajoo.fr` is already authenticated and navigates to `/dashboard` (or any protected route), `ProtectedRoute` simply renders the user interface without checking the role. The sidebar, layout, and dashboard all appear as a normal user.

## Plan

### 1. Update `ProtectedRoute` to redirect `admin-sapajoo` users

Modify `src/components/ProtectedRoute.tsx` to:
- After confirming a valid session, query `user_roles` for `admin-sapajoo` role
- If the user has `admin-sapajoo` role, redirect to `/backoffice` instead of rendering the children
- This ensures that no matter how they arrive at a user route (direct URL, refresh, bookmark), they get sent to the back-office

### 2. Files to change

- **`src/components/ProtectedRoute.tsx`**: Add role check after session validation. If user has `admin-sapajoo` role, return `<Navigate to="/backoffice" replace />`.

This is a small, targeted fix -- the auth redirect in `Auth.tsx` stays as-is for login flow, and `ProtectedRoute` catches all other cases.

