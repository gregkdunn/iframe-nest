const parentSrc = window.location.href;
let externalIframeSrc = ['https://gregkdunn-test.neocities.org'];

/** utility */

const isExternalURL = (url, currentHost = parentSrc) => {
  console.log(
    'isExternalURL',
    url,
    currentHost,
    url.includes(currentHost),
    url.startsWith('./'),
  );

  return !(url.includes(currentHost) || url.startsWith('./'));
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
  console.log('log:', evtType, event);
  valueLog.innerHTML = `${valueLog.innerHTML}<div class="event">
  <h3>event.${evtType}</h3><p class="origin">${parentSrc}<br/>${
    event?.target?.id || 'none'
  }</p>
  <p class="values">${
    evtType === 'submit' ? getFormValuesFromSubmitEvent(event).replaceAll('/', '<br/>') : event
  }</p></div>`;
};

const logExternalEvent = (origin, evtType, event, valueLog = valueElement) => {
  console.log('exlog:', origin, evtType, event);
  valueLog.innerHTML = `${
    valueLog.innerHTML
  }<div class="message"><h3>${evtType}</h3><p class="origin">${origin}</p>
  <p class="values">${
    event.replaceAll('/', '<br/>')
  }</p></div>`;
};

/** iframe */
const getIframeWindow = (iframe) => {
  return iframe.contentWindow;
};

const getIframeDocument = (iframe) => {
  try {
    return getIframeWindow(iframe).document;
  } catch (error) {
    return null;
  }
};

const attachOnLoadListenerToIframe = (eventHandler) => {
  return (iframe) => {
    if (!eventHandler || !iframe) {
      return;
    }

    const iframeDocument = getIframeDocument(iframe);

    if (iframeDocument.readyState === 'complete') {
      console.log('iframe ready === complete');
      eventHandler(iframe);
    }
    getIframeWindow(iframe).addEventListener('load', () => {
      console.log('iframe loaded');
      eventHandler(iframe);
    });
  };
};

const getElementsInIframe = (elementType) => {
  return (iframe) => {
    //create context
    const context = getIframeDocument(iframe).body;
    console.log('context', context);

    // check for forms
    const nodeList = context.getElementsByTagName(elementType);
    console.log(elementType, nodeList);
    return nodeList;
  };
};

const attachListenerToElements = (elements, listenerType, listener) => {
  console.log('attachListenerToElements', elements, listenerType);
  if (elements && elements.length) {
    let elementsIndex = 0;
    Array.from(elements).forEach(() => {
      console.log(
        `form.${listenerType}.add.${elementsIndex}:${elements[elementsIndex]}`,
      );
      elements.item(elementsIndex).addEventListener(listenerType, listener);
      elementsIndex++;
    });
  }
};

const attachOnSubmitToForms = (forms) => {
  attachListenerToElements(forms, 'submit', (event) => {
    event.preventDefault();
    logEvent('submit', event);
  });
};

const getFormsInIframe = (iframe) => {
  console.log('getForms.iframe', iframe);
  if (!iframe) {
    return;
  }

  const forms = getElementsInIframe('form')(iframe);
  console.log(` = forms:${forms.length}:${forms}`);

  if (forms && forms.length) {
    attachOnSubmitToForms(forms);
  }
};

/** external iframe communication */

const sendMessage = (iframe, msg) => {
  console.log('sendMessage', iframe, msg);
  //msg  = {message: { event: string, data: {key:string:string}, error: string};
  msgJSON = JSON.stringify(msg);
  /** TODO try/catch for JSON error */

  iframe.contentWindow.postMessage(msgJSON, '*');
};

const registerParentWithIframe = (iframe, parentURL) => {
  console.log('registerParentWithIframe', iframe, parentURL);
  const registration = {
    message: {
      event: 'registration',
      data: { parentURL: parentURL },
    },
  };

  sendMessage(iframe, registration);
};

const addExternalIframeSrc = (newIframeURL) => {
  externalIframeSrc = [...externalIframeSrc, newIframeURL];
  console.log('addExternalIframeSrc', newIframeURL, externalIframeSrc);
};

const registerIframeWithParent = (message) => {
  console.log('registerIframeWithParent', message);
  /**
  {
    message: {
      event: 'registration',
      data: { iframeSrc: string },
    }
  }
  */
  const newIframeURL = message.event.data.iframeURL;
  console.log('register iframe url', newIframeURL);

  addExternalIframeSrc(newIframeURL);
};

const isValidOrigin = (event, externalSrc) => {
  //console.log('isValidOrigin', externalSrc);
  return externalSrc.some((src) => {
    //console.log('isValidOrigin', event.origin, src, event.origin === src);
    return event.origin === src;
  });
};

const parseMessageEvent = (event, externalSrc = externalIframeSrc) => {
  if (!isValidOrigin(event, externalSrc)) {
    return { error: 'message:notSecured:', message: event };
  }

  let parsedMsg;
  try {
    console.log('event.data', event.data);
    parsedMsg = { error: null, message: event };
  } catch (error) {
    console.log('error', error);
    parsedMsg = { error: 'message:parseError:', message: event };
  }
  return parsedMsg;
};

const messageAction = (message) => {
  logMessage(message);

  switch (message.event) {
    case 'registration':
      console.log(' message.registration.action');
      /** */
      registerExternalIframeWithParent(message);
      break;
    case 'submit':
      console.log(' message.submit.action');
      /** Send to CallRail */
      break;
    default:
      console.log('message.default.action');
    /** Error Handling */
  }
};

const logMessage = (messageJSON) => {
  if (messageJSON.error === null) {
    logExternalEvent(
      messageJSON.message.origin,
      `message.${messageJSON.message.data.message.event}`,
      messageJSON.message.data.message.data,
    );
  } else {
    logExternalEvent('message.error', messageJSON.error);
  }
};

/**
 * main window script
 */

const valueElement = document.getElementById('values');

/** capture data from page forms */
const forms = document.getElementsByTagName('form');
attachOnSubmitToForms(forms);

/** capture data from local iframe forms */
const iframes = document.getElementsByTagName('iframe');
if (iframes && iframes.length) {
  let iframesIndex = 0;
  Array.from(iframes).forEach(() => {
    const iframe = iframes.item(iframesIndex);
    console.log('window.iframe', iframe);
    attachOnLoadListenerToIframe(() => {
      console.log('window.iframe.loaded', iframe);
      if (isExternalURL(iframe.src, window.location.origin)) {
        console.log('window.iframe.loaded.isExternalFrame', iframe);
        addExternalIframeSrc(iframe.src);
        registerParentWithIframe(iframe, parentSrc);
      } else {
        console.log('window.iframe.loaded.isNOTExternalFrame', iframe);
        getFormsInIframe(iframe);
      }
    })(iframe);
    iframesIndex++;
  });
}

/** parent/iframe communication */
window.addEventListener(
  'message',
  (event) => {
    // console.log('window.message.string...', event);
    if (isValidOrigin(event, externalIframeSrc)) {
      console.log('>>>REGISTERED-ORIGIN');
      const parsedMsg = parseMessageEvent(event);
      messageAction(parsedMsg);
    }
  },
  false,
);
