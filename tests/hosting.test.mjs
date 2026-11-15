import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {io} from 'socket.io-client';

test('separate frontend origin can connect, while unlisted origins get no CORS grant',{timeout:12000},async()=>{
 const origin='https://midnight-manor-harshil.flourishingbraid2.chatgpt.site';
 const child=fork(new URL('../server.mjs',import.meta.url),['--production'],{silent:true,env:{...process.env,PORT:'5228',HOST:'127.0.0.1',CLIENT_ORIGIN:origin}});
 let output='';child.stdout.on('data',s=>output+=s);child.stderr.on('data',s=>output+=s);
 let socket;
 try{
  for(let i=0;i<100&&!output.includes('http://');i++)await new Promise(r=>setTimeout(r,30));
  assert(output.includes('http://'),output);
  const base='http://127.0.0.1:5228/socket.io/?EIO=4&transport=polling';
  const allowed=await fetch(base,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'GET'}});
  assert.equal(allowed.headers.get('access-control-allow-origin'),origin);
  const other=await fetch(base,{method:'OPTIONS',headers:{Origin:'https://unlisted.example','Access-Control-Request-Method':'GET'}});
  assert.equal(other.headers.get('access-control-allow-origin'),null);
  socket=io('http://127.0.0.1:5228',{extraHeaders:{Origin:origin},forceNew:true});
  await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject)});
  const result=await new Promise((resolve,reject)=>socket.timeout(3000).emit('command',{action:'create',name:'Hosted guest'},(err,r)=>err?reject(err):resolve(r)));
  assert(result.ok&&result.code&&result.token);
 }finally{socket?.disconnect();child.kill();}
});
