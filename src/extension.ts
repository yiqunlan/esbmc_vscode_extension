// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Uri, CancellationTokenSource } from "vscode";
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";
import { ConnectOpts } from 'net';
import {platform, userInfo} from 'os'
import { resourceUsage } from 'process';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import {exec, execFile, execFileSync} from 'child_process'
import { defaultCipherList, SSL_OP_NETSCAPE_CHALLENGE_BUG } from 'constants';

const exePath_win32 = "/file-downloader-downloads/esbmc_extension/ESBMC-6.7.0-win64/bin/esbmc.exe";
var last_focus_file = "";

//Check whether the esbmc executable is in place. Return true if its accessible.
function isInstalled(context:vscode.ExtensionContext){
	let installed = false;
	switch (platform()){
		case "win32":
			let path = context.globalStorageUri.path+exePath_win32;
			path = path.substring(1)
			console.log("Checking installation in path: "+ path)
			if(fs.existsSync(path)){
				installed = true;
			}
			break;
		case "darwin":
			//TODO actions for mac os
			console.error("Unsupported platform. Expected: win32");
			break;
		case "linux":
			//TODO actions for linux
			console.error("Unsupported platform. Expected: win32");
			break;
		default:
			console.error("Unsupported platform. Expected: win32");
			return -1;
	}

	if(installed) console.log("ESBMC is already installed to your extension directory.")
	else 		  console.log("ESBMC is not found in the directory.")

	return installed;
}

function init(context:vscode.ExtensionContext){
	//Check current file that user is focused on
	const activeEditor = vscode.window.activeTextEditor;

	if(!activeEditor){
		console.log("No active editor selected, abort.");
	}else{
		last_focus_file = activeEditor.document.uri.path;
	}

	// The code you place here will be executed every time your command is executed
	// Display a message box to the user
	console.log("Initializing...");
	//check is ESBMC installed
	if(!isInstalled(context)){
		//ESBMC is not found, download from official page
		setupESBMC(context)
	}
	console.log("Initialization complete.");
}




//Download and extract files from official site
//Code reference: https://github.com/microsoft/vscode-file-downloader-api
async function setupESBMC(context:vscode.ExtensionContext){
	const cancellationTokenSource = new CancellationTokenSource();
	const cancellationToken = cancellationTokenSource.token;
	const fileDownloader: FileDownloader = await getApi();

	// Setup uri to download
	let uriForDownload:string;
	switch(platform()){
		//For windows
		case "win32":
			uriForDownload = "https://github.com/esbmc/esbmc/releases//latest/download/ESBMC-Windows.zip";
			break;

		//For macos
		case "darwin":
			uriForDownload = "https://github.com/esbmc/esbmc/releases/latest/download/ESBMC-Darwin.sh"
			break;

		//For linux
		case "linux":
			uriForDownload = "https://github.com/esbmc/esbmc/releases/latest/download/ESBMC-Linux.sh"
			break;

		default:
			console.error("Unsupported platform. Expected: win32, darwin, linux");
			vscode.window.showErrorMessage("Unsupported platform. Expected: win32, darwin, linux")
			return -1;
	}

	const progressCallback = (downloadedBytes: number, totalBytes: number | undefined) => {
		console.log(`Downloading ESBMC ${downloadedBytes}/${totalBytes}%`);
	};

	const file: Uri = await fileDownloader.downloadFile(
		Uri.parse(uriForDownload),
		"esbmc_extension",
		context,
		cancellationToken,
		progressCallback,
		{ shouldUnzip: true }
	);

	if(isInstalled(context)){
		vscode.window.showInformationMessage('ESBMC successfully installed!');
	}else{
		vscode.window.showErrorMessage("ESBMC installation failed.")
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "esbmc" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let runESBMCCommand = vscode.commands.registerCommand('esbmc.runESBMC', ()=>{
		init(context);
		ESBMCInterface.createOrShow(context);
		if(ESBMCInterface.currentPanel){
			ESBMCInterface.currentPanel.runESBMC('--unwind 10 ');
		}
		
	});

	let openWebview = vscode.commands.registerCommand('esbmc.openWebview', ()=>{
		init(context);
		// console.log("TODO: Open webview")
		ESBMCInterface.createOrShow(context);
	});
	
	//Push registered commands into subscription.
	context.subscriptions.push(runESBMCCommand);
	context.subscriptions.push(openWebview);
}

// this method is called when your extension is deactivated
export function deactivate() {}


//Class for user interface, implemented in webview
//Reference: https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
class ESBMCInterface {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: ESBMCInterface | undefined;

	public static readonly viewType = 'ESBMC';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private _context:vscode.ExtensionContext;

	public static createOrShow(context:vscode.ExtensionContext) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (ESBMCInterface.currentPanel) {
			ESBMCInterface.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ESBMCInterface.viewType,
			'ESBMC',
			vscode.ViewColumn.Two,
			getWebviewOptions(context.extensionUri),
		);

		ESBMCInterface.currentPanel = new ESBMCInterface(panel, context.extensionUri,context);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri,context:vscode.ExtensionContext) {
		ESBMCInterface.currentPanel = new ESBMCInterface(panel, extensionUri,context);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri,context:vscode.ExtensionContext) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._context = context;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showInformationMessage(message.text);
						this.postResult("hello?");
						return;
					case 'run':
						this.runESBMC(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public postResult(txt:string) {
		// Send a message to the webview webview.
		this._panel.webview.postMessage({ command: 'showResult',text:txt });
	}

	public dispose() {
		ESBMCInterface.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._setHtmlForWebview(webview);
	}

	// Load html content from local disk
	// https://stackoverflow.com/questions/56182144/vscode-extension-webview-external-html-and-css
	private _setHtmlForWebview(webview: vscode.Webview) {

		// Local path to scripts run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'webview', 'js\\js.js');
		const jqueryPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'webview', 'js\\jquery-3.4.1.min.js');

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
		const jqueryUri = webview.asWebviewUri(jqueryPathOnDisk);
		// Local path to css styles
		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'webview', 'css\\esbmc.css');

		// Uri to load styles into webview
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		//Obtain path to html files
		const pathToHtml = vscode.Uri.file(
			vscode.Uri.joinPath(this._extensionUri, 'webview','ESBMCwebview.html').fsPath
		);
		
		const pathUri = pathToHtml.with({scheme: 'vscode-resource'});   

		// Setup head section here to load external resources
		let head = `<html>
		<head>
			<title>ESBMC</title>
			<meta charset="utf-8">
			<link rel="stylesheet" type="text/css" href="${stylesMainUri}">
			<script type="application/javascript" src="${jqueryUri}"></script>
			<script type="application/javascript" src="${scriptUri}"></script>
		</head>`
		// Load the html content from file
		let html = fs.readFileSync(pathUri.fsPath,'utf8');
		webview.html = head+html;
	}

	public runESBMC(param:string){
		//Check whether the executable is installed
		if(!isInstalled(this._context)){
			console.error("No avaliable ESBMC executable found, exiting...")
			return -1;
		}
		//for windows
		if(platform()=="win32"){
	
			// let path = context.globalStorageUri.path+exePath_win32;
			// path = path.substring(1)//Remove the first '/' to make this path valid
	
			let path = vscode.Uri.joinPath(this._context.globalStorageUri,exePath_win32);
			//get current file location
			//https://stackoverflow.com/questions/60180833/get-currently-focus-file-via-vscode-extension-api
	
			if(last_focus_file!=""){
				//For Getting File Path
				const filePath = last_focus_file.substring(1);
				console.log("Target file path: "+filePath);
				
				//Execute shell
				//TODO sanitize the input
				exec(path.fsPath+' '+param+"\""+filePath+"\"", (err, stdout, stderr) => {
					// console.log(stdout);
					// console.log(stderr);
					this.postResult(stdout);
				});
	
	
			}
	
	
		}
		
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions&vscode.WebviewPanelOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,
		// Keep information when switch to other tabs
		retainContextWhenHidden:true,
		// Restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview')]}
}

function getWebviewPanelOptions(extensionUri: vscode.Uri):vscode.WebviewPanelOptions{
	return {
		retainContextWhenHidden:true
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
