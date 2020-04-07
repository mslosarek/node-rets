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

module.exports = [
  ...search,
  ...getObject,
  ...metadata,
];
