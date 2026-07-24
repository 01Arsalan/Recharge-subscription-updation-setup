export const RECHARGE_API_VERSION = '2021-11';

export const WEBHOOK_TOPICS = {
  SUBSCRIPTION_CREATED: 'subscription/created',
  CHARGE_CREATED: 'charge/created',
  SUBSCRIPTION_CANCELLED: 'subscription/cancelled',
};

export const SUBSCRIPTION_AGE_THRESHOLD_HRS = 2;

export const CHARGE_STATUS = {
  QUEUED: 'QUEUED',
};

export const FULFILLMENT_TYPES = {
  REJECT: 'Reject',
  PRE_ORDER: 'Pre-order',
  NORMAL: 'Normal',
};

export const HTTP_STATUS = {
  OK: 200,
  MOVED_PERMANENTLY: 301,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
};

export const QUEUE_NAMES = {
  SUBSCRIPTION_UPDATE: 'subscription-update',
};

export const JOB_OPTIONS = {
  ATTEMPTS: 5,
  BACKOFF_DELAY_MS: 10000,
};
