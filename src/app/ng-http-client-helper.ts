// Based on https://github.com/DevExpress/DevExtreme.AspNet.Data/blob/experiment/ng-http-client/experiments/ng-http-client-helper.js

import Deferred from 'devextreme/core/utils/deferred';
import { HttpClient } from '@angular/common/http';

export function sendRequestFactory(httpClient: HttpClient) {
  let nonce = Date.now();

  function createXhrSurrogate(response: any) {
    function getResponseHeader(name: any) {
      return response.headers.get(name);
    }

    function makeResponseText() {
      const body = 'error' in response ? response.error : response.body;

      if (typeof body !== 'string' || String(getResponseHeader('Content-Type')).indexOf('application/json') === 0) {
        return JSON.stringify(body);
      }

      return body;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      getResponseHeader,
      responseText: makeResponseText()
    };
  }

  function getAcceptHeader(options: any) {
    const dataType = options.dataType;
    const accepts = options.accepts;
    const fallback = ',*/*;q=0.01';

    if (dataType && accepts && accepts[dataType]) {
      return accepts[dataType] + fallback;
    }

    switch (dataType) {
      case 'json':
        return 'application/json, text/javascript' + fallback;
      case 'text':
        return 'text/plain' + fallback;
      case 'xml':
        return 'application/xml, text/xml' + fallback;
      case 'html':
        return 'text/html' + fallback;
      case 'script':
        return 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript' + fallback;
    }

    return '*/*';
  }

  return (options: any) => {
    const d = Deferred();

    const method = (options.method || 'get').toLowerCase();
    const headers = { ...options.headers };
    const data = options.data;
    const xhrFields = options.xhrFields;

    if (options.cache === false && method === 'get' && data) {
      data._ = nonce++;
    }

    if (!headers.Accept) {
      headers.Accept = getAcceptHeader(options);
    }

    httpClient
      .request(method, options.url, {
        params: data,
        responseType: options.dataType,
        headers,
        withCredentials: xhrFields && xhrFields.withCredentials,
        observe: 'response'
      })
      .subscribe(
        response => d.resolve(response.body, 'success', createXhrSurrogate(response)),
        response => d.reject(createXhrSurrogate(response), 'error')
      );

    return d.promise();
  };
}
