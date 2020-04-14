# node-rets
<p>
	<a href="https://snyk.io/test/github/mslosarek/node-rets?targetFile=package.json"><img src="https://snyk.io/test/github/mslosarek/node-rets/badge.svg?targetFile=package.json" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/mslosarek/node-rets?targetFile=package.json" style="max-width:100%;"></a>
	<a href="https://coveralls.io/github/mslosarek/node-rets?branch=master"><img src="https://coveralls.io/repos/github/mslosarek/node-rets/badge.svg?branch=master" alt="Coverage Status" /></a>
	<a href="https://github.com/mslosarek/node-rets/issues"><img src="https://img.shields.io/github/issues/mslosarek/node-rets.svg" alt="Issues"></a>
</p>

## About

A node library to connect to Real Estate Transaction Standard (RETS) server. This is highly influenced by the [rets-client by sbruno81](https://github.com/sbruno81/rets-client) but without any native bindings. 

### Limitations

At the current state, this library is unfinished and has support for limited functions (see usage below). Additionally, it currently only uses `GET` requests to connect to the RETS server. Lastly, I only have a single RETS server to test against, and while the code is fully tested, it is not feature complete and may not work for every RETS server. Any additional test servers are welcome and I will develop to them. Any issues or request should be directed toward the [Github Issue Tracking](https://github.com/mslosarek/node-rets/issues).

## Usage

### Initialize a Client
```
const client = RETS.initialize({
  loginUrl: 'http://retsserver.com/login',
  username: 'RETSUsername',
  password: 'R3T5P@SSW0RD',
  version: 'RETS/1.8',
  userAgent: 'node-rets/0.0',
  userAgentPassword: '123456',
  // log level 'error', 'warn', 'info', 'debug'
  logLevel: 'debug',
});
```

### Metadata
```

const classesMetadata = await client.metadata('CLASS');
// Resource from classesMetadata
const classMetadataProperty = await client.metadata('CLASS', 'Property');
```

### Search
```
const query = '(ModificationTimestamp=2020-03-17T01:19:11+)'; // DMQL2 query
const resourceType = classMetadataProperty.Resource;
const classType = classMetadataProperty.Objects[0].ClassName;
const flattenResult = true;
const searchProperties = await client.search(resourceType, classType, query, { limit: 1, offset: 1 }, flattenResult);
```

### GetObject
```
const objectIds = `${searchProperties.Objects[0].ListingKey}:*`;
const returnLocation = 1;
const objectData = '*';
const propertyPhotos = await client.getObject('Property', 'Photo', objectIds, returnLocation, objectData);
```

### Logout
```
await client.logout();
```