// Registry Types Compile-Time Guard Smoketest
// This file is NOT imported by the app - it's only used for testing the type guard
// When REGISTRY_GUARD_TEST=1, this should fail to compile with a clear error

import { FieldId } from '../src/types/registry';

// This should work fine - valid field ID
const validField: FieldId = 'preferred_pace';

// Test the guard: these should cause compile errors
// This is a deliberate type error to test the guard system

// This should fail: 'not_in_registry' is not a valid FieldId
const invalidField: FieldId = 'not_in_registry';

// This should fail: 'fake_field' is not a valid FieldId  
const anotherInvalidField: FieldId = 'fake_field';

// This should fail: 'random_string' is not a valid FieldId
const randomField: FieldId = 'random_string';

console.log('These should not compile:', {
  invalidField,
  anotherInvalidField, 
  randomField
});

export {}; // Make this a module
