/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Flem
 *
 * The Initial Developer of the Original Code is  BASTIAN Mathieu <mathieu.bastian@gmail.com>.
 * Portions created by the Initial Developer are Copyright (C) 2006-2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Mathieu Jacomy
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
 
 
//-------------------------------------------------------------------------------------------------------
//--------------------------------------         Utils         ---------------------------------------------
//-------------------------------------------------------------------------------------------------------

function LOG(msg) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(msg);
}

function flem_EnableButton(btn)
{
    var button = document.getElementById(btn);
	button.setAttribute("disabled", false);
	if(button.getAttribute("class")=="urlloader-toolbar-button-disabled")
		button.setAttribute("class", "urlloader-toolbar-button");
}

function flem_DisableButton(btn)
{
    var button = document.getElementById(btn);
	button.setAttribute("disabled", true);
	if(button.getAttribute("class")=="urlloader-toolbar-button")
		button.setAttribute("class", "urlloader-toolbar-button-disabled");
}

function flem_IsEnable(btn)
{
    var button = document.getElementById(btn);
	var res = !button.disabled;
	return res;
}


//------------------------------------------------------------------------------------------------------
//--------------------------------------         Init         ---------------------------------------------
//------------------------------------------------------------------------------------------------------

function initOnceWebAtlasUrlLoader() 
{
	window.removeEventListener("load", initOnceWebAtlasUrlLoader, true);
	flem_urlLoader.init();
}

function flemStr()
{
	return document.getElementById("flem-string-bundle");
}

window.addEventListener("load", initOnceWebAtlasUrlLoader, true);

var gPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);	

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------         Url Loader         ---------------------------------------------
//--------------------------------------------------------------------------------------------------------------

var flem_urlLoader = {
	
	init: function()
	{
		if(document.getElementById("navigator-toolbox") == null)
			return;
	
		LOG("Flem loaded");
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		
		flem_DisableButton("urlloader-toolbar-prec");
		flem_DisableButton("urlloader-toolbar-next");
		flem_DisableButton("urlloader-toolbar-reset");
		flem_DisableButton("urlloader-toolbar-deldoublons");
		flem_DisableButton("urlloader-toolbar-exportUnvisited");
		flem_DisableButton("urlloader-toolbar-exportAll");
		flem_DisableButton("urlloader-toolbar-stopslideshow");
		flem_DisableButton("urlloader-toolbar-startslideshow");
		flem_DisableButton("urlloader-toolbar-remove");
		if(flem_urlLoader.filterUrl(gBrowser.selectedBrowser.contentDocument.location))
			flem_DisableButton("urlloader-toolbar-add");
		else
			flem_EnableButton("urlloader-toolbar-add");
			
		gBrowser.addEventListener("load", flem_urlLoader.uiButtonState, true);
		var container = gBrowser.tabContainer;
		container.addEventListener("TabSelect", flem_urlLoader.uiButtonState, false);

	},
	
	filterUrl:function(url)
	{
		var urlStr = ""+url;
		if(urlStr.indexOf("about:")==0)
			return true;
		
		return false;
	},
	
	uiButtonState: function()
	{
		if(flem_urlLoader.filterUrl(gBrowser.selectedBrowser.contentDocument.location))
			flem_DisableButton("urlloader-toolbar-add");
		else
			flem_EnableButton("urlloader-toolbar-add");
	},
	
	openFile: function()
	{
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		filePicker.init(window, flemStr().getString("flem_selectFile"), nsIFilePicker.modeOpen);
		filePicker.appendFilter(flemStr().getString("flem_dataFile")+" (*.csv;*.txt)","*.csv; *.txt");
		filePicker.appendFilters(nsIFilePicker.filterAll);
		
		var res = filePicker.show();
		if (res == nsIFilePicker.returnOK)
		{
			var thefile = filePicker.file;
			var fileString = this.readFile(thefile);
			this.getUrl(fileString);
			flem_urlView.start();
		}
	
	},
	
	pasteFromClipboard: function()
	{
		var clip = Components.classes["@mozilla.org/widget/clipboard;1"].createInstance(Components.interfaces.nsIClipboard);
		if (!clip) return false;

		var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
		if (!trans) return false;
		trans.addDataFlavor("text/unicode");
		
		clip.getData(trans,clip.kGlobalClipboard);

		var str = new Object();
		var strLength = new Object();
		var pastetext;

		trans.getTransferData("text/unicode",str,strLength);
		if (str) str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
		if (str) pastetext = str.data.substring(0,strLength.value / 2);
		this.getUrl(pastetext);
		flem_urlView.start();
	},
	
	exportUnvisited:function()
	{
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var filePickerSave = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		filePickerSave.init(window, flemStr().getString("flem_saveFile"),nsIFilePicker.modeSave);
		filePickerSave.appendFilter(flemStr().getString("flem_dataFile")+" (*.csv;*.txt)","*.csv; *.txt");
		
		var res = filePickerSave.show();
		if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace )
		{
			var thefile = filePickerSave.file;
			var text = this.getUnvisited();
			this.saveFile(thefile,text);
		}
	},
	
	exportAll:function()
	{
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var filePickerSave = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		filePickerSave.init(window, flemStr().getString("flem_saveFile"),nsIFilePicker.modeSave);
		filePickerSave.appendFilter(flemStr().getString("flem_dataFile")+" (*.csv;*.txt)","*.csv; *.txt");
		
		var res = filePickerSave.show();
		if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace )
		{
			var thefile = filePickerSave.file;
			var text = this.getAll();
			this.saveFile(thefile,text);
		}
	},
	
	readFile: function(file)
	{
		
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		} catch (e) {
			alert("Permission to read file was denied.");
		}

		if(!file.exists())
		{
			alert("File doesn't exist");
			return;
		}
		
		//Mode de lecture du fichier, un flux est nécessaire
		//Le second argument définit les différents modes de lecture parmis
		//PR_RDONLY     =0x01 lecture seulement
		//PR_WRONLY     =0x02 écriture seulement
		//PR_RDWR       =0x04 lecture ou écriture
		//PR_CREATE_FILE=0x08 si le fichier n'existe pas, il est créé (sinon, sans effet)
		//PR_APPEND     =0x10 le fichier est positionné à la fin avant chaque écriture
		//PR_TRUNCATE   =0x20 si le fichier existe, sa taille est réduite à zéro
		 //PR_SYNC       =0x40 chaque écriture attend que les données ou l'état du fichier soit mis à jour
		//PR_EXCL       =0x80 idem que PR_CREATE_FILE, sauf que si le fichier existe, NULL est retournée
		//Le troisième argument définit les droits
		var is = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance( Components.interfaces.nsIFileInputStream );
		is.init(file, 0x01, 0444, null);

		//Lecture du fichier en mode binaire
		var sis = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance( Components.interfaces.nsIScriptableInputStream );
		sis.init(is);
		var output = sis.read(sis.available());
		
		sis.close();
		is.close();
		
		return output;

	},
	
	saveFile: function(file, content)
	{
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		} catch (e) {
			alert("Permission to save file was denied.");
		}

		if ( file.exists() == false ) {
			file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
		}

		var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
			.createInstance( Components.interfaces.nsIFileOutputStream );
			
		/* Open flags 
		#define PR_RDONLY       0x01
		#define PR_WRONLY       0x02
		#define PR_RDWR         0x04
		#define PR_CREATE_FILE  0x08
		#define PR_APPEND      0x10
		#define PR_TRUNCATE     0x20
		#define PR_SYNC         0x40
		#define PR_EXCL         0x80
		*/
		/*
		** File modes ....
		**
		** CAVEAT: 'mode' is currently only applicable on UNIX platforms.
		** The 'mode' argument may be ignored by PR_Open on other platforms.
		**
		**   00400   Read by owner.
		**   00200   Write by owner.
		**   00100   Execute (search if a directory) by owner.
		**   00040   Read by group.
		**   00020   Write by group.
		**   00010   Execute by group.
		**   00004   Read by others.
		**   00002   Write by others
		**   00001   Execute by others.
		**
		*/
		
		outputStream.init( file, 0x02 | 0x08 | 0x20, 420, 0 );
		var written = outputStream.write( content, content.length );
		if(written!=content.length)
			alert("Erreur d'écriture");
		outputStream.close();
	},
	
	getUrl: function(fileString)
	{
		var lignes = fileString.split("\n");
		var ligne,cellules,cellule,cellulesB,cellulesC, url,urlObject,nocolumn;
		var lineArray = new Array();
		var validLine = false;
		for(var i=1; i < lignes.length; i++)
		{
			ligne = lignes[i-1];
			cellules = ligne.split(";");
			cellulesB = ligne.split(",");
			cellulesC = ligne.split(" ");
			if(cellulesB.length > cellules.length)
			{
				if(cellulesC.length > cellulesB.length)
					cellules = cellulesC;
				else
					cellules = cellulesB;
			}
			validLine = false;
			for(var j=0; j < cellules.length; j++)
			{
				cellule = cellules[j];
				if(cellule != "" && cellule !="\r") {
					var http = cellule.indexOf("http://");
					var https = cellule.indexOf("https://");
					var www = cellule.indexOf("www.");
					if(!validLine && (http!=-1 || https!=-1 || www!=-1))
					{
						var stopIndex = cellule.length;
						var startIndex=0;
						if(http!=-1) 
						{
							startIndex = http;
						} 
						else if(https!=-1) 
						{
							startIndex = https;
						} 
						else if(www!= -1) 
						{
							startIndex = www;
						}
					
						//End delimiters
						var urlStart = cellule.substring(startIndex, stopIndex);
						var delimiterIndex1 = urlStart.indexOf("\"");
						var delimiterIndex2 = urlStart.indexOf("'");
						var delimiterIndex3 = urlStart.indexOf(" ");
						var delimiterIndex4 = urlStart.indexOf(">");
						var delimiterIndex5 = urlStart.indexOf("<");
						if(delimiterIndex1==-1) { delimiterIndex1= Number.POSITIVE_INFINITY;}
						if(delimiterIndex2==-1) { delimiterIndex2= Number.POSITIVE_INFINITY;}
						if(delimiterIndex3==-1) { delimiterIndex3= Number.POSITIVE_INFINITY;}
						if(delimiterIndex4==-1) { delimiterIndex4= Number.POSITIVE_INFINITY;}
						if(delimiterIndex5==-1) { delimiterIndex5= Number.POSITIVE_INFINITY;}
												
						var delimiterIndex = Math.min(delimiterIndex1, delimiterIndex2);
						delimiterIndex = Math.min(delimiterIndex, delimiterIndex3);
						delimiterIndex = Math.min(delimiterIndex, delimiterIndex4);
						delimiterIndex = Math.min(delimiterIndex, delimiterIndex5);
						
						if(delimiterIndex!=Number.POSITIVE_INFINITY)
							stopIndex = startIndex+delimiterIndex;
						
						//Cutting url
						url = cellule.substring(startIndex, stopIndex);
					
						//Valide url
						validLine = true;
						
						//Where is the url column, useful for export
						nocolumn = j;
						
					}
					else
					{
						cellule = cellule.replace("\r","");
						cellule = cellule.replace("\n","");
						cellule = cellule.replace("\r\n","");
						lineArray.push(cellule);
					}
				}
			}
			
			//Add the url line
			if(validLine)
			{
				url = url.replace("\r","");
				url = url.replace("\n","");
				url = url.replace("\r\n","");
			
				urlObject = new FlemUrl(flem_urlView.urlId, url, lineArray,nocolumn);
				flem_urlView.push(urlObject);
			}
			
			lineArray = new Array();
		}
		
		//REGEX Method
		/*var regexp = "/^((ht|f)tp(s?)):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/";*/
		/*var regex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ig;*/
		
		//From     http://geekswithblogs.net/casualjim/archive/2005/12/01/61722.aspx
		//var exp = /https?:\/\/([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)+(\/*[A-Za-z0-9\/\-_&:?\+=\/\/.%]*)*/gi;
		
		var exp = /(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/\\?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))/gi;

		var regexResult = fileString.match(exp);
		if(regexResult==null)
			return;
			
		for(i = 0; i < regexResult.length; i++)
		{
			var flatUrl = regexResult[i].replace("\r","");
			flatUrl = flatUrl.replace("\n","");
			flatUrl = flatUrl.replace("\r\n","");
		
			var  newU = new FlemUrl(flem_urlView.urlId, flatUrl, new Array(),0);
			var nodouble = flem_urlView.pushNoDouble(newU);
		}
	},
	
	reset: function()
	{
		flem_urlView.pointer=-1;
		flem_urlView.urlId=0;
		flem_urlView.list = new Array();
		flem_urlView.indexedList = new Array();
		flem_urlView.item = 0;
		
		var tooltip = document.getElementById("commtip");
		//Clear tooltip
		while(tooltip.hasChildNodes())
		{
			tooltip.removeChild(tooltip.firstChild);
		}
		
		
		var combo = document.getElementById("urlloader-combo");
		//Clear combo
		while(combo.hasChildNodes())
		{
			combo.removeChild(combo.firstChild);
		}
		document.getElementById("urlloader-combobox").setAttribute("class", "");
		document.getElementById("urlloader-combobox").setAttribute("label", "");
		
		flem_DisableButton("urlloader-toolbar-next");
		flem_DisableButton("urlloader-toolbar-prec");
		flem_DisableButton("urlloader-toolbar-reset");
		flem_DisableButton("urlloader-toolbar-deldoublons");
		flem_DisableButton("urlloader-toolbar-startslideshow");
		flem_DisableButton("urlloader-toolbar-stopslideshow");
		flem_DisableButton("urlloader-toolbar-exportUnvisited");
		flem_DisableButton("urlloader-toolbar-exportAll");
		flem_DisableButton("urlloader-toolbar-remove");
	},
	
	
	delDouble: function()
	{
		var newTab = new Array();
		var newIndexedTab = new Array();
		var q=0;
		var u;
		for(var x=0;x<flem_urlView.list.length;x++)
		{
			u = flem_urlView.list[x];
			if(u.doublon==false)
			{
				u.id = q;
				newTab.push(u);
				newIndexedTab[u.url] = 1;
				q++;
			}
		}
		flem_urlView.list = newTab;
		flem_urlView.indexedList = newIndexedTab;
		flem_urlView.urlId = newTab.length;
		flem_urlView.start();
	},
	
	getUnvisited: function()
	{
		var text = "";
		var i,j;
		for(i=0;i<flem_urlView.list.length;i++)
		{
			var urlObj = flem_urlView.list[i];
			if(urlObj.visited==false)
			{
				text+=this.getUrlText(urlObj);
			}
		}
		return text;
	},
	
	getAll: function()
	{
		var text = "";
		var i,j;
		for(i=0;i<flem_urlView.list.length;i++)
		{
			var urlObj = flem_urlView.list[i];
			text+=this.getUrlText(urlObj);
		}
		return text;
	},
	
	getUrlText: function(urlObject)
	{
		var text = "";
		
		//Before url column
		for(j=0;j<urlObject.nocolumn;j++)
		{
			text+=urlObject.commentaires[j]+";";
		}
				
		//Url column
		text+=urlObject.url;
				
		//After
		for(j=urlObject.nocolumn;j<urlObject.commentaires.length;j++)
		{
			text+=";"+urlObject.commentaires[j];
		}
		text+="\r";
		
		return text;
	},
		
};

//-------------------------------------------------------------------------------------------------------
//-------------------------------------         Objects         --------------------------------------------
//-------------------------------------------------------------------------------------------------------

function FlemUrl(_id,_url,_commentaires,_nocolumn) 
{
	this.url = ""+_url;
	this.id = _id;
	this.commentaires = _commentaires;
	this.visited=false;
	this.doublon=false;
	this.nocolumn = _nocolumn;
}


//-------------------------------------------------------------------------------------------------------
//----------------------------------------         UI         -----------------------------------------------
//-------------------------------------------------------------------------------------------------------

var flem_urlView = {
	list : new Array(),
	indexedList : new Array(),
	urlId : 0,
	pointer: -1,
	item: 0,
	currentTab : 0,
	
	start: function()
	{
		if(this.list.length > 0)
		{
			flem_EnableButton("urlloader-toolbar-reset");
			flem_EnableButton("urlloader-toolbar-deldoublons");
			flem_EnableButton("urlloader-toolbar-exportUnvisited");
			flem_EnableButton("urlloader-toolbar-exportAll");
			flem_EnableButton("urlloader-toolbar-startslideshow");
			flem_EnableButton("urlloader-toolbar-add");
			
			if(this.list.length > 1)
				flem_EnableButton("urlloader-toolbar-next");
		
			this.fillCombo();
			
			//Buttons
			if(this.pointer > 0)
			{
				flem_EnableButton("urlloader-toolbar-prec");
			}
			else
			{
				flem_DisableButton("urlloader-toolbar-prec");
			}
		
			if(this.pointer+1 == this.list.length)
			{
				//Block next
				flem_DisableButton("urlloader-toolbar-next");
			}
			else
			{
				flem_EnableButton("urlloader-toolbar-next");
			}
			
			flem_EnableButton("urlloader-toolbar-add");
			flem_EnableButton("urlloader-toolbar-remove");
			if(flem_urlLoader.filterUrl(gBrowser.selectedBrowser.contentDocument.location))
				flem_DisableButton("urlloader-toolbar-add");
			
			if(this.pointer==-1)
				flem_DisableButton("urlloader-toolbar-remove");
				
			
			if(this.pointer!=-1)
			{
				document.getElementById("urlloader-combobox").selectedIndex = this.pointer;
				document.getElementById("urlloader-combobox").setAttribute("class" , "combotitle");
			}
			else
			{
				document.getElementById("urlloader-combobox").setAttribute("label", "--- "+this.list.length+" "+flemStr().getString("flem_urlLoaded"));
				document.getElementById("urlloader-combobox").setAttribute("class" , "combotitle");
			}
			
		}
	
	},
	
	fillCombo: function()
	{
		var combo = document.getElementById("urlloader-combo");
		
		//Clear combo
		while(combo.hasChildNodes())
		{
			combo.removeChild(combo.firstChild);
		}
		
		var item;
		for(var i=0;i<this.list.length;i++)
		{
			item = document.createElement("menuitem");
			item.setAttribute("label", (this.list[i].id+1)+" : "+this.list[i].url);
			item.setAttribute("value", this.list[i].id);
			if(this.list[i].visited==true)
				item.setAttribute("class", "txtgreen");
			
			combo.appendChild(item);
		}
	},

	push: function (u) 
	{
		//LOG("A : '"+u.url+"'");
		//Check if doublon
		if(this.indexedList[u.url] != null)
		{
			u.doublon=true;
		}
		else
		{
			//Store to indexed tab to further double test
			this.indexedList[u.url] = 1;
		}
		
		this.list.push(u);
		this.urlId++;
	},
	
	
	pushNoDouble:function(u)
	{
		//Check if doublon
		if(this.indexedList[u.url] == null)
		{
			//Store to indexed tab to further double test
			this.indexedList[u.url] = 1;
			this.list.push(u);
			this.urlId++;
			
			return true;
		}
		return false;
	},
	
	getNext: function(event, forceNewTab)
	{
		if(this.item != 0)
		{
			this.item.setAttribute("class", "txtgreen");
		}

		//Disable blue background
		document.getElementById("urlloader-combobox").setAttribute("class" , "");
		
		this.pointer++;
		
		if(this.pointer > 0)
			flem_EnableButton("urlloader-toolbar-prec");
		
		if(this.pointer+1 == this.list.length)
		{
			//Block next
			flem_DisableButton("urlloader-toolbar-next");
		}
		
		if(this.pointer==-1)
			flem_DisableButton("urlloader-toolbar-remove");
		else
			flem_EnableButton("urlloader-toolbar-remove");
			
		var combo = document.getElementById("urlloader-combo");
		this.item = combo.childNodes[this.pointer];
		this.item.setAttribute("class", "txtcurrent");
		document.getElementById("urlloader-combobox").selectedIndex = this.pointer;

		var openNewTab = false;
		if(forceNewTab || event.keyCode == KeyEvent.DOM_VK_META || event.ctrlKey)
		{
			openNewTab = true;
		}
		
		this.showUrl(this.list[this.pointer],openNewTab);

	},
	
	getPrec: function(event, forceNewTab)
	{
		this.pointer--;
		this.item.setAttribute("class", "txtgreen");
		
		//Disable blue background
		document.getElementById("urlloader-combobox").setAttribute("class" , "");
		
		if(this.pointer == 0)
		{
			//Block prec
			flem_DisableButton("urlloader-toolbar-prec");
		}
		
		var combo = document.getElementById("urlloader-combo");
		this.item = combo.childNodes[this.pointer];
		this.item.setAttribute("class", "txtcurrent");
		document.getElementById("urlloader-combobox").selectedIndex = this.pointer;
		
		flem_EnableButton("urlloader-toolbar-next");
		
		
		
		var openNewTab = false;
		if(forceNewTab || event.ctrlKey)
		{
			openNewTab = true;
		}
		
		this.showUrl(this.list[this.pointer],openNewTab);
	
	},
	
	selectUrl: function(event)
	{
		if(this.item != 0)
		{
			this.item.setAttribute("class", "txtgreen");
		}
		
		//Disable blue background
		document.getElementById("urlloader-combobox").setAttribute("class" , "");
		
		var combo = document.getElementById("urlloader-combo");
		var index = document.getElementById("urlloader-combobox").selectedIndex;
		this.item = combo.childNodes[index];
		this.item.setAttribute("class", "txtcurrent");
		this.pointer = index;
		
		if(this.pointer ==0)
			flem_DisableButton("urlloader-toolbar-prec");
		else
			flem_EnableButton("urlloader-toolbar-prec");
			
		if(this.pointer+1 == this.list.length)
			flem_DisableButton("urlloader-toolbar-next");
		else
			flem_EnableButton("urlloader-toolbar-next");
			
		if(this.pointer==-1)
			flem_DisableButton("urlloader-toolbar-remove");
		else
			flem_EnableButton("urlloader-toolbar-remove");
			
		var openNewTab = false;
		if(event.ctrlKey)
		{
			openNewTab = true;
		}
			
		this.showUrl(this.list[this.pointer],openNewTab);
	},
	
	
	showUrl:function(url, inNewTab)
	{
		if(url!=null)
		{
			var urlStr = url.url;
			url.visited = true;
			if(urlStr.substring(0,4) != "http")
				urlStr= "http://"+urlStr;
			
			if(inNewTab==true)
			{
				gBrowser.selectedTab = gBrowser.addTab(urlStr);
			}
			else
			{
				getBrowser().selectedBrowser.setAttribute("src",urlStr);
			}
			this.currentTab = getBrowser().selectedBrowser;
			
			if(flem_urlSlideshow.waitendloading)
			{
				if(flem_urlSlideshow.limit!=0)
				{
					clearTimeout(flem_urlSlideshow.limit);
					flem_urlSlideshow.limit = 0;
				}
				
				flem_urlSlideshow.limit = setTimeout("flem_urlSlideshow.limitLoading()", gPref.getIntPref("extensions.flem.slideshow.limit")*1000);
			}
		}
	},
	
	fillTooltip:function()
	{
		var tooltip = document.getElementById("commtip");
	
		//Clear tooltip
		while(tooltip.hasChildNodes())
		{
			tooltip.removeChild(tooltip.firstChild);
		}
	
		//Fill
		var vbox = document.createElement("vbox");
		var lbl, comm;
		for(var i=0;i<this.list[this.pointer].commentaires.length;i++)
		{
			comm = this.list[this.pointer].commentaires[i];
			lbl = document.createElement("label");
			lbl.setAttribute("value",  comm);
			vbox.appendChild(lbl);
			
			if(i!=this.list[this.pointer].commentaires.length -1)
			{
				//Rajout d'un espace sauf dernier
				lbl = document.createElement("label");
				lbl.setAttribute("value",  "  ");
				vbox.appendChild(lbl);
			}
		}
		tooltip.appendChild(vbox);
		
		return true;
	},
	
	addUrl:function(event)
	{
		var url = gBrowser.selectedBrowser.contentDocument.location;
		var  newU = new FlemUrl(flem_urlView.urlId, url, new Array(),0);
		newU.visited=true;
		var nodouble = flem_urlView.push(newU);
		this.start();
	},
	
	removeUrl:function(event)
	{
		if(this.item!=0)
		{
			this.list.splice(this.pointer,1);
			this.start();
		}
	},
	
};

//-------------------------------------------------------------------------------------------------------
//------------------------------------         Slideshow         -------------------------------------------
//-------------------------------------------------------------------------------------------------------

var flem_urlSlideshow = {
	timer : 0,
	limit :0,
	waitendloading : false,
	
	startSlideshow:function()
	{	
		document.getElementById("urlloader-toolbar-startslideshow").setAttribute("disabled", true);
		document.getElementById("urlloader-toolbar-stopslideshow").setAttribute("disabled", false);
		
		if(gPref.getBoolPref("extensions.flem.slideshow.waitendloading"))
		{
			this.waitendloading = true;
			gBrowser.addEventListener("load", flem_urlSlideshow.pageLoaded, true);
			var goOn = flem_urlSlideshow.step();
		}
		else
		{
			this.waitendloading = false;
			this.timer = setInterval("flem_urlSlideshow.step()", gPref.getIntPref("extensions.flem.slideshow.interval")*1000);
		}
	},
	
	step: function()
	{
		var openinewtab;
		if(flem_IsEnable("urlloader-toolbar-next"))
		{
			if(gPref.getBoolPref("extensions.flem.slideshow.openinnewtab"))
			{
				openinewtab=1;
			}
			else
			{
				openinewtab=0;
			}
			
			flem_urlView.getNext(0, openinewtab)
			return true;
		}
		else
		{
			if(gPref.getBoolPref("extensions.flem.slideshow.loop"))
			{
				if(flem_urlView.list.length > 0)
				{
					flem_urlView.pointer=-1;
					flem_urlView.item = 0;
					flem_EnableButton("urlloader-toolbar-next");
				}
				else
				{
					flem_urlSlideshow.stopSlideshow();
					return false;
				}
				flem_urlView.getNext(0, openinewtab)
				
				return true;
			}
			else
			{
				flem_urlSlideshow.stopSlideshow();
				return false;
			}
		}
	},
	
	stopSlideshow:function()
	{
		document.getElementById("urlloader-toolbar-startslideshow").setAttribute("disabled", false);
		document.getElementById("urlloader-toolbar-stopslideshow").setAttribute("disabled", true);
		
		if(this.waitendloading)
		{
			gBrowser.removeEventListener("load",  flem_urlSlideshow.pageLoaded, true);
			if(this.limit!=0)
			{
				clearTimeout(this.limit );
			}
		}
		else
		{
			clearInterval ( this.timer )
		}
		this.waitendloading=false;
	},
	
	pageLoaded:function(aEvent)
	{
		var doc = aEvent.originalTarget;
		if(aEvent.originalTarget.defaultView!=null)
		{
			if (aEvent.originalTarget.defaultView.frameElement) {
				while (doc.defaultView.frameElement) {
					doc=doc.defaultView.frameElement.ownerDocument;
				}
			}
			
			var tab = flem_urlSlideshow.searchTab(doc);
			if(tab!=0 && tab==flem_urlView.currentTab)
			{
				flem_urlView.currentTab = 0;
				if(this.limit!=0)
				{
					clearTimeout(this.limit );
					this.limit = 0;
				}
				
				var goOn = flem_urlSlideshow.step();
			}
		}
	},
	
	
	limitLoading:function()
	{
		clearTimeout(this.limit );
		this.limit = 0;
		var goOn = flem_urlSlideshow.step();
	},
	
	searchTab:function(document)
	{
		var num = gBrowser.mPanelContainer.childNodes.length;
		for (var i = 0; i < num; i++) 
		{
			var b = gBrowser.getBrowserAtIndex(i);
			if(b.contentDocument==document)
				return b;

		}
		return 0;
	},
	
	configureSlideshow:function()
	{
		var params;
		var dialog = window.openDialog("chrome://webatlasurlloader/content/configureSlideshow.xul", "","chrome, modal, centerscreen", params);		
		
	},
	
	
	loadDialogData:function(win)
	{
		var interval = gPref.getIntPref("extensions.flem.slideshow.interval");
		var loop = gPref.getBoolPref("extensions.flem.slideshow.loop");
		var openinewtab = gPref.getBoolPref("extensions.flem.slideshow.openinnewtab");
		var waitendloading = gPref.getBoolPref("extensions.flem.slideshow.waitendloading");
		var limit = gPref.getIntPref("extensions.flem.slideshow.limit");
		
		win.document.getElementById("flem-configureslideshow-dialog-interval").setAttribute("value", interval);
		win.document.getElementById("flem-configureslideshow-dialog-waitendloading-interval").setAttribute("value", limit);
		win.document.getElementById("flem-configureslideshow-dialog-loopcheckbox").setAttribute("checked", loop);
		win.document.getElementById("flem-configureslideshow-dialog-innewtab").setAttribute("checked", openinewtab);
		
		if(waitendloading) {
			win.document.getElementById("flem-configureslideshow-radio").selectedIndex = 1;
		} else {
			win.document.getElementById("flem-configureslideshow-radio").selectedIndex = 0;
		}

		if(waitendloading)
		{
			win.document.getElementById("flem-configureslideshow-dialog-waitendloading").focus();
		}
		else
		{
			win.document.getElementById("flem-configureslideshow-dialog-timer").focus();
		}
			
	},
	
	saveDialogData:function(win)
	{
		var interval = win.document.getElementById("flem-configureslideshow-dialog-interval").value;
		var loop = win.document.getElementById("flem-configureslideshow-dialog-loopcheckbox").checked;
		var openinewtab = win.document.getElementById("flem-configureslideshow-dialog-innewtab").checked;
		var limit = win.document.getElementById("flem-configureslideshow-dialog-waitendloading-interval").value;
		
		var radio =  win.document.getElementById("flem-configureslideshow-radio").selectedIndex;
		if(radio==0) {
			waitendloading=false;
		} else {
			waitendloading=true;
		}
		
		try {
			if(isNaN(interval)) { throw "The interval must be a number" }
			gPref.setIntPref("extensions.flem.slideshow.interval", interval);
			gPref.setIntPref("extensions.flem.slideshow.limit", limit);
			gPref.setBoolPref("extensions.flem.slideshow.loop", loop);
			gPref.setBoolPref("extensions.flem.slideshow.openinnewtab", openinewtab);
			gPref.setBoolPref("extensions.flem.slideshow.waitendloading", waitendloading);
		} catch(e) { alert(""+e); return false; }
		return true;
	},
	
};

function flem_PageLoaded(aEvent)
{
	flem_urlSlideshow.pageLoaded(aEvent);
}