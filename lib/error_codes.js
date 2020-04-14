const http = [
  {
    code: '100',
    message: 'Continue',
  },
  {
    code: '101',
    message: 'Switching Protocols',
  },
  {
    code: '102',
    message: 'Processing',
  },
  {
    code: '200',
    message: 'OK',
  },
  {
    code: '201',
    message: 'Created',
  },
  {
    code: '202',
    message: 'Accepted',
  },
  {
    code: '203',
    message: 'Non-authoritative Information',
  },
  {
    code: '204',
    message: 'No Content',
  },
  {
    code: '205',
    message: 'Reset Content',
  },
  {
    code: '206',
    message: 'Partial Content',
  },
  {
    code: '207',
    message: 'Multi-Status',
  },
  {
    code: '208',
    message: 'Already Reported',
  },
  {
    code: '226',
    message: 'IM Used',
  },
  {
    code: '300',
    message: 'Multiple Choices',
  },
  {
    code: '301',
    message: 'Moved Permanently',
  },
  {
    code: '302',
    message: 'Found',
  },
  {
    code: '303',
    message: 'See Other',
  },
  {
    code: '304',
    message: 'Not Modified',
  },
  {
    code: '305',
    message: 'Use Proxy',
  },
  {
    code: '307',
    message: 'Temporary Redirect',
  },
  {
    code: '308',
    message: 'Permanent Redirect',
  },
  {
    code: '400',
    message: 'Bad Request',
  },
  {
    code: '401',
    message: 'Unauthorized',
  },
  {
    code: '402',
    message: 'Payment Required',
  },
  {
    code: '403',
    message: 'Forbidden',
  },
  {
    code: '404',
    message: 'Not Found',
  },
  {
    code: '405',
    message: 'Method Not Allowed',
  },
  {
    code: '406',
    message: 'Not Acceptable',
  },
  {
    code: '407',
    message: 'Proxy Authentication Required',
  },
  {
    code: '408',
    message: 'Request Timeout',
  },
  {
    code: '409',
    message: 'Conflict',
  },
  {
    code: '410',
    message: 'Gone',
  },
  {
    code: '411',
    message: 'Length Required',
  },
  {
    code: '412',
    message: 'Precondition Failed',
  },
  {
    code: '413',
    message: 'Payload Too Large',
  },
  {
    code: '414',
    message: 'Request-URI Too Long',
  },
  {
    code: '415',
    message: 'Unsupported Media Type',
  },
  {
    code: '416',
    message: 'Requested Range Not Satisfiable',
  },
  {
    code: '417',
    message: 'Expectation Failed',
  },
  {
    code: '418',
    message: 'I\'m a teapot',
  },
  {
    code: '421',
    message: 'Misdirected Request',
  },
  {
    code: '422',
    message: 'Unprocessable Entity',
  },
  {
    code: '423',
    message: 'Locked',
  },
  {
    code: '424',
    message: 'Failed Dependency',
  },
  {
    code: '426',
    message: 'Upgrade Required',
  },
  {
    code: '428',
    message: 'Precondition Required',
  },
  {
    code: '429',
    message: 'Too Many Requests',
  },
  {
    code: '431',
    message: 'Request Header Fields Too Large',
  },
  {
    code: '444',
    message: 'Connection Closed Without Response',
  },
  {
    code: '451',
    message: 'Unavailable For Legal Reasons',
  },
  {
    code: '499',
    message: 'Client Closed Request',
  },
  {
    code: '500',
    message: 'Internal Server Error',
  },
  {
    code: '501',
    message: 'Not Implemented',
  },
  {
    code: '502',
    message: 'Bad Gateway',
  },
  {
    code: '503',
    message: 'Service Unavailable',
  },
  {
    code: '504',
    message: 'Gateway Timeout',
  },
  {
    code: '505',
    message: 'HTTP Version Not Supported',
  },
  {
    code: '506',
    message: 'Variant Also Negotiates',
  },
  {
    code: '507',
    message: 'Insufficient Storage',
  },
  {
    code: '508',
    message: 'Loop Detected',
  },
  {
    code: '510',
    message: 'Not Extended',
  },
  {
    code: '511',
    message: 'Network Authentication Required',
  },
  {
    code: '599',
    message: 'Network Connect Timeout Error',
  },
];
const login = [
  {
    code: '20003',
    message: 'Zero Balance',
    description: 'The user has zero balance left in their account.',
  },
  {
    code: '20012',
    message: 'Broker Code Required',
    description: 'The user belongs to multiple broker codes and one must be supplied as part of the login. '
    + 'The broker list is sent back to the client as part of the login response (see section 4.6).',
  },
  {
    code: '20013',
    message: 'Broker Code Invalid',
    description: 'The Broker Code sent by the client is not valid or not valid for the user',
  },
  {
    code: '20022',
    message: 'Additional login not permitted',
    description: 'There is already a user logged in with this user name, and this server does not permit multiple logins.',
  },
  {
    code: '20036',
    message: 'Miscellaneous server login error',
    description: 'The quoted-string of the body-start-line contains text that SHOULD be displayed to the user',
  },
  {
    code: '20037',
    message: 'Client authentication failed.',
    description: 'The server requires the use of a client password (section 4.1.2), and the client either '
    + 'did not supply the correct client password or did not properly compute its challenge response value.',
  },
  {
    code: '20050',
    message: 'Server Temporarily Disabled',
    description: 'The server is temporarily offline. The user should try again later',
  },
];
const search = [
  {
    code: '20200',
    message: 'Unknown Query Field',
    description: 'The query could not be understood due to an unknown field name.',
  },
  {
    code: '20201',
    message: 'No Records Found',
    description: 'No matching records were found.',
  },
  {
    code: '20202',
    message: 'Invalid Select',
    description: 'The Select statement contains field names that are not recognized by the server.',
  },
  {
    code: '20203',
    message: 'Miscellaneous Search Error',
    description: 'The quoted-string of the body-start-line contains text that MAY be displayed to the user.',
  },
  {
    code: '20206',
    message: 'Invalid Query Syntax',
    description: 'The query could not be understood due to a syntax error.',
  },
  {
    code: '20207',
    message: 'Unauthorized Query',
    description: 'The query could not be executed because it refers to a field to which the supplied login does not grant access.',
  },
  {
    code: '20208',
    message: 'Maximum Records Exceeded',
    description: 'Operation successful, but all of the records have not been returned. This reply code indicates that the maximum '
    + 'records allowed to be returned by the server have been exceeded. Note: reaching/exceeding the "Limit" value in the client '
    + 'request is not a cause for the server to generate this error.',
  },
  {
    code: '20209',
    message: 'Timeout',
    description: 'The request timed out while executing',
  },
  {
    code: '20210',
    message: 'Too many outstanding queries',
    description: 'The user has too many outstanding queries and new queries will not be accepted at this time.',
  },
  {
    code: '20211',
    message: 'Query too complex',
    description: 'The query is too complex to be processed. For example, the query contains too many nesting levels or too many '
    + 'values for a lookup field.',
  },
  {
    code: '20212',
    message: 'Invalid key request',
    description: 'The transaction does not meet the server’s requirements for the use of the Key option.',
  },
  {
    code: '20213',
    message: 'Invalid Key',
    description: 'The transaction uses a key that is incorrect or is no longer valid. Servers are not required to detect all '
    + 'possible invalid key values.',
  },
  {
    code: '20514',
    message: 'Requested DTD version unavailable.',
    description: 'The client has requested the metadata in STANDARD-XML format using a DTD version that the server cannot provide.',
  },
];
const getObject = [
  {
    code: '20400',
    message: 'Invalid Resource',
    description: 'The request could not be understood due to an unknown resource.',
  },
  {
    code: '20401',
    message: 'Invalid Type',
    description: 'The request could not be understood due to an unknown object type for the resource.',
  },
  {
    code: '20402',
    message: 'Invalid Identifier',
    description: 'The identifier does not match the KeyField of any data in the resource.',
  },
  {
    code: '20403',
    message: 'No Object Found',
    description: 'No matching object was found to satisfy the request.',
  },
  {
    code: '20406',
    message: 'Unsupported MIME type',
    description: 'The server cannot return the object in any of the requested MIME types.',
  },
  {
    code: '20407',
    message: 'Unauthorized Retrieval',
    description: 'The object could not be retrieved because it requests an object to which the supplied login does not grant access.',
  },
  {
    code: '20408',
    message: 'Resource Unavailable',
    description: 'The requested resource is currently unavailable.',
  },
  {
    code: '20409',
    message: 'Object Unavailable',
    description: 'The requested object is currently unavailable.',
  },
  {
    code: '20410',
    message: 'Request Too Large',
    description: 'No further objects will be retrieved because a system limit was exceeded.',
  },
  {
    code: '20411',
    message: 'Timeout',
    description: 'The request timed out while executing',
  },
  {
    code: '20412',
    message: 'Too many outstanding requests',
    description: 'The user has too many outstanding requests and new requests will not be accepted at this time.',
  },
  {
    code: '20413',
    message: 'Miscellaneous error',
    description: 'The server encountered an internal error.',
  },
];
const metadata = [
  {
    code: '20500',
    message: 'Invalid Resource',
    description: 'The request could not be understood due to an unknown resource.',
  },
  {
    code: '20501',
    message: 'Invalid Type',
    description: 'The request could not be understood due to an unknown metadata type.',
  },
  {
    code: '20502',
    message: 'Invalid Identifier',
    description: 'The identifier is not known inside the specified resource.',
  },
  {
    code: '20503',
    message: 'No Metadata Found',
    description: 'No matching metadata of the type requested was found.',
  },
  {
    code: '20506',
    message: 'Unsupported Mimetype',
    description: 'The server cannot return the metadata in any of the requested MIME types.',
  },
  {
    code: '20507',
    message: 'Unauthorized Retrieval',
    description: 'The metadata could not be retrieved because it requests metadata to which '
    + 'the supplied login does not grant access (e.g. Update Type data).',
  },
  {
    code: '20508',
    message: 'Resource Unavailable',
    description: 'The requested resource is currently unavailable.',
  },
  {
    code: '20509',
    message: 'Metadata Unavailable',
    description: 'The requested metadata is currently unavailable.',
  },
  {
    code: '20510',
    message: 'Request Too Large',
    description: 'Metadata could not be retrieved because a system limit was exceeded.',
  },
  {
    code: '20511',
    message: 'Timeout',
    description: 'The request timed out while executing.',
  },
  {
    code: '20512',
    message: 'Too many outstanding requests',
    description: 'The user has too many outstanding requests and new requests will not be '
    + 'accepted at this time.',
  },
  {
    code: '20513',
    message: 'Miscellaneous error',
    description: 'The server encountered an internal error.',
  },
  {
    code: '20514',
    message: 'Requested DTD version unavailable.',
    description: 'The client has requested the metadata in STANDARD-XML format using a DTD version that the server cannot provide.',
  },
];
const logout = [
  {
    code: '20701',
    message: 'Not logged in',
    description: 'The server did not detect an active login for the session in which the Logout transaction was submitted.',
  },
  {
    code: '20702',
    message: 'Miscellaneous error.',
    description: 'The transaction could not be completed. The ReplyText gives additional information.',
  },
];

module.exports = [
  ...http,
  ...login,
  ...search,
  ...getObject,
  ...metadata,
  ...logout,
];
