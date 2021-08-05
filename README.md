# **ESBMC VSCode Extension**

Offline plug-in to verify your program directly in VSCode editor with ESBMC. 

*This is the v0.0.1 version, the development of some features is still undergoing. This plug-in is not ready to be published until all the known issues are fixed.*

## **Features**

* Automatically download and extract ESBMC executables from [ESBMC Official site](http://www.esbmc.org/). (Windows only) 
* Verify local programs with full functionaliy of ESBMC.

## **First time use**

### **1. Install from .vsix package to your editor**
* This plug-in is delivered in a .vsix package. To install this, use `ctrl + shift + x` to open your extension sidebar menu. You will see a three-dots button at the top-right corner. Click it and select `Install from VSIX`, then finish the installation. You should be able to see a notification message popped up in your editor.

### **2. Try it on any C/C++ program**
 Great! Now you have successfully installed this plug-in. Before using it, make sure you already opened any C/C++ program in your editor. 
 
 Once you have a source code file opened, use `ctrl + shift + p` to open the command prompt. Type in `ESBMC` and you will be able to see two commands as below:
 * `Run in ESBMC`- This command will directly put current program into verification with default setting.
 * `Open ESBMC interface` - This command will open a side view for ESBMC, without verify current program. You can configure the parameters and execute it later.
  
## **Acknowledgement**
The implementation of project's webview component referred to ESBMC's web interface. The download feature relies on the  `@microsoft/vscode-file-downloader-api`.