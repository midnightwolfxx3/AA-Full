require('./bin/lib/index');
const { app, Tray, Menu } = require('electron');
//require ('electron-debug')({showDevTools: true});
app.on('window-all-closed', () => {}); // noop to prevent default event handler
let icon;
app.on('ready', () => {
  icon = new Tray(__dirname + '/syringe.png');
  icon.setToolTip('Proxy');
  icon.displayBalloon({title:'Proxy', content: 'Proxy now running'})
  process.on('uncaughtException', function (error) {
    console.log(error);
})
  icon.setContextMenu(Menu.buildFromTemplate([
     { label: 'Modules...'},
    { label: 'Restart', click: () => {setTimeout(function(){app.exit()},100); app.relaunch(); tray.destroy()} },
	//{ label: 'Restart', click: () => {
	//				setTimeout(app.quit(),2000)
	//	exec('TeraProxy.bat', (err, stdout, stderr) => {
 // if (err) {
  //  console.error(err);
 //   return;
 // }
  //console.log(stdout);
//});
		//} },
	//{ label: 'Restart', click: () => {require('child_process').exec(__dirname + "./TeraProxy.bat");}},
	{ label: 'Exit', click: () => {app.exit(); } },
	]));
});