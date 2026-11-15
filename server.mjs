import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Server} from 'socket.io';
import {create,addPlayer,act,tick,view,movePlayer} from './hunt.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const production=process.argv.includes('--production');
const vite=production?null:await (await import('vite')).createServer({root,server:{middlewareMode:true},appType:'spa'});
const server=http.createServer(async(req,res)=>{
 if(req.url==='/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,mode:'hunt',rooms:rooms.size}));return;}
 if(vite)return vite.middlewares(req,res);
 try{let name=decodeURIComponent(req.url.split('?')[0]);if(name==='/')name='/index.html';let filename=path.resolve(root,'dist','.'+name);if(!filename.startsWith(path.join(root,'dist')+path.sep))throw Error();const bytes=await fs.readFile(filename);if(path.extname(filename)==='.html')res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}[path.extname(filename)]||'application/octet-stream'));res.end(bytes);}catch{res.statusCode=404;res.end('Not found');}
});
const io=new Server(server,{maxHttpBufferSize:8192,serveClient:false});
export const rooms=new Map();
io.on('connection',socket=>{
 let room,player,rate=0,windowAt=Date.now();
 const send=()=>{if(room&&player)socket.emit('state',view(room,player));};
 socket.on('command',(b,reply=()=>{})=>{
  try{
   const now=Date.now();if(now-windowAt>1000){rate=0;windowAt=now;}if(++rate>12)throw Error('Please slow down.');if(!b||typeof b!=='object')throw Error('Invalid command.');
   if(b.action==='create'||b.action==='join'||b.action==='resume'){
    if(player)throw Error('You already have a seat. Reload to switch rooms.');
    if(b.action==='create'){if(rooms.size>=100)throw Error('Local room limit reached. Restart the server.');room=create(b.name);rooms.set(room.code,room);player=room.players[0];}
    else {room=rooms.get(String(b.code).toUpperCase());if(!room)throw Error('Room not found. The local server may have restarted.');if(b.action==='resume'){player=room.players.find(p=>p.token===b.token);if(!player)throw Error('Seat could not be recovered.');if(player.connected)throw Error('This seat is open in another tab. Close that tab first.');}else player=addPlayer(room,b.name);}
    player.connected=true;player.seen=now;player.input={x:0,y:0};player.socket=socket.id;reply({ok:true,code:room.code,token:player.token});send();return;
   }
   if(!room||!player)throw Error('Join the household first.');
   act(room,player,b,now);reply({ok:true});send();
  }catch(e){reply({error:e.message});}
 });
 socket.on('input',input=>{if(!player||!input||typeof input!=='object')return;let x=Number(input.x),y=Number(input.y);if(!Number.isFinite(x)||!Number.isFinite(y))return;player.input={x:Math.sign(x),y:Math.sign(y)};player.inputAt=Date.now();});
 socket.on('disconnect',()=>{if(player&&player.socket===socket.id){player.connected=false;player.seen=Date.now();player.input={x:0,y:0};}});
});
let count=0;
setInterval(()=>{const now=Date.now();for(const [code,r] of rooms){if(now-r.lastActive>4*3600000&&!r.players.some(p=>p.connected)){rooms.delete(code);continue;}for(const p of r.players){if(!p.connected)continue;p.seen=now;if((['hunt','survival'].includes(r.mode)||!p.alive||['lobby','search','blackout'].includes(r.phase))&&now-(p.inputAt||0)<250){let input=p.input||{x:0,y:0};movePlayer(r,p,input.x,input.y,.05,now);}}
 tick(r,now,.05);if(count%2===0)for(const p of r.players.filter(p=>p.connected))io.to(p.socket).emit('state',view(r,p,now));}count++;},50).unref();
const port=Number(process.env.PORT||5174);const host=process.env.HOST||'127.0.0.1';server.listen(port,host,()=>console.log(`Midnight Manor local game: http://${host}:${port}`));
