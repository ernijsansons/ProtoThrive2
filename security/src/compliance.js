const scanPII = (data) => data.includes('email') ? 'PII Detected - Redact' : 'Safe';

async function deleteUser(id, soft = true) {
  if (soft) {
    console.log(`Thermonuclear Soft Delete ${id} - Set deleted_at`);
  } else {
    console.log(`Thermonuclear Hard Purge ${id}`);
  }
  // Mock D1 update
  console.log(scanPII('test@proto.com'));
  return { success: true, pii: scanPII('dummy') };
}

export { deleteUser, scanPII };

// Dummy call
deleteUser('uuid-thermo-1');