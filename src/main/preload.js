'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('garden', {
  init: () => ipcRenderer.invoke('init'),
  action: (a) => ipcRenderer.invoke('action', a),
  lan: (a) => ipcRenderer.invoke('lan', a),
  rescanPacks: () => ipcRenderer.invoke('rescanPacks'),
  setLayout: (mode) => ipcRenderer.send('layout', mode),
  quit: () => ipcRenderer.send('quit'),
  onState: (cb) => ipcRenderer.on('state', (_e, v) => cb(v)),
  onLanState: (cb) => ipcRenderer.on('lan-state', (_e, v) => cb(v)),
  onLayout: (cb) => ipcRenderer.on('layout', (_e, v) => cb(v)),
});
