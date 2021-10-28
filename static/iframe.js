/** parent window communication */
let parentSrc = ['http://localhost:3030'];

const sendMessage = (msg) => {
  //msg  = {message: { event: string, data: {key:string:string}, error: string};
  msgJSON = JSON.stringify(msg);

  window.parent.postMessage(msg, '*');
};

const registerIframeToParent = () => {
  const registration = {
    message: {
      event: 'registration',
      data: { iframeSrc: iframeSrc },
    },
  };

  sendMessage(registration);
};

const sendSubmitData = (data) => {
  const submitData = {
    message: {
      event: 'submit',
      data: getFormValuesFromSubmitEvent(data),
    },
  };

  sendMessage(submitData);
};

const registerParentToIframe = (message) => {
  /**
  {
    message: {
      event: 'registration',
      data: { parentURL: string },
    }
  }
  */
  const newParentURL = message.event.data.parentURL;
  console.log('register iframe url', newIframeURL);

  parentSrc = [...parentSrc, newParentURL];
};

const isValidOrigin = (event, externalSrc) => {
  console.log('isValidOrigin', externalSrc);
  return externalSrc.some((src) => {
    console.log('isValidOrigin', event.origin, src, event.origin === src);
    return event.origin === src;
  });
};

const parseMessageEvent = (event, externalSrc = externalIframeSrc) => {
  if (!isValidOrigin(event, externalSrc)) {
    return { error: 'message:notSecured:', message: event };
  }

  let parsedMsg;
  try {
    parsedMsg = { error: null, message: JSON.parse(event.data) };
  } catch (error) {
    parsedMsg = { error: 'message:parseError:', message: event };
  }
  return parsedMsg;
};

const getFormValueFromField = (field) => {
  return field.value;
};

const getFormValuesFromSubmitEvent = (event) => {
  console.log(`submit.target.elements:${event.target.elements}`);
  return Array.from(event.target.elements)
    .map((field) => getFormValueFromField(field))
    .join('/');
};

const logEvent = (evtType, event, valueLog = valueElement) => {
  console.log('iframe.log:', evtType, event);
  valueLog.innerHTML = `${valueLog.innerHTML}<br/>${evtType}:${
    event?.target?.id || 'none'
  }:${
    evtType === 'submit' ? getFormValuesFromSubmitEvent(event) : event
  }<br/><br/>`;
};

const logMessage = (messageJSON) => {
  if (!messageJSON.error) {
    logEvent(
      `iframe.message.${messageJSON.message.event}`,
      messageJSON.message.data,
    );
  } else {
    // logEvent('iframe.message.error', messageJSON.error);
  }
};

const messageAction = (message) => {
  logMessage(message);

  switch (message.event) {
    case 'registration':
      console.log(' message.registration.action');
      /** */
      registerParentToIframe(message);
      registerIframeToParent();
      break;
    default:
      console.log(' message.default.action');
  }
};

/** form caputre */
const attachListenerToElements = (elements, listenerType, listener) => {
  if (elements && elements.length) {
    let elementsIndex = 0;
    Array.from(elements).forEach(() => {
      console.log(
        `form.${listenerType}.add.${elementsIndex}:${elements[elementsIndex]}`,
        listener,
      );
      elements.item(elementsIndex).addEventListener(listenerType, listener);
      elementsIndex++;
    });
  }
};

const attachOnSubmitToForms = (forms) => {
  attachListenerToElements(forms, 'submit', (event) => {
    event.preventDefault();
    console.log('submit listener');
    logEvent('submit', event);
    sendSubmitData(event);
  });
};

/** capture data from page forms */

const valueElement = document.getElementById('ivalues');
const forms = document.getElementsByTagName('form');
attachOnSubmitToForms(forms);


/** parent/iframe communication */

const iframeSrc = window.location.href;
window.addEventListener(
  'message',
  (event) => {
    if (
      isValidOrigin(event, parentSrc) ||
      event?.message?.event === 'registration'
    ) {
      const parsedMsg = parseMessageEvent(event, parentSrc);
      messageAction(parsedMsg);
    }
  },
  false,
);
