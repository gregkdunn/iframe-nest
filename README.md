

## Description

A basic example showing communication with iFrames. The submitted form data will be posted to the parent document using the event or message 

With the iFrame on the same domain, you can attach event listeners directly to elements from the parent document. 

With an external domain, you do not access to the elements and need to use the postMessage api (https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) for Cross-document messaging. I've setup "message" listeners in the parent and iframe windows to create a communication channel and use a basic verification of the message origin to help with security. Any data sent will be turned into a string on the sender side and parsed back to an object in the parent. 

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
