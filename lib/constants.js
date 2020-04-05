const DEFAULTS = {
  RETS_VERSION: 'RETS/1.7.2',
  USER_AGENT: 'RETS node-rets/0.0.1',
};

const URL_KEY_MAPPING = {
  ACTION: 'Action',
  CHANGE_PASSWORD: 'ChangePassword',
  GET_OBJECT: 'GetObject',
  LOGIN: 'Login',
  LOGIN_COMPLETE: 'LoginComplete',
  LOGOUT: 'Logout',
  SEARCH: 'Search',
  GET_METADATA: 'GetMetadata',
  UPDATE: 'Update',
};

const LOGIN_RESPONSE_KEYS = [
  'MemberName',
  'User',
  'Broker',
  'MetadataVersion',
  'MetadataTimestamp',
  'MinMetadataTimestamp',
  'OfficeList',
  'TimeoutSeconds',
];

module.exports = {
  DEFAULTS,
  URL_KEY_MAPPING,
  LOGIN_RESPONSE_KEYS,
};
