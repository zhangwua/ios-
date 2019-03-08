import userInfo from '@/config/getUserInfo'

var axios = require('axios')

function queryEncoded(params) {
    var queryStr = '';
    for (let key in params) {
        let value = encodeURIComponent(params[key])
        if (value == '' || value == undefined) continue
        queryStr += '&' + key + '=' + value;
    }
    return queryStr.substr(1);
}
function transformRequest(data) {
    let ret = ''
    for (let it in data) {
      ret +=  '&' + encodeURIComponent(it) + '=' + encodeURIComponent(data[it])
    }
    return ret.substr(1);
}
function request(method, url, params, success, failure) {
    method = method.toUpperCase();

    let headerInfo = {
        token: '',
    }, responseType = '';

    if (params && params.header) {
        for(let i in params.header){
            headerInfo[i] = params.header[i]
        }
        delete params.header;
    }
    headerInfo = Object.assign(headerInfo, userInfo.getUserInfo())
    if ((method === 'GET' && params) || (method == 'POST' && params) || (method == 'PUT' && params) || (method == 'DELETE' && params)) {
        if (params && params.responseType) {
            responseType = params.responseType;
            delete params.responseType;
        }
        if (params && params.data && params.data instanceof Array) {
            params = params.data;
        }
        let index = url.indexOf('?');
        if (method === 'GET' || method === 'DELETE') {
            url = (index == -1 ? url : url.substr(0, index)) + '?' + queryEncoded(params);
        }
    }
    if (!url) {
        alert('请求地址为空')
        return;
    }
    var root = '';
    if (url.indexOf('/ajax') > -1) {
      root = process.env.AJAX_ROOT;
    } else if (url.indexOf('/car_newEnergy') > -1) {
      root = '/';
    } else { 
      root = process.env.API_ROOT;
    }
    params = headerInfo.ContentType == 'application/x-www-form-urlencoded' ? transformRequest(params) : params
    axios.interceptors.response.use( response => {
      // IE 8-9
      if (response.data == null && response.config.responseType === 'json' &&response.request.responseText != null) {
        try {
          // eslint-disable-next-line no-param-reassign
          response.data = JSON.parse(response.request.responseText);
        } catch (e) {
          // ignored
        }
      }
      if (response.config && response.config.url && response.config.url.indexOf('/car_newEnergy') > -1) {
        response = {
            data: {
                result_code: response.status,
                data: response.data
            }
        }
      }
      return response;
    })

    axios({
        method: method,
        url: url,
        // data: method === 'POST' || method === 'PUT' ? params : null,
        data: ['POST', 'PUT', 'DELETE'].includes(method) ? params : null,
        headers: headerInfo ? headerInfo : null,
        responseType: responseType ? responseType : 'json',
        baseURL: root,
    }).then(function(res) {
        if ((res.data.result_code&&(res.data.result_code + '').indexOf('2') == 0) || res.data.code == 200|| (res.data.status&&res.data.status.status == 0)) {
          if (typeof success == 'function') {
            success(res.data);
          }
        } else if (responseType == 'blob') {
          if (typeof success == 'function') {
            success(res);
          }
        } else {
          if (typeof failure == 'function') {
            failure(res.data)
          } else {
            // window.alert('ERROR:' + JSON.stringify(res.data));
            console.log('ERROR:' + JSON.stringify(res.data));
          }
        }

    }).catch(function(err) {
    	console.log(err)
        if (err) {
          if (typeof failure == 'function') {
            failure({result_code:400, result_msg: '接口异常'})
          } else {
            // window.alert('API ERROR:' + err);
            console.log('API ERROR:' + err)
          }
        }
    });
}

function getMenuArry(){
        let path = this.$route.path
        let str = '\/sgm|\/setva|\/setvb|\/setvc|\/setvd|\/setve|\/setvf|\/setvg|\/setvh|\/detail|\/list|\/\\d+'
        path = path.replace(new RegExp("(" + str + ")", "g"), '')
        let menuIdArry = this.$helper.findInArray('url', path, this.menus).path.replace(/^-/,'').split('-')
        for(let i in menuIdArry){
          let id = 'menuIdLv'+i,name = 'menuNameLv'+i
          this.userInfo[id]= menuIdArry[i]
          this.userInfo[name]= encodeURI(this.$helper.findInArray('id', menuIdArry[i], this.menus).title)
          if(i==menuIdArry.length-1){
            this.userInfo.pageMenuId= menuIdArry[i]
            this.userInfo.pageMenuName= encodeURI(this.$helper.findInArray('id', menuIdArry[i], this.menus).title)
          }
        }
        this.userInfo.menu_id = this.$helper.findInArray('url', path, this.menus).id
      }

export default {
    get: function(url, params, success, failure) {
        return request('GET', url, params, success, failure);
    },
    post: function(url, params, success, failure) {
        return request('POST', url, params, success, failure);
    },
    put: function(url, params, success, failure) {
        return request('PUT', url, params, success, failure);
    },
    delete: function(url, params, success, failure) {
        return request('DELETE', url, params, success, failure);
    },
}
