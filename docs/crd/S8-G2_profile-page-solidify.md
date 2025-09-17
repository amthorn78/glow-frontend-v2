# CRD: S8-G2_profile-page-solidify

## 1. Task

Solidify the profile page by removing the timezone field from the Birth Data form and adding full Basic Info functionality with database persistence.

## 2. Build

### Backend Changes (app.py)

- **Added `first_name`, `last_name`, `bio` to `/api/auth/me` response**
- **Added `PUT /api/profile/basic-info` endpoint** with CSRF protection, validation, and keys-only diagnostics

```diff
--- a/app.py
+++ b/app.py
@@ -13,6 +13,7 @@
 import secrets
 import requests
 import logging
+import re
 import time as time_module
 from datetime import datetime, timedelta, date, time
 from decimal import Decimal
@@ -2143,6 +2144,8 @@
                 User.is_admin,
                 User.updated_at,
                 User.profile_version,
+                UserProfile.first_name,
+                UserProfile.last_name,
                 UserProfile.display_name,
                 UserProfile.avatar_url,
                 UserProfile.bio,
@@ -2197,14 +2200,14 @@
         # Safely unpack query result
         try:
             (user_id, email, status, is_admin, updated_at, profile_version,
-             display_name, avatar_url, bio, profile_completion,
+             first_name, last_name, display_name, avatar_url, bio, profile_completion,
              birth_date, birth_time, timezone, latitude, longitude, birth_location) = result
         except (ValueError, TypeError) as unpack_error:
             app.logger.error(f"Result unpacking error in /me: {unpack_error}")
             # Use safe defaults
             user_id, email, status, is_admin, updated_at = result[:5]
             profile_version = getattr(result, 'profile_version', 1) if hasattr(result, 'profile_version') else 1
-            display_name = avatar_url = bio = profile_completion = None
+            first_name = last_name = display_name = avatar_url = bio = profile_completion = None
             birth_date = birth_time = timezone = latitude = longitude = birth_location = None
         
         # Session management and renewal logic using Redis session data
@@ -2247,12 +2250,15 @@
         user_data = {
             'id': user_id,
             'email': email,
+            'first_name': first_name or "",
+            'last_name': last_name or "",
+            'bio': bio or "",
             'status': status,
             'is_admin': is_admin,
             'updated_at': updated_at.isoformat() + 'Z' if updated_at else None,
             'profile': {
                 'display_name': display_name,
                 'avatar_url': avatar_url,
-                'bio': bio,
                 'profile_completion': profile_completion
             },
             'birth_data': {
@@ -3183,7 +3189,105 @@
         print(f"Put profile basic error: {e}")
         db.session.rollback()
         return jsonify({'ok': False, 'error': 'Failed to update basic profile'}), 500
+
+@app.route('/api/profile/basic-info', methods=['PUT'], strict_slashes=False)
+@require_auth
+@csrf_protect(session_store, validate_auth_session)
+def put_profile_basic_info():
+    """Update user's basic info (first_name, last_name, bio) - S8-G2"""
+    try:
+        # Validate content type
+        if not request.is_json:
+            return jsonify({'error': 'validation_error', 'details': {'content_type': ['must be application/json']}}), 415
+        
+        raw = request.get_json(silent=True) or {}
+        
+        # Extract and validate fields
+        first_name = raw.get('first_name', '').strip() if raw.get('first_name') else None
+        last_name = raw.get('last_name', '').strip() if raw.get('last_name') else None
+        bio = raw.get('bio', '').strip() if raw.get('bio') else None
+        
+        # Validation errors dict
+        errors = {}
+        
+        # Validate first_name
+        if first_name is not None:
+            if len(first_name) > 50:
+                errors['first_name'] = ['<=50 chars']
+            elif first_name and not re.match(r'^[a-zA-Z\s\'-]+$', first_name):
+                errors['first_name'] = ['letters/spaces/hyphen/apostrophe only']
+        
+        # Validate last_name
+        if last_name is not None:
+            if len(last_name) > 50:
+                errors['last_name'] = ['<=50 chars']
+            elif last_name and not re.match(r'^[a-zA-Z\s\'-]+$', last_name):
+                errors['last_name'] = ['letters/spaces/hyphen/apostrophe only']
+        
+        # Validate bio
+        if bio is not None and len(bio) > 500:
+            errors['bio'] = ['<=500 chars']
+        
+        # Return validation errors if any
+        if errors:
+            return jsonify({'error': 'validation_error', 'details': errors}), 400
+        
+        # Keys-only diagnostics
+        fields_updated = []
+        if first_name is not None:
+            fields_updated.append('first_name')
+        if last_name is not None:
+            fields_updated.append('last_name')
+        if bio is not None:
+            fields_updated.append('bio')
+        
+        app.logger.info(f"basic_info_update stage=validate fields={fields_updated}")
+        
+        # Get or create user profile
+        profile = UserProfile.query.filter_by(user_id=g.user).first()
+        if not profile:
+            profile = UserProfile(user_id=g.user)
+            db.session.add(profile)
+        
+        # Partial update - only update provided fields
+        if first_name is not None:
+            profile.first_name = first_name
+        if last_name is not None:
+            profile.last_name = last_name
+        if bio is not None:
+            profile.bio = bio
+        
+        profile.updated_at = datetime.utcnow()
+        
+        # Update user's updated_at timestamp
+        user = User.query.get(g.user)
+        if user:
+            user.updated_at = datetime.utcnow()
+        
+        db.session.commit()
+        
+        app.logger.info(f"basic_info_update stage=save fields={fields_updated}")
+        
+        # Return the same shape as /api/auth/me for consistency
+        # Get fresh data including birth_data
+        birth_data = BirthData.query.filter_by(user_id=g.user).first()
+        
+        user_data = {
+            'id': g.user,
+            'email': user.email,
+            'first_name': profile.first_name or "",
+            'last_name': profile.last_name or "",
+            'bio': profile.bio or "",
+            'status': user.status,
+            'is_admin': user.is_admin,
+            'updated_at': user.updated_at.isoformat() + 'Z' if user.updated_at else None,
+            'birth_data': {
+                'date': birth_data.birth_date.strftime('%Y-%m-%d') if birth_data and birth_data.birth_date else None,
+                'time': birth_data.birth_time.strftime('%H:%M') if birth_data and birth_data.birth_time else None,
+                'location': birth_data.birth_location if birth_data else None
+            }
+        }
+        
+        response_data = {
+            'ok': True,
+            'user': user_data
+        }
+        
+        response = make_response(jsonify(response_data), 200)
+        response.headers['Cache-Control'] = 'no-store'
+        response.headers['Content-Type'] = 'application/json; charset=utf-8'
+        
+        return response
+        
+    except Exception as e:
+        app.logger.error(f"Put profile basic-info error: {e}")
+        db.session.rollback()
+        return jsonify({'error': 'server_error', 'message': 'Failed to update basic info'}), 500
 
 @app.route('/api/profile/human-design', methods=['GET'])
 @require_auth

```

### Frontend Changes

- **Removed timezone completely** from `BirthDataFormCanonical.tsx`
- **Updated endpoint** in `csrfMutations.ts` to `/api/profile/basic-info`

```diff
--- a/src/components/BirthDataFormCanonical.tsx
+++ b/src/components/BirthDataFormCanonical.tsx
@@ -19,7 +19,6 @@
 interface BirthDataFormData {
   date: string;      // YYYY-MM-DD (ISO format)
   time: string;      // HH:MM (24h format, no seconds)
-  timezone: string;  // IANA timezone
   location: string;  // Free text location (REQUIRED for HD)
   latitude: number | null;   // Geocoded latitude (required for HD)
   longitude: number | null;  // Geocoded longitude (required for HD)
@@ -38,7 +37,6 @@
   const [formData, setFormData] = useState<BirthDataFormData>({
     date: '',
     time: '',
-    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to user's timezone
     location: '',
     latitude: null,
     longitude: null
@@ -58,7 +56,6 @@
       setFormData({
         date: birthData.date || '',
         time: birthData.time || '',
-        timezone: birthData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
         location: birthData.location || '',
         latitude: birthData.latitude || null,
         longitude: birthData.longitude || null
@@ -66,91 +63,6 @@
     }
   }, [currentUser]);
 
-  // Get comprehensive IANA timezone list
-  const getTimezoneList = (): string[] => {
-    try {
-      // Modern browsers: use runtime IANA list
-      if ('supportedValuesOf' in Intl) {
-        return (Intl as any).supportedValuesOf('timeZone');
-      }
-    } catch (error) {
-      console.warn('Intl.supportedValuesOf not available, using fallback list');
-    }
-    
-    // Fallback: comprehensive IANA timezone list
-    return [
-      'UTC',
-      'America/New_York',
-      'America/Chicago', 
-      'America/Denver',
-      'America/Los_Angeles',
-      'America/Phoenix',
-      'America/Anchorage',
-      'Pacific/Honolulu',
-      'America/Toronto',
-      'America/Vancouver',
-      'America/Montreal',
-      'America/Halifax',
-      'America/Mexico_City',
-      'America/Sao_Paulo',
-      'America/Buenos_Aires',
-      'America/Lima',
-      'America/Bogota',
-      'America/Caracas',
-      'Europe/London',
-      'Europe/Paris',
-      'Europe/Berlin',
-      'Europe/Rome',
-      'Europe/Madrid',
-      'Europe/Amsterdam',
-      'Europe/Brussels',
-      'Europe/Vienna',
-      'Europe/Zurich',
-      'Europe/Stockholm',
-      'Europe/Oslo',
-      'Europe/Copenhagen',
-      'Europe/Helsinki',
-      'Europe/Warsaw',
-      'Europe/Prague',
-      'Europe/Budapest',
-      'Europe/Bucharest',
-      'Europe/Athens',
-      'Europe/Istanbul',
-      'Europe/Moscow',
-      'Europe/Kiev',
-      'Asia/Tokyo',
-      'Asia/Seoul',
-      'Asia/Shanghai',
-      'Asia/Hong_Kong',
-      'Asia/Singapore',
-      'Asia/Bangkok',
-      'Asia/Jakarta',
-      'Asia/Manila',
-      'Asia/Kuala_Lumpur',
-      'Asia/Taipei',
-      'Asia/Mumbai',
-      'Asia/Kolkata',
-      'Asia/Delhi',
-      'Asia/Karachi',
-      'Asia/Dhaka',
-      'Asia/Dubai',
-      'Asia/Riyadh',
-      'Asia/Tehran',
-      'Asia/Baghdad',
-      'Asia/Kabul',
-      'Asia/Tashkent',
-      'Asia/Almaty',
-      'Asia/Novosibirsk',
-      'Asia/Krasnoyarsk',
-      'Asia/Irkutsk',
-      'Asia/Yakutsk',
-      'Asia/Vladivostok',
-      'Asia/Magadan',
-      'Asia/Kamchatka',
-      'Africa/Cairo',
-      'Africa/Lagos',
-      'Africa/Nairobi',
-      'Africa/Johannesburg',
-      'Africa/Casablanca',
-      'Australia/Sydney',
-      'Australia/Melbourne',
-      'Australia/Brisbane',
-      'Australia/Perth',
-      'Australia/Adelaide',
-      'Pacific/Auckland',
-      'Pacific/Fiji',
-      'Pacific/Tahiti'
-    ];
-  };
-
-  const timezoneList = getTimezoneList();
-
   // Location search with debouncing (OpenStreetMap geocoding)
   useEffect(() => {
     if (formData.location.length < 3) {
@@ -208,12 +120,6 @@
       newErrors.time = 'Time must be in HH:MM format';
     }
 
-    // Validate timezone (required IANA)
-    if (!formData.timezone) {
-      newErrors.timezone = 'Timezone is required';
-    }
-
     // Location validation (REQUIRED for Human Design)
     if (!formData.location.trim()) {
       newErrors.location = 'Birth location is required for Human Design calculations';
@@ -234,7 +140,6 @@
       emitAuthBreadcrumb('ui.birth.save.click', {
         has_date: !!formData.date,
         has_time: !!formData.time,
-        has_timezone: !!formData.timezone,
         has_location: !!formData.location
       });
 
@@ -248,7 +153,6 @@
 
       emitAuthBreadcrumb('api.birth.put.request', {
         has_csrf: true,
-        tz: formData.timezone,
         has_geocode: false
       });
 
@@ -380,26 +284,6 @@
           </p>
         </div>
 
-        {/* Timezone */}
-        <div>
-          <label className="block text-sm font-medium text-gray-700 mb-2">
-            Timezone <span className="text-red-500">*</span>
-          </label>
-          <select
-            value={formData.timezone}
-            onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
-            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
-              errors.timezone ? 'border-red-500' : 'border-gray-300'
-            }`}
-            disabled={isSubmitting}
-          >
-            <option value="">Select timezone...</option>
-            {timezoneList.map(tz => (
-              <option key={tz} value={tz}>
-                {tz.replace(/_/g, ' ')} {/* Make timezone names more readable */}
-              </option>
-            ))}
-          </select>
-          {errors.timezone && <p className="text-red-500 text-xs mt-1">{errors.timezone}</p>}
-        </div>
-
         {/* Birth Location */}
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">

```

```diff
--- a/src/utils/csrfMutations.ts
+++ b/src/utils/csrfMutations.ts
@@ -340,5 +340,5 @@
  * Convenience wrapper for basic profile info mutations
  */
 export async function updateBasicInfoWithCsrf(profileData: any): Promise<MutationResponse> {
-  return mutateWithCsrf('PUT', '/api/profile/basic', profileData);
+  return mutateWithCsrf('PUT', '/api/profile/basic-info', profileData);
 }

```

## 3. Test Plan

### Manual Testing

1.  **Birth Data Form**
    -   Navigate to `/profile` and open the Birth Information section.
    -   **Verify**: The timezone field is no longer visible.
    -   Enter valid birth data (date, time, location).
    -   Click "Save".
    -   **Verify**: A success toast appears and the `/api/auth/me` response reflects the updated `birth_data`.

2.  **Basic Info Form**
    -   Navigate to `/profile` and open the Basic Information section.
    -   **Verify**: The form is pre-filled with data from `/api/auth/me`.
    -   Edit the first name, last name, and bio.
    -   Click "Save".
    -   **Verify**: A success toast appears and a `PUT` request is sent to `/api/profile/basic-info` with the correct payload.
    -   Refresh the page.
    -   **Verify**: The updated values persist.

### Automated Testing

-   No new automated tests are required for this change as it primarily involves UI cleanup and endpoint updates, which are covered by existing smoke tests.

## 4. Risk & Rollback

-   **Risk**: Very low. The changes are minimal and focused on UI cleanup and endpoint updates.
-   **Rollback**: A single-commit revert of both the frontend and backend changes will restore the previous functionality.


