// Стандартное начало..
cri = require('chrome-remote-interface')
// .. подсоединимся к Хрому, показать chrome://version - самый простой способ найти command line..
connection = await cri({port: 9224})
// .. придумаем URL для нашего приложения ..
appUrl = 'https://mycoolapp/';
// .. попробуем туда сходить ..
connection.Page.navigate({url: appUrl})

// .. включим совсем новый домен Fetch ..
await connection.Fetch.enable({patterns:[{urlPattern: appUrl + '*'}]})
// .. напишем забавный код для того, чтобы перехватывать запросы ..
connection.Fetch.requestPaused(({requestId, request:{url}}) => {
  if (url.startsWith(appUrl)) {
    const filename = path.join(__dirname, 'coolapp', url.substring(appUrl.length) || 'index.html');
    if (fs.existsSync(filename)) {
        const body = fs.readFileSync(filename, 'base64');
        const responseHeaders = [{ name: 'content-type', value: 'text/html' }];
        connection.Fetch.fulfillRequest({responseCode: 200, requestId, body, responseHeaders});
        return;
    }
  }
  connection.Fetch.continueRequest({requestId});
})

// .. попробуем туда сходить ..
connection.Page.navigate({url: appUrl})

// .. подключим настоящий хардкор ..
si = require('systeminformation')
async function systeminfo() {
  const info = {};
  await Promise.all([
    si.battery().then(r => info.battery = r),
    si.cpu().then(r => info.cpu = r),
    si.osInfo().then(r => info.osInfo = r),
  ]);
  return info;
}

// .. включим Runtime и добавим биндинг ..
// .. нужно показать содержание странички ..
connection.Runtime.enable();
connection.Runtime.addBinding({name: 'onloadBackend'});
connection.Runtime.bindingCalled(async({name}) => {
  if (name === 'onloadBackend') {
    connection.Runtime.evaluate({expression: 'show(' + JSON.stringify(await systeminfo()) + ')'});
  }
});

// ... огонь! ...
connection.Page.navigate({url: appUrl})
// .. перезагрузим страничку.
