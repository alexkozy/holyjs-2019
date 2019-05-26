(async() => {
  // clone pptr repo, run npm install there ..
  // .. run unit tests using `NODE_OPTIONS=--inspect-brk=0 npm run unit` ..
  const cri = require('chrome-remote-interface');
  // .. connect to first process, pass port from terminal here ..
  const connection1 = await cri({port: PORT1});
  // ... run npm process ...
  await connection1.Runtime.runIfWaitingForDebugger();

  // .. connect to second process, pass port from terminal here ..
  const connection2 = await cri({port: PORT2});
  // ... start profiler ...
  await connection2.Profiler.enable();
  await connection2.Profiler.start();
  // (try connection2.HeapProfiler.startSampling() as well)
  // ... run tests ...
  await connection2.Runtime.runIfWaitingForDebugger();
  // (try connection2.HeapProfiler.stopSampling() as well)
  // ... wait until tests done ....
  // ... get result and store it to the file ...
  // ... you can open this file using Performance tab of any available DevTools frontend
  const result = await connection2.Profiler.stop();
  require('fs').writeFileSync('a.cpuprofile', JSON.stringify(result.profile), 'utf8')

  // ... close connections ...
  await connection2.close();
  await connection1.close();
})()