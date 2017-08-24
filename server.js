/*
 *@author Alan?Liang
 *@version 1.0.0
 *@name SSTTS
 *
 *https://github.com/Alan-Liang/SSTTS
 */

(function(self,dirname){

self.adminPwd  = "foobar";
self.ipaddress = "127.0.0.1";
self.port      = 8080;

self.tlist=[];
self.tobjs={};

var http=require("http");
var fs=require("fs");
var mime=require('mime');
var url=require('url');
var vurl=require('./vurl');

var listeningFunc=function(req,resp){
	// Parse the request containing file name
	var pathname = url.parse(req.url).pathname.substr(1);
	if(cache[pathname]){
		var type=mime.lookup(pathname.substr(1));
		resp.writeHead(200, {'Content-Type':type});	
		resp.write(cache[pathname]);
		resp.end();
		return;
	}
	if(vurl.query(pathname)){
		try{
			(vurl.query(pathname))(req,resp);
			return;
		}catch(e){
			clog("Error executing "+pathname+" : "+e);
			resp.writeHead(501, {'Content-Type':'text/plain'});	
			resp.write("Error occurs,please send this page to public@keeer.ga:"+e);
			resp.end();
			return;
		}
	}
};

var cache={};
var server;

function clog(str){
	var time=new Date().toLocaleString();
	console.log("["+time+"] "+str+"\n");
	//clogi.innerHTML+=("["+time+"] "+str+"\n");
};

self.startsvc=function(){
	if(!server){
		try{
			server=http.createServer(listeningFunc);
			server.listen(this.port,this.ipaddress);
		}catch(e){
			clog("Error listening on "+this.ipaddress+":"+this.port+": "+e);
			server=undefined;
			return;
		}
		clog("Server started, listening on "+this.ipaddress+":"+this.port+".");
	}
};

self.stopsvc=function(){
	if(server){
		try{
			server.close();
		}catch(e){
			clog("Error closing: "+e);
			return;
		}
		clog("Server stopped.");
		server=undefined;
	}
};

var loadpages=["table.html","utils.js","admin.html"];
for(var i=0;i<loadpages.length;i++){
	try{
		var page=fs.readFileSync(dirname+loadpages[i]);
		cache[loadpages[i]]=page;
	}catch(e){
		clog("Error reading file "+loadpages[i]+" : "+e);
	}
}

this.pendReq=function(req){
    var params = url.parse(req.url,true).query;
	for(var i=0;i<self.tlist.length;i++)
		if(params["tid"]==self.tlist[i])return self.tlist[i];
	return false;
}
var pendReq=this.pendReq;

//add listening functions
vurl.add={path:"webapi/history",func:function(req,resp){
	var tid;
	if((tid=pendReq(req))!=false){
		resp.writeHead(200, {'Content-Type':'application/json'});
		resp.write(JSON.stringify(self.tobjs[tid]));
		resp.end();
		return;
	}
	resp.writeHead(403, {'Content-Type':'text/plain'});
	resp.write("403 unauthorized");
	resp.end();
}};
vurl.add={path:"webapi/new",func:function(req,resp){
	var tid;
	if((tid=pendReq(req))!=false){
		var params = url.parse(req.url,true).query;
		if(params["statid"]){
			resp.writeHead(200, {'Content-Type':'application/json'});
			var respobj={};
			changed=false;
			if(self.tobjs[tid].statid>params.statid){
				respobj.data=self.tobjs[tid].data;
				changed=true;
			}
			respobj.changed=changed;
			respobj.statid=self.tobjs[tid].statid;
			resp.write(JSON.stringify(respobj));
			resp.end();
			return;
		}
		resp.writeHead(400, {'Content-Type':'application/json'});
		resp.write("bad parameter");
		resp.end();
		return;
	}
	resp.writeHead(403, {'Content-Type':'text/plain'});
	resp.write("403 unauthorized");
	resp.end();
}};
vurl.add={path:"webapi/add",func:function(req,resp){
	var tid;
	if((tid=pendReq(req))!=false){
		var postData="";
		req.setEncoding("utf8");
		req.addListener("data", function(postDataChunk) {
			postData += postDataChunk;
		});
		req.addListener("end", function() {
			try{
				var params = JSON.parse(postData);
				if(!((typeof params["i"]=="undefined")||(typeof params["j"]=="undefined")||(typeof params["data"]=="undefined"))){
					self.tobjs[tid].data[params.i][params.j]=params.data;
					self.tobjs[tid].statid++;
					resp.writeHead(200, {'Content-Type':'application/json'});
					resp.write("{statid:"+(self.tobjs[tid].statid)+"}");
					resp.write(postData);
				}
				else{
					resp.writeHead(200, {'Content-Type':'application/json'});
					resp.write("{statid:-1}");
				}
				resp.end();
			}catch(e){
				resp.writeHead(501, {'Content-Type':'application/json'});
				clog("Error adding message :"+e);
				resp.end();
			}
		});
	}else{
		resp.writeHead(403, {'Content-Type':'text/plain'});
		resp.write("403 unauthorized");
		resp.end();
	}
}};
try{
	self.loginp=fs.readFileSync(dirname+"main.html");
}catch(e){
	clog("Error reading file main.html : "+e);
	self.loginp="";
}
vurl.add={path:"",func:function(req,resp){
	resp.writeHead(200, {'Content-Type':'text/html'});
	resp.write(self.loginp);
	resp.end();
}};


vurl.add={path:"webapi/login",func:function(req,resp){
	var tid;
	if((tid=pendReq(req))!=false){
		var params = url.parse(req.url,true).query;
		resp.writeHead(302, {'Location':'/table.html?tid='+encodeURI(tid)});
		resp.end();
		return;
	}
	resp.writeHead(302, {'Location':'/'});
	resp.write("Unauthorized");
	resp.end();
}};

vurl.add={path:"admin/add",func:function(req,resp){
	var params = url.parse(req.url,true).query;
	if(params.password==self.adminPwd){
		if(params.tid&&params.height&&params.width&&(typeof params.startup!="undefined")){
			if(self.tobjs[params.tid]){
				resp.writeHead(200);
				resp.write("This table has been created.");
				resp.end();
			}else{
				var tid=params.tid;
				var data=[];
				for(var i=0;i<params.height;i++){
					data[i]=[];
					for(var j=0;j<params.width;j++){
						data[i][j]=params.startup||"&nbsp;&nbsp;";
					}
				}
				var tobj={};
				tobj.height=params.height;
				tobj.width=params.width;
				tobj.statid=0;
				tobj.data=data;
				self.tlist.push(tid);
				self.tobjs[tid]=tobj;
				tobj.tid=tid;
				clog("table "+tid+" created.");
				resp.writeHead(200);
				resp.write(JSON.stringify(tobj));
				resp.end();
			}
		}else{
			resp.writeHead(200);
			resp.write("Bad parameter");
			resp.end();
		}
	}else{
		resp.writeHead(403);
		resp.write("403 Unauthorized");
		resp.end();
	}
	return;
}};
vurl.add={path:"admin/remove",func:function(req,resp){
	var params = url.parse(req.url,true).query;
	if(params.password==self.adminPwd){
		if(params.tid){
			if(self.tobjs[params.tid]){
				for(var i=0;i<self.tlist.length;i++)
					if(params["tid"]==self.tlist[i])self.tlist[i]=undefined;
				self.tobjs[params.tid]=undefined;
				resp.writeHead(200);
				resp.write("OK.");
				resp.end();
				clog("table "+params.tid+" removed.");
			}else{
				resp.writeHead(200);
				resp.write("This table hasn't been created.");
				resp.end();
			}
		}else{
			resp.writeHead(200);
			resp.write("Bad parameter");
			resp.end();
		}
	}else{
		resp.writeHead(403);
		resp.write("403 Unauthorized");
		resp.end();
	}
	return;
}};

})(exports?exports:this,__dirname?__dirname+"/":"./");


//this.startsvc();