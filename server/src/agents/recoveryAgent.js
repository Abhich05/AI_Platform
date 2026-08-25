const CLASSIFICATIONS = ['MISSING_FIELDS', 'API_FAILURE', 'AUTH_EXPIRED', 'RATE_LIMIT', 'TRANSIENT'];

const MAX_RETRIES = 2;

function classify(error) {
  switch (error?.code) {
    case 'VALIDATION_FAILED':
      return 'MISSING_FIELDS';
    case 'INTEGRATION_NOT_CONNECTED':
    case 'AUTH_EXPIRED':
      return 'AUTH_EXPIRED';
    case 'RATE_LIMIT':
      return 'RATE_LIMIT';
    case 'API_FAILURE':
      return 'API_FAILURE';
    default:
      return 'TRANSIENT';
  }
}

function decide(classification, retryCount) {
  const retryable = classification === 'TRANSIENT' || classification === 'RATE_LIMIT' || classification === 'API_FAILURE';
  if (retryable && retryCount < MAX_RETRIES) {
    return 'retry_with_backoff';
  }
  return 'escalate';
}

module.exports = { classify, decide, CLASSIFICATIONS, MAX_RETRIES };
