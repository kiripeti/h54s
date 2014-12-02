/*! h54s v0.0.6 - 2014-12-02 
 *  License: GPL 
 * Author: Boemska 
*/
var ajax = (function () {
  var xhr = function(type, url, data) {
    var methods = {
      success: function() {},
      error: function() {}
    };
    var XHR     = XMLHttpRequest || ActiveXObject;
    var request = new XHR('MSXML2.XMLHTTP.3.0');

    request.open(type, url, true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if (request.status >= 200 && request.status < 300) {
          methods.success.call(methods, request);
        } else {
          methods.error.call(methods, request);
        }
      }
    };

    request.send(data);

    return {
      success: function (callback) {
        methods.success = callback;
        return this;
      },
      error: function (callback) {
        methods.error = callback;
        return this;
      }
    };
  };

  var serialize = function(obj) {
    var str = [];
    for(var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  };

  return {
    get: function(url, data) {
      var dataStr;
      if(typeof data === 'object') {
        dataStr = serialize(data);
      }
      var urlWithParams = dataStr ? (url + '?' + dataStr) : '';
      return xhr('GET', urlWithParams);
    },
    post: function(url, data) {
      var dataStr;
      if(typeof data === 'object') {
        dataStr = serialize(data);
      }
      return xhr('POST', url, dataStr);
    }
  };
})();

h54s = function(config) {

  this.systemtype = "SAS";
  this.counters   =  {
    maxXhrRetries: 5, // this is the number of times that xhrs retry before failing
    finishedXhrCount: 0, // leave as 0
    totalXhrCount: 0 // leave as 0
  };
  this.sasService = 'default';
  this.url        = "/SASStoredProcess/do";
  this.debug      = false;
  this.loginUrl   = '/SASLogon/Logon.do';


  if(!config) {
    return;
  }

  //merge config argument config
  for(var key in config) {
    if((key === 'url' || key === 'loginUrl') && config[key].charAt(0) !== '/') {
      config[key] = '/' + config[key];
    }
    this[key] = config[key];
  }

  //if server is remote use the full server url
  //NOTE: this is not permited by the same-origin policy
  if(config.hostUrl) {
    if(config.hostUrl.charAt(config.hostUrl.length - 1) === '/') {
      config.hostUrl = config.hostUrl.slice(0, -1);
    }
    this.hostUrl  = config.hostUrl;
    this.url      = config.hostUrl + this.url;
  }
};

/*global h54s*/
h54s.prototype.call = function(sasProgram, callback) {
  var self = this;
  var callArgs = arguments;
  if (!callback && typeof callback !== 'function'){
    throw new Error('You must provide callback');
  }
  if(!sasProgram) {
    throw new Error('You must provide Sas program file path');
  }
  if(typeof sasProgram !== 'string') {
    throw new Error('First parameter should be string');
  }

  // initialize dynamically generated xhr options first
  var myprogram;
  if (this.systemtype == 'WPS') {
    myprogram = this.metaProgram + '.sas';
  } else if (this.systemtype == 'SAS') {
    myprogram = this.metaProgram;
  }

  ajax.post(this.url, {
    _program: sasProgram,
    _debug: this.debug ? 1 : 0,
    _service: this.sasService,
  }).success(function(res) {
    if(/<form.+action="Logon.do".+/.test(res.responseText) && self.autoLogin) {
      self.logIn(function(status) {
        if(status === 200) {
          self.call.apply(self, callArgs);
        } else {
          callback(new Error('Unable to login'));
        }
      });
    } else if(/<form.+action="Logon.do".+/.test(res.responseText) && !self.autoLogin) {
      callback(callback(new Error('You are not logged in')));
    } else {
      callback(undefined, res);
    }
  }).error(function(res) {
    callback(res);
  });
};

h54s.prototype.setCredentials = function(user, pass) {
  if(!user || !pass) {
    throw new Error('Missing credentials');
  }
  this.user = user;
  this.pass = pass;
};

h54s.prototype.logIn = function(/* (user, pass, callback) | callback */) {
  var callback;
  if((!this.user && !arguments[0]) || (!this.pass && !arguments[1])) {
    throw new Error('Credentials not set');
  }
  if(typeof arguments[0] === 'string' && typeof arguments[1] === 'string') {
    this.setCredentials(this.user || arguments[0], this.pass || arguments[1]);
    callback = arguments[2];
  } else {
    callback = arguments[0];
  }

  var callCallback = function(status) {
    if(typeof callback === 'function') {
      callback(status);
    }
  };

  if(this.hostUrl) {
    this.loginUrl = this.hostUrl + this.loginUrl.slice();
  }

  ajax.post(this.loginUrl, {
    _debug: this.debug ? 1 : 0,
    _sasapp: "Stored Process Web App 9.3",
    _service: this.sasService,
    ux: this.user,
    px: this.pass,
  }).success(function(res) {
    callCallback(res.status);
  }).error(function(res) {
    callCallback(res.status);
  });
};


