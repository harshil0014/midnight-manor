import {fileURLToPath} from 'node:url';
export default {root:fileURLToPath(new URL('.',import.meta.url)),build:{outDir:'dist',emptyOutDir:true,rollupOptions:{output:{manualChunks:{phaser:['phaser']}}}},server:{host:'127.0.0.1'}};
