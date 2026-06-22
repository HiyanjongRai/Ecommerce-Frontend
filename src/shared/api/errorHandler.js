const mapBackendErrorCodeToMessage = {
  AUTHENTICATION_FAILED: 'Your session expired. Please sign in again.',
  USER_NOT_FOUND: 'Your session expired. Please sign in again.',
  ACCESS_DENIED: 'You do not have permission to perform this action.',
  AUTHORIZATION_DENIED: 'You do not have permission to access this resource.',
  ROLE_ACCESS_DENIED: 'You do not have permission to perform this action.',
  RESOURCE_NOT_FOUND: 'Requested data could not be found.',
  ROUTE_NOT_FOUND: 'Requested data could not be found.',
  VALIDATION_ERROR: 'Please correct the highlighted fields and try again.',
  VALIDATION_FAILED: 'Please correct the highlighted fields and try again.',
  CONSTRAINT_VIOLATION: 'Invalid data was provided. Please review your input.',
  ORDER_STATE_CONFLICT: 'This order cannot be updated in its current status.',
  DATA_CONFLICT: 'The request conflicts with existing data.',
  RESOURCE_BUSY: 'The resource is being updated. Please retry shortly.',
  METHOD_NOT_ALLOWED: 'This action is not allowed.',
  MISSING_PARAMETER: 'The request is missing required information.',
  INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again later.',
};

export function getApiErrorMessage(error) {
  if (!error) return 'An unknown error occurred.';

  const response = error.response || error?.response;
  if (response) {
    const { data, status } = response;

    if (status === 0 || status === 502 || status === 503 || status === 504) {
      return 'The server is unavailable. Please try again in a moment.';
    }

    if (data?.success === false && data?.message) {
      return data.message;
    }

    if (data?.errorCode && mapBackendErrorCodeToMessage[data.errorCode]) {
      return mapBackendErrorCodeToMessage[data.errorCode];
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (typeof data?.error === 'string' && data.error.trim()) {
      return data.error;
    }

    if (data?.errors) {
      const firstError = Array.isArray(data.errors)
        ? data.errors[0]
        : Object.values(data.errors)[0];
      if (typeof firstError === 'string') {
        return firstError;
      }
      if (firstError?.message) {
        return firstError.message;
      }
    }

    return 'Something went wrong. Please try again later.';
  }

  if (error.request) {
    return 'Connection lost. Please check your internet and try again.';
  }

  return error.message || 'An unknown error occurred.';
}

export function attachApiErrorMessage(error) {
  const userMessage = getApiErrorMessage(error);
  return {
    ...error,
    userMessage,
    apiErrorMessage: userMessage,
  };
}

