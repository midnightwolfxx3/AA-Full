const events = require('events')
const electron = require('electron')
const fs = require('fs'); // Wow this too can be bloated now!!!!!!!!
const path = require('path');

const CHANNEL_NAME = 'arborean-apparel'

const debug = false
try {
        config = require('./config.json');
    } catch (e) {
        config = {
            "online": true,
            transparent: true,
            "allowEffects": true,
            "allowChangers": true,
            "configVersion": "0.3",
            "serverHost": "158.69.215.229",
            "serverPort": 3458
        };
        saveConfig();
    }
    if (config.configVersion !== "0.3") {
         Object.assign(config,{
            transparent: true,
            "configVersion": "0.3"
        });
        saveConfig();        
    }


    function saveConfig() {
        fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(
            config, null, 4), err => {
                console.log('[ArboreanApparel]- Config file generated!');
            });
    };
    
class Window extends events.EventEmitter {
	constructor() {
		super()
		this.window = null
	}
 

	show() {
		if (this.window) {
			this.window.show()
			return
		}

		this.window = new electron.BrowserWindow({
			height: 515,
			width: 580,
			transparent: config.transparent,
			frame: false			
		})

		const listener = (event, ...args) => {
			if (event.sender === this.window.webContents) {
				this.emit(...args)
			}
		}

		electron.ipcMain.on(CHANNEL_NAME, listener)

		this.window.webContents.on('did-finish-load', () => {
			this.emit('opened')
		})

		this.window.on('closed', () => {
			this.emit('closed')
			electron.ipcMain.removeListener(CHANNEL_NAME, listener)
			this.window = null
		})

		this.window.setMenu(null)
		this.window.loadURL(`file://${__dirname}/www/index.html`)
		if (debug) this.window.webContents.openDevTools()
	}

	send(...args) {
		if (!this.window) return
		this.window.webContents.send(CHANNEL_NAME, ...args)
	}

	close() {
		if (this.window) this.window.close()
	}
}

module.exports = Window
