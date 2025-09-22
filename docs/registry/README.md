# Registry Documentation

This directory contains the canonical definition for all data fields used in the Glow application.

## Field ID Type Safety

To ensure type safety and prevent the use of arbitrary string literals for field keys, the build process automatically generates a `FieldId` type from `fields_v1.json`.

**Rule:** For any code that references a field key, you **MUST** use the `FieldId` type. Using a string literal that is not a valid `FieldId` will cause the build to fail.

**Example:**

```typescript
import { FieldId } from 'src/types/registry';

// Correct:
const myField: FieldId = 'preferred_pace';

// Incorrect (will fail build):
const myInvalidField: FieldId = 'some_random_field_name';
```

This compile-time guard ensures that all field references are valid and consistent with the central registry.
