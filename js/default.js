var App;
var router = new VueRouter();
var webPath = 'http://ssm.echao.com:8081/diamondsystem/';

Vue.http.interceptors.push(function(request, next) {
    var timeout;
    if (request._timeout) {
        timeout = setTimeout(function(){
            next(request.respondWith(request.body, {
                status: 408,
                statusText: '请求超时'
            }));
        },request._timeout)
    }
    next(function(response) {
        clearTimeout(timeout);
        return response;
    })
});
Vue.http.options._timeout = 15000;

// 页面顶部(带左侧菜单)
var topmenu = Vue.extend({
    template: "#topmenu",
    props: {
        userName: { type: String, default: function () { return '' }, required: true },
    },
    data() {
        return {
            "login": {
                "show": false,
            }
        }
    },
    filters: {},
    watch: {},
    methods: {
        _: function () {
            var _this = this;
        },
    },
    ready: function () {
        var _this = this;
    }
});
// 分页
var pagination = Vue.extend({
    template: '#pagination',
    props: {
        curPage: { type: Number, default: 1, required: true },// 初始页码
        showPages: { type: Number, default: 1, required: true },// 页码按钮数量
        totalPages: { type: Number, default: 0, required: true },// 最大页码
        index: { type: Number, default: 0, required: true }// 在一个父组件中使用的个数
    },
    data:function (){
        return {
            "jumppage":""
        }
    },
    computed: {
        pages() {
            let left = 1,
                right = this.totalPages,
                movePoint = Math.ceil(this.showPages / 2),
                pages = [];
            if (this.curPage > movePoint && this.curPage < this.totalPages - movePoint + 1) {
                left = this.showPages % 2 === 0 ? this.curPage - movePoint : this.curPage - movePoint + 1;
                right = this.curPage + movePoint - 1;
            } else if (this.curPage <= movePoint) {
                left = 1;
                right = this.showPages;
            } else {
                left = this.totalPages - this.showPages + 1;
                right = this.totalPages;
            }
            while (left <= right) {
                if (left > this.totalPages) { break; }
                pages.push(left);
                left++;
            }
            return pages;
        }
    },
    methods: {
        controlPage(page) {
            page = Number(page);
            if (page > this.totalPages) {
                page = this.totalPages;
            } else if (page < 1) {
                page = 1;
            }
            this.$dispatch("sendPage", page);
            // this.$root._transmitPaginationPage( page ); //无法使用，改为$dispatch
        },
    }
});

//产品中心
var product = Vue.extend({
    template: "#product_page",
    props:['parent'],
    components: { 'pagination': pagination,'topmenu': topmenu },
    data : function(){
        return {
            "parentMsg": {},
            "base": {
                "isSearch": false,
                "style_no": "",//搜索产品
                "rightBtn": 0,
                "basicConfigureDetail": '',
                "delid": "",//删除产品
                "pagesize": 8,
                "currentpage": 0,
                "showNoDataTips": false,//是否显示没有查询到数据
            },
            "goodsdata":{},
            "select":{
                "topMenu":{
                    "current":1,
                    "database":[
                        { "index":0, "val": 1, "name": "公共库存"},
                        // { "index":1, "val": 2, "name": "自有库存" },
                         { "index":2, "val": 3, "name": "基础配置" },
                    ],
                },
                "basicConfigure":{
                    "current":1,
                    "database":[
                        { "index":0, "val": 1, "name": "款式分类"},
                        // { "index":1, "val": 2, "name": "专题套系" },
                        // { "index":2, "val": 3, "name": "材质" },
                        // { "index":3, "val": 4, "name": "形状" },
                    ],
                },
                "choose1": {
                    "current": 0,
                    "database": [
                        { "val": 0, "name": "所有" },
                        { "val": 1, "name": "定制" },
                        { "val": 2, "name": "现货" },
                    ],
                },
                "choose2": {
                    "active": false,
                    "current": '',
                    "database": [],
                },
                "choose3": {
                    "active": false,
                    "current": '',
                    "database": [],
                },
                "configchoose2": {
                    "active": false,
                    "current": '',
                    "database": [],
                },
                "configchoose3": {
                    "active": false,
                    "current": '',
                    "database": [],
                },
                "checkchoose": {
                    "active": false,
                    "current": '',
                    "database": [],
                },
            },
        }
    },
    filters:{
        eachItem:function(val,obj){
            var _this = this;
            var s = '';
            for(let i in _this.select[obj].database){
                if (val == _this.select[obj].database[i].val){
                    s = _this.select[obj].database[i].name;
                }
            }
            return s;
        },
        eachImage: function (val) {
            var _this = this;
            var name = "";
            if (val) {
                name = "http://ssm.echao.com:8081/" + val;
            }
            return name;
        },
        eachLabel:function(val,i){
            var _this = this;
            switch(val){
                case "new": 
                    if(_this.goodsdata.list[i].goods_new.indexOf("新款")>0){
                        return val;
                    }
                break;
                case "pop":
                    if (_this.goodsdata.list[i].goods_new.indexOf("畅销") > 0) {
                        return val;
                    }
                break;
                case "yin":
                    if(_this.goodsdata.list[i].style_sort=='有'){
                        return val;
                    }
                break;
                case "made":
                    if(_this.goodsdata.list[i].goods_mode == 1){
                        return val;
                    }
                break;
            }
            return false;
        },
    },
    // computed: {
    //     currentPages: function () {
    //         return Math.ceil(this.base.currentpage / this.base.pagesize) + 1;
    //     }
    // },
    events: {
        "sendPage"(pages) {
            this.currentPages = pages
            this._getGoodsData(pages);
        },
    },
    watch : {
        "select.choose1.current": function () {
            var _this = this;
            _this._getGoodsData(1);
        },
        "select.choose2.current": function () {
            var _this = this;
            _this._getGoodsData(1);
        },
        "select.choose3.current": function () {
            var _this = this;
            _this._getGoodsData(1);
        },
    },
    methods: {
        _getGoodsData: function (pages) {
            var _this = this;
            _this.goodsdata = "";
            var param = {};
            param.choose1 = _this.select.choose1.current;
            param.choose2 = _this.select.choose2.current;
            param.choose3 = _this.select.choose3.current;
            param.style_no = _this.base.style_no;
            for(let i in param){
                if(!param[i]){
                    delete param[i];
                }
            }
            param.pagesize = _this.base.pagesize;
            param.currentpage = param.pagesize * (pages - 1);
            authPost('unified_goods/get', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                _this.goodsdata = json.data;
                if(_this.goodsdata.list.length == 0){
                    _this.base.showNoDataTips = true;
                }else{
                    _this.base.showNoDataTips = false;
                }
            });
        },
        // 公共库 自有库 基础配置切换
        _chooseTopMenu : function(obj){
            var _this = this;
            _this.select.topMenu.current = obj.val;
            if( obj.val == 3 ){
                _this._getConfigClassify();
            }
            console.log( 666, _this.select.topMenu.current);
            $(".topMenu_left_bottom").css('left',  obj.index * 140);
        },
        _chooseMenuTwo : function(obj){
            var _this = this;
            _this.select.basicConfigure.current = obj.val;
            console.log( 666, _this.select.basicConfigure.current);
            $(".uploadPdt_head .topMenu_left_bottom").css('left',  obj.index * 120);
        },
        _chooseSelect:function(obj,val){
            var _this = this;
            _this.select[obj].active = false;
            _this.select[obj].current = val;
        },
        _gotoAdd: function () {
            var _this = this;
            _this.base.rightBtn = 1;
            routerHref('uploadPdt');
        },
        _seeGoodsList:function(obj){
            var _this = this;
            window.sessionStorage.setItem("finishedGoods_id", obj.id);       
            window.sessionStorage.setItem("finishedGoods_goods_mode", obj.goods_mode);
            window.sessionStorage.setItem("finishedGoods_category_id1", obj.category_id1);
            window.sessionStorage.setItem("finishedGoods_category_id2", obj.category_id2);
            window.sessionStorage.setItem("finishedGoods_style_no", obj.style_no);
            window.sessionStorage.setItem("finishedGoods_goods_name", obj.goods_name);
            routerHref("finishedGoods");
        },
        _productEdit:function(obj){
            var _this = this;
            console.log(888,obj);
            _this.parentMsg.product = {};
            console.log(777,);
            for (let i in obj) {
                if (i == 'goods_config') {
                    for (let j in obj.goods_config) {
                        _this.parentMsg.product[obj.goods_config[j].key_name] = obj.goods_config[j].field_value;
                    }
                } else {
                    _this.parentMsg.product[i] = obj[i];
                }
            }
            console.log(666,_this.parentMsg.product);
            routerHref("editPdt");
        },
        _productDel: function (id) {
            var _this = this;
            _this.base.delid = id;
            _this.base.rightBtn = 4;
            $(".modal.product_del").modal('show');
        },
        _productDelpro:function(){
            var _this = this;
            _this.base.rightBtn = 0;
            var param = {};
            param.id = _this.base.delid;
            authPost('unified_goods/delete', param, function (error, json){
                if (error) { return layer.msg(error,{icon:0}); }
                $(".modal.product_del").modal('hide');
                layer.msg("删除成功！", { icon: 1 });
                _this._getGoodsData(1);
            });
        },
        // 款式搜索分类下拉列表
        _getClassify: function () {
            var _this = this;
            _this.select.choose2.database=[];
            _this.select.choose3.database=[];
            var param = {};
            authPost('unified_category/get', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                var t = {};
                t.val = '';
                t.name = '-请选择-';
                _this.select.choose2.database.push(t);
                _this.select.choose3.database.push(t);
                for (let i in json.data) {
                    t = {};
                    t.val = json.data[i].id;
                    t.name = json.data[i].catename;
                    switch (json.data[i].pid) {  // pid 0 大分类  1 小分类
                        case 0:
                            _this.select.choose2.database.push(t);
                        break;
                        case 1:
                            _this.select.choose3.database.push(t);
                        break;
                    }
                }
            });
        },
        // 基础配置下拉列表
        _getConfigClassify: function () {
            var _this = this;
            _this.select.configchoose2.database=[];
            _this.select.configchoose3.database=[];
            var param = {};
            authPost('unified_category/get', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                var t = {};
                for (let i in json.data) {
                    t = {};
                    t.val = json.data[i].id;
                    t.name = json.data[i].catename;
                    if( json.data[i].pid == 0 ){ // pid 0 大分类
                        _this.select.configchoose2.database.push(json.data[i]);
                    }else{
                        _this.select.configchoose3.database.push(json.data[i]);
                    }
                }
                console.log( 8888, _this.select.configchoose3.database,_this.select.configchoose2.database);
            });
        },
        _checkConfigClassify: function (id){
            var _this = this;
            _this.select.checkchoose.database = [];
            if( id == _this.base.basicConfigureDetail ){
                _this.base.basicConfigureDetail = 0;
            }else{
                _this.base.basicConfigureDetail = id;
            }
            var child = _this.select.configchoose3.database;
            for( let i in  child ){
                if( child[i].pid == id ){
                    _this.select.checkchoose.database.push(child[i]);
                }
            }
             console.log(6666,_this.select.checkchoose.database,id);
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this._getClassify();
        _this._getGoodsData(1);
    }
});

//添加产品
var uploadPdt = Vue.extend({
    template: "#uploadPdt_page",
    props: ['parent'],
    components: { 'topmenu': topmenu },
    data: function () {
        return {
            "parentMsg": {},
            "base": {
                "inputFoucs":0,//控制input输入时的样式
                "tipsShow":true,//是否显示提示信息
                "goods_size": "8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/24/25/26/27/28",//手寸
                "showContent":false,
                "param":{
                    "style_no": "",//款号
                    "goods_no": "",//货号
                    "goods_name": "",//品名
                    "goldWeigth_18K":"",
                    //"goldWeigth_18K": [{ "name": "PT950", "weight": "", "price": "" }, { "name": "18K红", "weight": "", "price": "" }],//金重 
                    // "goldWeigth_pt950": "",//金重 
                    // "maxprice": [],//空托价格 [{"name":"","val":""}]
                    // "minprice": "",//空托价格
                    "goods_video": "",//视频
                    "goods_pic": '',//款式图片
                    "goods_pic_all": [],//款式图片
                    "goods_content": "",//款式描述
                    "goods_size": '',//手寸
                    "s_weight":'0.3ct,0.5ct,0.7ct,1ct,1.5ct,2ct',//镶口
                    "destone_type": [{ "type": "", "weight": "", "num": "" }],//副石种类 
                    // "destone_weight": "",//副石重量
                    // "destone_num": "",//副石数量
                    "factory": "",//供应商
                    "factory_no": "",//供应商款号
                    "stone_type": "",//主石种类
                    "stone_weight": "",//主石重量
                    "stone_clarity": "",//主石颜色净度
                    "cert_no": [{ "cert": "", "cert_no": "" }],//证书
                },
            },
            "select": {
                "topMenu":{
                    "current":0,
                    "database":[
                        { "index": 0,"val": 0, "name": "单个上传" },
                        { "index": 1,"val": 1, "name": "批量上传" },
                    ],
                },
                "goods_mode": {//产品类型
                    "current": '',
                    "database": [  
                        { "val": 1, "name": "定制" },
                        { "val": 2, "name": "现货" },
                        { "val": 3, "name": "印记" },
                    ],
                },
                "category_id1": { //大分类  pid 0 大分类
                    "active":false,
                    "current": '',
                    "database": [],
                },
                "category_id2": { //小分类  pid  1 小分类
                    "active": false,
                    "current": '',
                    "database": [],
                },
                "special_id": {//专题套系
                    "current": '',
                    "database": [
                        { "val": "1", "name": "时尚新品" },
                        { "val": "2", "name": "爆款推荐" },
                        { "val": "3", "name": "异型钻" },
                        { "val": "4", "name": "经典款式" },
                        { "val": "5", "name": "主副款" },
                        { "val": "6", "name": "单钻款" }
                    ],
                },
                "material": {//材质
                    "current": ['PT950','18K红'],
                    "database": [
                        { "val": "足金", "name": "足金" },
                        { "val": "千足金", "name": "千足金" },
                        { "val": "PT900", "name": "PT900" },
                        { "val": "PT950", "name": "PT950" },
                        { "val": "PT990", "name": "PT990" },
                        { "val": "18K红", "name": "18K红" },
                        { "val": "18K黄", "name": "18K黄" },
                        { "val": "18K白", "name": "18K白" },
                        { "val": "18K分色", "name": "18K分色" },
                        { "val": "925银", "name": "925银" },
                        { "val": "999银", "name": "999银" }
                    ],
                },
                "stone_shape": {//主石形状
                    "current": '',
                    "database": [
                        { "val": "圆形", "name": "圆形" },
                        { "val": "梨形", "name": "梨形" },
                        { "val": "公主方", "name": "公主方" },
                        { "val": "马眼形", "name": "马眼形" },
                        { "val": "椭圆形", "name": "椭圆形" },
                        { "val": "蕾蒂恩", "name": "蕾蒂恩" },
                        { "val": "祖母绿", "name": "祖母绿" },
                        { "val": "心形", "name": "心形" },
                        { "val": "垫形", "name": "垫形" },
                        { "val": "三角形", "name": "三角形" }
                    ],
                },
                "style_region": {//呈现区域
                    "current": '',
                    "database": [
                        { "val": "款式中心", "name": "款式中心" },
                        { "val": "珠宝鉴赏", "name": "珠宝鉴赏" }
                    ],
                },
                "style_claw": {//爪型
                    "current": '',
                    "database": [
                        { "val": "a", "name": "四爪" },
                        { "val": "b", "name": "五爪" },
                        { "val": "c", "name": "六爪" },
                        { "val": "d", "name": "牛头款" },
                        { "val": "e", "name": "天使之吻" }
                    ],
                },
                "scoop_type": {//镶口方式
                    "current": '',
                    "database": [
                        { "val": "a", "name": "爪镶" },
                        { "val": "b", "name": "包镶" },
                        { "val": "c", "name": "迫镶" },
                        { "val": "d", "name": "无边镶" }
                    ],
                },
                "show_region": {//展示区域
                    "current": [],
                    "database": [
                        { "val": "1", "name": "定制系统" },
                        { "val": "2", "name": "查钻网" }
                    ],
                },
                "style_sort": {//银版
                    "current": '',
                    "database": [
                        { "val": "有", "name": "有" },
                        { "val": "无", "name": "无" }
                    ],
                },
                "goods_new": {//推荐款式
                    "current": [],
                    "database": [
                        { "val": "新款", "name": "新款" },
                        { "val": "畅销", "name": "畅销" }
                    ],
                },
                "key_name": {//款式关键字
                    "current": '',
                    "database": [],
                },
                "cert": {//证书机构
                    "active":false,
                    "database": [
                        { "val": "", "name": "请选择证书机构" },
                        { "val": "GIA", "name": "GIA" },
                        { "val": "HRD", "name": "HRD" },
                        { "val": "IGI", "name": "IGI" },
                        { "val": "EGL", "name": "EGL" },
                        { "val": "NGTC", "name": "NGTC" },
                        { "val": "Other", "name": "Other" }
                    ],
                },
            },
        }
    },
    filters: {
        eachItem:function(val,obj){
            var _this = this;
            var s = '';
            for(let i in _this.select[obj].database){
                if (val == _this.select[obj].database[i].val){
                    s = _this.select[obj].database[i].name;
                }
            }
            return s;
        }, 
        eachImage: function (val) {
            var _this = this;
            var name = "";
            if (val) {
                name = "http://ssm.echao.com:8081/" + val;
            }
            return name;
        },
        eachActive:function(val,obj){//选中数组中某元素后添加样式，多选
            var _this = this;
            var s = '';
            for(let i in _this.select[obj].current){
                if(val == _this.select[obj].current[i]){
                    s = 'active';
                }
            }
            return s;
        },
        eachSize:function(val,obj){
            var _this = this;
            var arr =[];
            if(obj == 'goods_size'){
                arr = _this.base[obj].split('/');
                arr = arr.join(",");
                _this.base.param[obj] = arr;
            }else if(obj == 's_weight'){
                arr = _this.base.param[obj].split('，');
                arr = arr.join(",");
                _this.base.param[obj] = arr;
            }else if(obj == 'key_name'){
                arr = _this.select[obj].current.split('，');
                arr = arr.join(",");
                _this.select[obj].current = arr;
            }
            return val;
        }
    },
    watch: {
        "select.goods_mode.current":function(val){
            var _this = this;
            switch(val){
                case 2:
                    _this.base.goods_size = "";//手寸
                    _this.base.param.s_weight = '';//镶口
                    _this.base.tipsShow = false;
                break;
                default:
                    _this.base.goods_size = "8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/24/25/26/27/28";//手寸
                    _this.base.param.s_weight = '0.3ct,0.5ct,0.7ct,1ct,1.5ct,2ct';//镶口
                    _this.base.tipsShow = true;
            }
        },
        "select.material.current":function(val){
            var _this = this;
            // _this.base.param.goldWeigth_18K = [];
            // if(val == [] || val == ""){return;}
            // for (let i in val) {
            //     let m = {};
            //     m.name = val[i];
            //     m.weight = '';
            //     m.price = '';
            //     _this.base.param.goldWeigth_18K.push(m);
            // }
            // console.log(_this.base.param.goldWeigth_18K);
            // if(val.length>7){
            //     $(".goldWeigth_18K_item_box").height(80 + "px");
            //     $(".goldWeigth_18K_item").height(80 + "px");
            //     $(".goldWeigth_18K_item").width(1200 + "px");
            // }
        },
    },
    methods: {
        _chooseSelect:function(obj,val){
            var _this = this;
            _this.select[obj].active = false;
            _this.select[obj].current = val;
            if (_this.select.category_id1.current != '' && _this.select.category_id2.current != '') {
                _this.base.showContent = true;
            } else {
                _this.base.showContent = false;
            }
        },
        _chooseCheck: function (obj, val) {
            var _this = this;
            for (let i in _this.select[obj].current) {
                if (val == _this.select[obj].current[i]) {
                    _this.select[obj].current.splice(i, 1);
                    return;
                }
            }
            _this.select[obj].current.push(val);
        },
        _chooseCheckRegion: function (obj, val) {
            var _this = this;
            for (let i in _this.select[obj].current) {
                if (val == _this.select[obj].current[i]) {
                    _this.select[obj].current.splice(i, 1);
                    return;
                }
            }
            _this.select[obj].current.push(val);
        },
        _chooseTopMenu: function (obj) {
            var _this = this;
            _this.select.topMenu.current = obj.val;
            $(".topMenu_left_bottom").css('left', obj.index * 120);
        },
        _addDestone:function(){//添加副石规格
            var _this = this;
            var p = { "type": "", "weight": "", "num": "" };
            _this.base.param.destone_type.push(p);
        },
        _addCert: function () {//添加证书
            var _this = this;
            var p = { "cert": "", "cert_no": "" };
            _this.base.param.cert_no.push(p);
            var i = _this.base.param.cert_no.length;
            $(".uploadPdt_item_cert").height(40 * i);
        },
        // _removeKeyword:function(index){
        //     var _this = this;
        //     _this.select.key_name.database.splice(index, 1);
        // },
        _removeImg: function (obj, index) {
            var _this = this;
            _this.base.param[obj].splice(index, 1);
            if(obj == 'cert_no'){
                var i = _this.base.param.cert_no.length;
                $(".uploadPdt_item_cert").height(40 * i);
            }
        },
        _selectBanner: function (file, obj) {
            var _this = this;
            if (file.length == 0) { return };
            for(var i=0;i<file.length;i++){
            lrz(file[i], {
                quality: 0.7,
                width: 750
            })
                .then(function (rst) {
                    return rst;
                })
                .then(function (rst) {
                    var data = {};
                    var uploadUrl = "http://ssm.echao.com:8081/img_upload/up";
                    data.data = rst.base64;
                    _this.$http.post(uploadUrl, data, { emulateJSON: true }).then(function (response) {
                        var result = response.body;
                        if (result.error_code == 0) {
                            //_this.base.param[obj].push(result.data);
                            if(_this.base.param[obj].length<6){
                                _this.base.param[obj].push(result.data);
                            }
                            // var img = new Image();
                            // img.src = "http://ssm.echao.com:8081/" + result.data;
                        } else {
                            layer.msg(result.error_msg, { icon: 0 });
                        }
                    }, function (response) {
                        if (response.status == 408) {
                            layer.msg(response.statusText, { icon: 0 });
                        } else {
                            layer.msg('出错了', { icon: 2 });
                        }
                    });

                    return rst;
                })
                .catch(function (err) {
                    layer.msg(err, { icon: 2 });
                })
                .always(function () {
                });
            }
        },
        _selectRaido: function () {  //goods_video
            var _this = this;
            var uploader_video = new plupload.Uploader({
                runtimes: 'gears,html5,html4,silverlight,flash', //上传插件初始化选用那种方式的优先级顺序 
                browse_button: ['video_upload_btn'], // 上传按钮 
                url: "http://ssm.echao.com:8081/img_upload/up", //远程上传地址 
                filters: {
                    max_file_size: '30mb', //最大上传文件大小（格式100b, 10kb, 10mb, 1gb） 
                    mime_types: [//允许文件上传类型 
                        { title: "files", extensions: "mpg,m4v,mp4,flv,3gp,mov,avi,rmvb,mkv,wmv" }
                    ]
                },
                //       chunk_size: "5mb", //分片上传文件时，每片文件被切割成的大小，为数字时单位为字节。也可以使用一个带单位的字符串，如"200kb"。当该值为0时表示不使用分片上传功能 
                multi_selection: false, //true:ctrl多文件上传, false 单文件上传 
                init: {
                    UploadProgress: function (up, file) { //上传中，显示进度条 
                        $(".loading_box").show();
                        var percent = file.percent;
                        $(".loading_bar").css({ "width": percent + "%" });
                        $(".loading_text").text(percent + "%");
                    },
                    FileUploaded: function (up, file, info) { //文件上传成功的时候触发 
                        console.log(info);
                        $(".loading_box").hide();
                        var data = eval("(" + info.response + ")");//解析返回的json数据 
                        // $("#video_iput").html("<input type='hidden'id='video_file' value='" + data.pic + "'/><input type='hidden'id='video_name' value='" + data.name + "'/>");
                    },
                    Error: function (up, err) { //上传出错的时候触发 
                        alert(err.message);
                    }
                }
            });
            console.log(111)
            uploader_video.init();
        },
        _reset:function(){
            var _this = this;
            for(let i in _this.select){
                _this.select[i].current = '';
            }
            _this.select.material.current = ['PT950', '18K红'];
            for(let i in _this.base.param){
                _this.base.param[i] = '';
            }
            _this.base.param.goods_pic_all = [];
            _this.base.param.goldWeigth_18K = [{ "name": "", "weight": "", "price": "" }];
            _this.base.param.destone_type = [{ "type": "", "weight": "", "num": "" }];
            _this.base.param.cert_no = [{ "cert": "", "cert_no": ""}];
            _this.base.goods_size = "8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/24/25/26/27/28";//手寸
            _this.base.param.s_weight = '0.3ct,0.5ct,0.7ct,1ct,1.5ct,2ct';//镶口
        },
        _save:function(){
            var _this = this;
            var param = {};
            for(let i in _this.select){
                param[i] = _this.select[i].current;
            }
            delete param.topMenu;
            delete param.cert;
            for(let i in _this.base.param){
                param[i] = _this.base.param[i];
            }
            param.goods_pic = _this.base.param.goods_pic_all[0];
            param.goods_new = JSON.stringify(param.goods_new);
            param.material = JSON.stringify(param.material);
            param.show_region = JSON.stringify(param.show_region);
            param.goods_pic_all = JSON.stringify(param.goods_pic_all);
            param.cert_no = JSON.stringify(param.cert_no);
            param.destone_type = JSON.stringify(param.destone_type);
            if (param.goods_mode == 1) {//"定制"没有参数：主石类型/主石种类/颜色净度/证书/货号
                delete param.stone_type;
                delete param.stone_weight;
                delete param.stone_clarity;
                delete param.cert_no;
                delete param.goods_no;
            }
            if (param.category_id2 == 4) {  //"耳饰"没有手寸&链长参数
                delete param.goods_size;
            }
            console.log(666,param);
            authPost('unified_goods/add', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                layer.msg("添加成功！",{icon:1});
                routerHref("product");
            });
        },
        _getType: function () {
            var _this = this;
            _this.select.goods_mode.database = [];
            var param = {};
            authPost('unified_category_type/get', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                for (let i in json.data) {
                    var t = {};
                    t.val = json.data[i].id;
                    t.name = json.data[i].type_name;
                    _this.select.goods_mode.database.push(t);
                }
                _this.select.goods_mode.current = _this.select.goods_mode.database[0].val;
            });
        },
        _getClassify: function () {
            var _this = this;
            _this.select.category_id1.database=[];
            _this.select.category_id2.database=[];
            var param = {};
            authPost('unified_category/get', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); } 
                _this.select.category_id1.database.push({"val":"","name":"请选择所属大分类"});
                _this.select.category_id2.database.push({ "val": "", "name": "请选择所属小分类" });
                for (let i in json.data) {
                    let t = {};
                    t.val = json.data[i].id;
                    t.name = json.data[i].catename;
                    switch (json.data[i].pid) {  // pid 0 大分类  1 小分类
                        case 0:
                            _this.select.category_id1.database.push(t);
                        break;
                        case 1:
                            _this.select.category_id2.database.push(t);
                        break;
                    }
                }
            });
        },
        _getCategory: function () {
            var _this = this;
            _this.base.database = [];
            var param = {};
            param.category_type_id = 0;
            param.category_type = 1;
            authPost('unified_parameter_field/get', param, function (error, json) {
                if (error) { return layer.msg(error); }
                // for (let i in json.data) {
                    // var t = {};
                    // t.val = json.data[i].id;
                    // t.name = json.data[i].type_name;
                    // _this.select.type.database.push(t);
                // }
                console.log(json)
            });
        },
    },
    ready: function () {
        var _this = this;
        _this.parentMsg = _this.parent;
        _this._getType();
        _this._getClassify();
        _this._getCategory();
    }
});

//编辑产品
var editPdt = Vue.extend({
    template: "#editPdt_page",
    props: ['parent'],
    components: { 'pagination': pagination, 'topmenu': topmenu },
    data: function () {
        return {
            "parentMsg": {},
            "base": {
                "inputFoucs": 0,//控制input输入时的样式
                "tipsShow": true,//是否显示提示信息
                "goods_size": "8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/24/25/26/27/28",//手寸
                "param": {
                    "id": "",
                    "style_no": "",//款号
                    "goods_no": "",//货号
                    "goods_name": "",//品名
                    "goods_video": "",//视频 
                    "goods_pic": "",
                    "goods_pic_all": [],//款式图片
                    "goods_content": "",//款式描述
                    "goods_size": '',//手寸
                    "goldWeigth_18K": "",//金重
                    "goldWeigth_pt950": "",//金重
                    "maxprice": "",//空托价格
                    "minprice": "",//空托价格
                    "s_weight": '0.3ct,0.5ct,0.7ct,1ct,1.5ct,2ct',//镶口
                    "destone_type": '[{ "type": "", "weight": "", "num": "" }]',//副石种类
                    "stone_type": "",//主石种类  
                    "stone_weight": "",//主石重量
                    "stone_clarity": "",//主石颜色净度
                    "factory": "",//供应商
                    "factory_no": "",//供应商款号
                    "cert_no": '[{ "cert": "", "cert_no": "" }]',//证书
                },
            },
            "select": {
                "goods_mode": {//产品类型
                    "current": '',
                    "database": [
                        { "val": 1, "name": "定制" },
                        { "val": 2, "name": "现货" },
                        { "val": 3, "name": "印记" },
                    ],
                },
                "category_id1": { //大分类  pid 0 大分类
                    "active": false,
                    "current": '',
                    "database": [],
                },
                "category_id2": { //小分类  pid  1 小分类
                    "active": false,
                    "current": '',
                    "database": [],
                },
                "special_id": {//专题套系 1时尚新品2爆款推荐3异型钻4经典款式5主副款6单钻款
                    "current": '',
                    "database": [
                        { "val": "1", "name": "时尚新品" },
                        { "val": "2", "name": "爆款推荐" },
                        { "val": "3", "name": "异型钻" },
                        { "val": "4", "name": "经典款式" },
                        { "val": "5", "name": "主副款" },
                        { "val": "6", "name": "单钻款" }
                    ],
                },
                "material": {//材质
                    "current": [],
                    "database": [
                        { "val": "足金", "name": "足金" },
                        { "val": "千足金", "name": "千足金" },
                        { "val": "PT900", "name": "PT900" },
                        { "val": "PT950", "name": "PT950" },
                        { "val": "PT990", "name": "PT990" },
                        { "val": "18K红", "name": "18K红" },
                        { "val": "18K黄", "name": "18K黄" },
                        { "val": "18K白", "name": "18K白" },
                        { "val": "18K分色", "name": "18K分色" },
                        { "val": "925银", "name": "925银" },
                        { "val": "999银", "name": "999银" }
                    ],
                },
                "stone_shape": {//主石形状
                    "current": '',
                    "database": [
                        { "val": "圆形", "name": "圆形" },
                        { "val": "梨形", "name": "梨形" },
                        { "val": "公主方", "name": "公主方" },
                        { "val": "马眼形", "name": "马眼形" },
                        { "val": "椭圆形", "name": "椭圆形" },
                        { "val": "蕾蒂恩", "name": "蕾蒂恩" },
                        { "val": "祖母绿", "name": "祖母绿" },
                        { "val": "心形", "name": "心形" },
                        { "val": "垫形", "name": "垫形" },
                        { "val": "三角形", "name": "三角形" }
                    ],
                },
                "style_region": {//呈现区域
                    "current": '',
                    "database": [
                        { "val": "款式中心", "name": "款式中心" },
                        { "val": "珠宝鉴赏", "name": "珠宝鉴赏" }
                    ],
                },
                "style_claw": {//爪型
                    "current": '',
                    "database": [
                        { "val": "a", "name": "四爪" },
                        { "val": "b", "name": "五爪" },
                        { "val": "c", "name": "六爪" },
                        { "val": "d", "name": "牛头款" },
                        { "val": "e", "name": "天使之吻" }
                    ],
                },
                "scoop_type": {//镶口方式
                    "current": '',
                    "database": [
                        { "val": "a", "name": "爪镶" },
                        { "val": "b", "name": "包镶" },
                        { "val": "c", "name": "迫镶" },
                        { "val": "d", "name": "无边镶" }
                    ],
                },
                "show_region": {//展示区域
                    "current": [],
                    "database": [
                        { "val": "1", "name": "定制系统" },
                        { "val": "2", "name": "查钻网" }
                    ],
                },
                "style_sort": {//银版
                    "current": '',
                    "database": [
                        { "val": "有", "name": "有" },
                        { "val": "无", "name": "无" }
                    ],
                },
                "goods_new": {//推荐款式
                    "current": [],
                    "database": [
                        { "val": "新款", "name": "新款" },
                        { "val": "畅销", "name": "畅销" }
                    ],
                },
                "key_name": {//款式关键字
                    "current": '',
                    "database": [],
                },
                "cert": {//证书机构
                    "active": false,
                    "database": [
                        { "val": "", "name": "请选择证书机构" },
                        { "val": "GIA", "name": "GIA" },
                        { "val": "HRD", "name": "HRD" },
                        { "val": "IGI", "name": "IGI" },
                        { "val": "EGL", "name": "EGL" },
                        { "val": "NGTC", "name": "NGTC" },
                        { "val": "Other", "name": "Other" }
                    ],
                },
            },
        } 
    },
    filters: {
        eachItem: function (val, obj) {
            var _this = this;
            var s = '';
            for (let i in _this.select[obj].database) {
                if (val == _this.select[obj].database[i].val) {
                    s = _this.select[obj].database[i].name;
                }
            }
            return s;
        },
        eachImage: function (val) {
            var _this = this;
            var name = "";
            if (val) {
                name = "http://ssm.echao.com:8081/" + val;
            }
            return name;
        },
        eachActive: function (val, obj) {//选中数组中某元素后添加样式，多选
            var _this = this;
            var s = '';
            for (let i in _this.select[obj].current) {
                if (val == _this.select[obj].current[i]) {
                    s = 'active';
                }
            }
            return s;
        },
        eachSize: function (val, obj) {
            var _this = this;
            var arr = [];
            if (obj == 'key_name') {
                arr = _this.select[obj].current.split('，');
                arr = arr.join(",");
                _this.select[obj].current = arr;
            }
            return val;
        }
    },
    watch: {},
    methods: {
        _chooseGoodsMode:function(val){
            var _this = this;
            _this.select.goods_mode.current = val;
            switch (val) {
                case 2:
                    _this.base.goods_size = "";//手寸
                    _this.base.param.s_weight = '';//镶口
                    _this.base.tipsShow = false;
                    break;
                default:
                    _this.base.goods_size = "8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/24/25/26/27/28";//手寸
                    _this.base.param.s_weight = '0.3ct,0.5ct,0.7ct,1ct,1.5ct,2ct';//镶口
                    _this.base.tipsShow = true;
            }
        },
        _chooseSelect: function (obj, val) {
            var _this = this;
            _this.select[obj].active = false;
            _this.select[obj].current = val;
        },
        _chooseCheck: function (obj, val) {
            var _this = this;
            for (let i in _this.select[obj].current) {
                if (val == _this.select[obj].current[i]) {
                    _this.select[obj].current.splice(i, 1);
                    return;
                }
            }
            _this.select[obj].current.push(val);
        },
        _chooseCheckRegion: function (obj, val) {
            var _this = this;
            for (let i in _this.select[obj].current) {
                if (val == _this.select[obj].current[i]) {
                    _this.select[obj].current.splice(i, 1);
                    return;
                }
            }
            _this.select[obj].current.push(val);
        },
        _chooseTopMenu: function (obj) {
            var _this = this;
            _this.select.topMenu.current = obj.val;
            $(".topMenu_left_bottom").css('left', obj.index * 120);
        },
        _addDestone: function () {//添加副石规格
            var _this = this;
            var p = { "type": "", "weight": "", "num": "" };
            _this.base.param.destone_type.push(p);
        },
        _addCert: function () {//添加证书
            var _this = this;
            var p = { "cert": "", "cert_no": "" };
            _this.base.param.cert_no.push(p);
            var i = _this.base.param.cert_no.length;
            $(".uploadPdt_item_cert").height(40 * i);
        },
        // _removeKeyword:function(index){
        //     var _this = this;
        //     _this.select.key_name.database.splice(index, 1);
        // },
        _removeImg: function (obj, index) {
            var _this = this;
            _this.base.param[obj].splice(index, 1);
            if (obj == 'cert_no') {
                var i = _this.base.param.cert_no.length;
                $(".uploadPdt_item_cert").height(40 * i);
            }
        },
        _selectBanner: function (file, obj) {
            var _this = this;
            if (file.length == 0) { return };

           for(var i=0;i<file.length;i++){
                lrz(file[i], {
                    quality: 0.7,
                    width: 750
                })
                .then(function (rst) {
                    return rst;
                })
                .then(function (rst) {
                    var data = {};
                    var uploadUrl = "http://ssm.echao.com:8081/img_upload/up";
                    data.data = rst.base64;
                    _this.$http.post(uploadUrl, data, { emulateJSON: true }).then(function (response) {
                        var result = response.body;
                        if (result.error_code == 0) {
                            if(_this.base.param[obj].length<6){
                                _this.base.param[obj].push(result.data);
                            }
                            console.log(_this.base.param[obj])
                        } else {
                            layer.msg(result.error_msg, { icon: 0 });
                        }
                    }, function (response) {
                        if (response.status == 408) {
                            layer.msg(response.statusText, { icon: 0 });
                        } else {
                            layer.msg('出错了', { icon: 2 });
                        }
                    });

                    return rst;
                })
                .catch(function (err) {
                    layer.msg(err, { icon: 2 });
                })
                .always(function () {
                });
            }
        },
        _reset: function () {
            var _this = this;
            for (let i in _this.select) {
                _this.select[i].current = '';
            }
            _this.select.material.current = [];
            for (let i in _this.base.param) {
                _this.base.param[i] = '';
            }
            _this.base.param.goods_pic_all = [];
            _this.base.param.destone_type = [{ "type": "", "weight": "", "num": "" }];
            _this.base.param.cert_no = [{ "cert": "", "cert_no": "" }];
            _this.base.goods_size = "8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/24/25/26/27/28";//手寸
            _this.base.param.s_weight = '0.3ct,0.5ct,0.7ct,1ct,1.5ct,2ct';//镶口
        },
        _save: function () {
            var _this = this;
            var param = {};
            for (let i in _this.base.param) {
                param[i] = _this.base.param[i];
            }
            for (let i in _this.select) {
                param[i] = _this.select[i].current;
            }
            delete param.cert;
            param.s_weight = _this.base.param.s_weight.split('，').join(",");
            param.goods_pic = _this.base.param.goods_pic_all[0];
            param.goods_new = JSON.stringify(param.goods_new);
            param.material = JSON.stringify(param.material);
            param.show_region = JSON.stringify(param.show_region);
            param.goods_pic_all = JSON.stringify(param.goods_pic_all);
            param.cert_no = JSON.stringify(param.cert_no);
            param.destone_type = JSON.stringify(param.destone_type);
            if (param.goods_mode == 1) {//如果是定制，没有参数：主石类型/主石种类/颜色净度/证书/货号
                delete param.stone_type;
                delete param.stone_weight;
                delete param.stone_clarity;
                delete param.cert_no;
                delete param.goods_no;
            } 
            if (param.category_id2 == 4) {  //耳饰没有手寸&链长参数
                delete param.goods_size;
            }
            authPost('unified_goods/update', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                layer.msg("修改成功！", { icon: 1 });
                routerHref("product");
            });
        },
        _getType: function () {
            var _this = this;
            _this.select.goods_mode.database = [];
            var param = {};
            authPost('unified_category_type/get', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                for (let i in json.data) {
                    var t = {};
                    t.val = json.data[i].id;
                    t.name = json.data[i].type_name;
                    _this.select.goods_mode.database.push(t);
                }
            });
        },
        _getClassify: function () {
            var _this = this;
            _this.select.category_id1.database = [];
            _this.select.category_id2.database = [];
            var param = {};
            authPost('unified_category/get', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                for (let i in json.data) {
                    var t = {};
                    t.val = json.data[i].id;
                    t.name = json.data[i].catename;
                    switch (json.data[i].pid) {  // pid 0 大分类  1 小分类
                        case 0:
                            _this.select.category_id1.database.push(t);
                            break;
                        case 1:
                            _this.select.category_id2.database.push(t);
                            break;
                    }
                }
            });
        },
        _getCategory: function () {
            var _this = this;
            _this.base.database = [];
            var param = {};
            param.category_type_id = 0;
            param.category_type = 1;
            authPost('unified_parameter_field/get', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                // for (let i in json.data) {
                // var t = {};
                // t.val = json.data[i].id;
                // t.name = json.data[i].type_name;
                // _this.select.type.database.push(t);
                // }
                console.log(json)
            });
        },
        _ready:function(){
            var _this = this;
            for(let i in _this.base.param){
                _this.base.param[i] = '';
            }
            for (let i in _this.select) {
                if (i == 'goods_new' || i == "material") {
                    _this.select[i].current = '';
                } else {
                    _this.select[i].current = '';
                }
            }
            _this._getType();
            _this._getClassify();
            _this._getCategory();
            _this.base.param.id = _this.parentMsg.product.id;
            if (_this.base.param.id == '') {
                layer.msg("数据丢失，请重新修改",{icon:0});
                return routerHref("product");
            }
            _this.base.param.style_no = _this.parentMsg.product.style_no;
            _this.base.param.goods_no = _this.parentMsg.product.goods_no;
            _this.base.param.goods_name = _this.parentMsg.product.goods_name;
            _this.base.param.goods_video = _this.parentMsg.product.goods_video;
            _this.base.param.goods_pic = _this.parentMsg.product.goods_pic;
            _this.base.param.goods_content = _this.parentMsg.product.goods_content;
            _this.base.param.goods_size = _this.parentMsg.product.goods_size;
            _this.base.param.goldWeigth_18K = _this.parentMsg.product.goldWeigth_18K;
            _this.base.param.goldWeigth_pt950 = _this.parentMsg.product.goldWeigth_pt950;
            _this.base.param.maxprice = _this.parentMsg.product.maxprice;
            _this.base.param.minprice = _this.parentMsg.product.minprice;
            _this.base.param.s_weight = _this.parentMsg.product.s_weight;
            _this.base.param.stone_type = _this.parentMsg.product.stone_type;
            _this.base.param.stone_weight = _this.parentMsg.product.stone_weight;
            _this.base.param.stone_clarity = _this.parentMsg.product.stone_clarity;
            _this.base.param.factory = _this.parentMsg.product.factory;
            _this.base.param.factory_no = _this.parentMsg.product.factory_no;

            _this.select.key_name.current = _this.parentMsg.product.key_name;
            _this.select.style_sort.current = _this.parentMsg.product.style_sort;
            _this.select.style_region.current = _this.parentMsg.product.style_region;
            _this.select.stone_shape.current = _this.parentMsg.product.stone_shape;
            _this.select.special_id.current = _this.parentMsg.product.special_id;
            _this.select.goods_mode.current = _this.parentMsg.product.goods_mode;
            _this.select.category_id1.current = _this.parentMsg.product.category_id1;
            _this.select.category_id2.current = _this.parentMsg.product.category_id2;


            _this.select.goods_new.current = $.parseJSON(_this.parentMsg.product.goods_new) || [];
            _this.select.show_region.current = $.parseJSON(_this.parentMsg.product.show_region) || [];
            _this.select.material.current = $.parseJSON(_this.parentMsg.product.material) || [];

            _this.select.style_claw.current = _this.parentMsg.product.style_claw;
            _this.select.scoop_type.current = _this.parentMsg.product.scoop_type;
            
            if (_this.parentMsg.product.cert_no != "" && _this.parentMsg.product.cert_no != undefined){
                // console.log(_this.parentMsg.product.cert_no == '"[{ \"cert\": \"\", \"cert_no\": \"\" }]"');
                // if (_this.parentMsg.product.cert_no == "[{ \"cert\": \"\", \"cert_no\": \"\" }]") {
                //     debugger;
                //     _this.base.param.cert_no = $.parseJSON($.parseJSON(_this.parentMsg.product.cert_no));
                //     console.log(_this.base.param.cert_no);
                // } else{
                _this.base.param.cert_no = $.parseJSON(_this.parentMsg.product.cert_no);
                // }
            }else{
                _this.base.param.cert_no = [{ "cert": "", "cert_no": "" }];
            }
            var i = _this.base.param.cert_no.length;
            $(".uploadPdt_item_cert").height(40 * i);
            if (_this.parentMsg.product.destone_type != "") {
                if(_this.parentMsg.product.destone_type.indexOf('[') > -1){
                    _this.base.param.destone_type = $.parseJSON(_this.parentMsg.product.destone_type);
                }else{
                    _this.base.param.destone_type = [];
                }
            } else {
                _this.base.param.destone_type = [{ "type": "", "weight": "", "num": "" }];
            }
            if (_this.parentMsg.product.goods_pic_all != "") {
                _this.base.param.goods_pic_all = $.parseJSON(_this.parentMsg.product.goods_pic_all);
            } else {
                _this.base.param.goods_pic_all = [];
            }
        },
    },
    ready: function () {
        var _this = this;
        _this.parentMsg = _this.parent;
        _this._ready();
    },
});

// 现货列表
var finishedGoods = Vue.extend({
    template: "#finishedGoods_page",
    props: ['parent'],
    components: { 'pagination': pagination,'topmenu': topmenu },
    data: function () {
        return {
            "parentMsg": {},
            "base": {
                "showNoDataTips":false,
                "top_id":"",
                "delid":"",
            },
            "dataList":{
                "list": [],
                "totalrecord": '',
                "totalpage": '',
                "currentpage":0,
                "pagesize":10,
                "style_no":"",
                "goods_name":"",
            },
        }
    },
    filters: {
        eachItem:function(val,obj){
            var _this = this;
            var s = "";
            for (let i in obj.config_data) {
                if (obj.config_data[i].key_name == "destone_type") {
                    let m = $.parseJSON(obj.config_data[i].field_value);
                    switch (val) {
                        case "destone_type1":
                            s = m[0].type;
                            break;
                        case "destone_type2":
                            s = m[0].weight;
                            break;
                        case "destone_type3":
                            s = m[0].num;
                            break;
                    }
                }else if (obj.config_data[i].key_name == val) {
                    s = obj.config_data[i].field_value;
                    if (val == "material"){
                        s = $.parseJSON(s).join(",");
                    } else if (val == "s_weight" && s != ""){
                        s += "Ct";
                    } else if (val == "goods_size" && s != "") {
                        s += "#";
                    }
                }
            }
            // (s == '') && (s = '-');
            return s;
        },
        formatDate:function(time){
            var unixTimestamp = new Date(time * 1000);
            return unixTimestamp.toLocaleString();
        },
    },
    computed: {
        currentPages: function () {
            return Math.ceil(this.dataList.currentpage / this.dataList.pagesize) + 1;
        }
    },
    events: {
        "sendPage"(pages) {
            this._getList(pages);
        },
    },
    watch: {},
    methods: {
        _getList : function(){
            var _this = this;
            var param = {};
            _this.dataList.style_no = sessionStorage.getItem("finishedGoods_style_no");
            _this.dataList.goods_name = sessionStorage.getItem("finishedGoods_goods_name");
            param.top_id = _this.base.top_id;
            authPost('unified_goods/get_one', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                if (json.data == null || json.data.length == 0) {
                    _this.base.showNoDataTips = true;
                    _this.dataList.list = [];
                    return;
                } else {
                    _this.dataList.list = json.data;
                    _this.dataList.totalrecord = json.data.length;
                    _this.dataList.totalpage = Math.ceil(json.data.length/_this.dataList.pagesize);
                    _this.base.showNoDataTips = false;
                }
                console.log( 7777, _this.dataList.list);
            });
        },
        _toAddGoods: function () {
            var _this = this;
            window.sessionStorage.setItem("editFinishedGoods", 0);
            routerHref("addGoods");
        },
        _toEditGoods:function(obj){
            var _this = this;
            window.sessionStorage.setItem("editFinishedGoods",1);
            _this.parentMsg.finishedGoods = obj;
            routerHref("addGoods");
        },
        _productDel: function (id) {
            var _this = this;
            _this.base.delid = id;
            $(".modal.finishedGoods_del").modal('show');
        },
        _productDelpro: function () {
            var _this = this;
            var param = {};
            param.id = _this.base.delid;
            authPost('unified_goods/delete', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                $(".modal.finishedGoods_del").modal('hide');
                layer.msg("删除成功！", { icon: 1 });
                _this._getList(1);
            });
        },
    },
    ready: function () {
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.top_id = window.sessionStorage.getItem("finishedGoods_id");
        _this._getList(1);
    }
});

// 添加现货
var addGoods = Vue.extend({
    template: "#addGoods_page",
    props: ['parent'],
    components: { 'topmenu': topmenu },
    data: function () {
        return {
            "parentMsg": {},
            "base": {
                "inputFoucs": 0,//控制input输入时的样式
                "isEdit":false,
                "param": {
                    "id":"",
                    "top_id": "",//  上级id
                    "goods_mode": "",//产品类型（与上级相同）
                    "category_id1": "", //大分类  （与上级相同）
                    "category_id2": "", //大分类  （与上级相同）
                    "style_goods_no": "",//款号 （与上级style_no相同）
                    "goods_type":1,//是否为现货  1为现货
                    "goods_no": "",//货号
                    "goods_name": "",//品名
                    "goldWeigth_18K": "",//金重
                    "goldWeigth_pt950": "",//金重
                    "maxprice": "",//空托价格
                    "minprice": "",//空托价格
                    "goods_video": "",//视频
                    "goods_pic": '',//款式图片
                    "goods_pic_all": [],//款式图片
                    "goods_content": "",//款式描述
                    "goods_size": '',//手寸
                    "s_weight": '',//镶口
                    "destone_type": [{ "type": "", "weight": "", "num": "" }],//副石种类 
                    "factory": "",//供应商
                    "factory_no": "",//供应商款号
                    "stone_type": "",//主石种类
                    "stone_weight": "",//主石重量
                    "stone_clarity": "",//主石颜色净度
                    "cert_no": [{ "cert": "", "cert_no": "" }],//证书
                },
            },
            "select": {
                "material": {//材质
                    "current": [],
                    "database": [
                        { "val": "足金", "name": "足金" },
                        { "val": "千足金", "name": "千足金" },
                        { "val": "PT900", "name": "PT900" },
                        { "val": "PT950", "name": "PT950" },
                        { "val": "PT990", "name": "PT990" },
                        { "val": "18K红", "name": "18K红" },
                        { "val": "18K黄", "name": "18K黄" },
                        { "val": "18K白", "name": "18K白" },
                        { "val": "18K分色", "name": "18K分色" },
                        { "val": "925银", "name": "925银" },
                        { "val": "999银", "name": "999银" }
                    ],
                },
                "stone_shape": {//主石形状
                    "current": '',
                    "database": [
                        { "val": "圆形", "name": "圆形" },
                        { "val": "梨形", "name": "梨形" },
                        { "val": "公主方", "name": "公主方" },
                        { "val": "马眼形", "name": "马眼形" },
                        { "val": "椭圆形", "name": "椭圆形" },
                        { "val": "蕾蒂恩", "name": "蕾蒂恩" },
                        { "val": "祖母绿", "name": "祖母绿" },
                        { "val": "心形", "name": "心形" },
                        { "val": "垫形", "name": "垫形" },
                        { "val": "三角形", "name": "三角形" }
                    ],
                },
                "key_name": {//款式关键字
                    "current": '',
                    "database": [],
                },
                "cert": {//证书机构
                    "active": false,
                    "database": [
                        { "val": "", "name": "请选择证书机构" },
                        { "val": "GIA", "name": "GIA" },
                        { "val": "HRD", "name": "HRD" },
                        { "val": "IGI", "name": "IGI" },
                        { "val": "EGL", "name": "EGL" },
                        { "val": "NGTC", "name": "NGTC" },
                        { "val": "Other", "name": "Other" }
                    ],
                },
            },
        }
    },
    filters: {
        eachItem: function (val, obj) {
            var _this = this;
            var s = '';
            for (let i in _this.select[obj].database) {
                if (val == _this.select[obj].database[i].val) {
                    s = _this.select[obj].database[i].name;
                }
            }
            return s;
        },
        eachImage: function (val) {
            var _this = this;
            var name = "";
            if (val) {
                name = "http://ssm.echao.com:8081/" + val;
            }
            return name;
        },
        eachActive: function (val, obj) {//选中数组中某元素后添加样式，多选
            var _this = this;
            var s = '';
            for (let i in _this.select[obj].current) {
                if (val == _this.select[obj].current[i]) {
                    s = 'active';
                }
            }
            return s;
        },
    },
    watch: {},
    methods: {
        _chooseSelect: function (obj, val) {
            var _this = this;
            _this.select[obj].active = false;
            _this.select[obj].current = val;
        },
        _chooseCheck: function (obj, val) {
            var _this = this;
            for (let i in _this.select[obj].current) {
                if (val == _this.select[obj].current[i]) {
                    _this.select[obj].current.splice(i, 1);
                    return;
                }
            }
            _this.select[obj].current.push(val);
        },
        _chooseTopMenu: function (obj) {
            var _this = this;
            _this.select.topMenu.current = obj.val;
            $(".topMenu_left_bottom").css('left', obj.index * 120);
        },
        _addDestone: function () {//添加副石规格
            var _this = this;
            var p = { "type": "", "weight": "", "num": "" };
            _this.base.param.destone_type.push(p);
        },
        _addCert: function () {//添加证书
            var _this = this;
            var p = { "cert": "", "cert_no": "" };
            _this.base.param.cert_no.push(p);
            var i = _this.base.param.cert_no.length;
            $(".uploadPdt_item_cert").height(40 * i);
        },
        // _removeKeyword:function(index){
        //     var _this = this;
        //     _this.select.key_name.database.splice(index, 1);
        // },
        _removeImg: function (obj, index) {
            var _this = this;
            _this.base.param[obj].splice(index, 1);
            if (obj == 'cert_no') {
                var i = _this.base.param.cert_no.length;
                $(".uploadPdt_item_cert").height(40 * i);
            }
        },
        _selectBanner: function (file, obj) {
            var _this = this;
            if (file.length == 0) { return };
            lrz(file[0], {
                quality: 0.7,
                width: 750
            })
                .then(function (rst) {
                    return rst;
                })
                .then(function (rst) {
                    var data = {};
                    var uploadUrl = "http://ssm.echao.com:8081/img_upload/up";
                    data.data = rst.base64;
                    _this.$http.post(uploadUrl, data, { emulateJSON: true }).then(function (response) {
                        var result = response.body;
                        if (result.error_code == 0) {
                            _this.base.param[obj].push(result.data);
                            var img = new Image();
                            img.src = "http://ssm.echao.com:8081/" + result.data;
                        } else {
                            layer.msg(result.error_msg, { icon: 0 });
                        }
                    }, function (response) {
                        if (response.status == 408) {
                            layer.msg(response.statusText, { icon: 0 });
                        } else {
                            layer.msg('出错了', { icon: 2 });
                        }
                    });

                    return rst;
                })
                .catch(function (err) {
                    layer.msg(err, { icon: 2 });
                })
                .always(function () {
                });
        },
        _reset: function () {
            var _this = this;
            for (let i in _this.select) {
                _this.select[i].current = '';
            }
            _this.select.material.current = [];
            for (let i in _this.base.param) {
                _this.base.param[i] = '';
            }
            _this.base.param.goods_pic_all = [];
            _this.base.param.destone_type = [{ "type": "", "weight": "", "num": "" }];
            _this.base.param.cert_no = [{ "cert": "", "cert_no": "" }];
        },
        _save: function () {
            var _this = this;
            var param = {};
            param.material = JSON.stringify(_this.select.material.current);
            param.stone_shape = _this.select.stone_shape.current;
            param.key_name = _this.select.key_name.current;
            for (let i in _this.base.param) {
                param[i] = _this.base.param[i];
            }
            if(!_this.base.isEdit){
                delete param.id;
            }
            param.style_no = _this.base.param.style_goods_no + "/" + _this.base.param.goods_no;//上级产品款号 + 该产品货号
            param.cert_no = JSON.stringify(param.cert_no);
            param.destone_type = JSON.stringify(param.destone_type);
            var error = {};
            error.goods_no = [/.+/, "货号不能为空"];
            error.goods_name = [/.+/, "产品名称不能为空"];          
            error.goldWeigth_18K = [/.+/, "金重不能为空"];
            error.goldWeigth_pt950 = [/.+/, "金重不能为空"];
            error.maxprice = [/.+/, "成品价格不能为空"];
            error.minprice = [/.+/, "成品价格不能为空"];
            for(let i in error){
                if(!error[i][0].test(param[i])){
                    return layer.msg( error[i][1], { icon: 0 });
                }
            }
            if (param.material == []) {
                return layer.msg("材质不能为空", { icon: 0 });
            }
            if (param.category_id2 == 4) {  //"耳饰"没有手寸&链长参数
                delete param.goods_size;
            } else {
                if (param.goods_size == '') {
                    var t = (param.category_id2 == 6 || param.category_id2 == 7 ? " 链长" : " 手寸");
                    return layer.msg(t + "不能为空", { icon: 0 });
                }
            }
            if (param.goods_pic_all.length==0) {
                return layer.msg("款式图片不能为空", { icon: 0 });
            } else {
                param.goods_pic = _this.base.param.goods_pic_all[0];
                param.goods_pic_all = JSON.stringify(param.goods_pic_all);
            }
            console.log(param);
            authPost('unified_goods/add', param, function (error, json) {
                if (error) { return layer.msg(error, { icon: 0 }); }
                layer.msg("添加成功！", { icon: 1 });
                routerHref("finishedGoods");
            });
        },
        _ready:function(){
            var _this = this;
            _this.parentMsg = _this.parent;
            _this.base.param.top_id = window.sessionStorage.getItem("finishedGoods_id");
            _this.base.param.goods_mode = window.sessionStorage.getItem("finishedGoods_goods_mode");
            _this.base.param.category_id1 = window.sessionStorage.getItem("finishedGoods_category_id1");
            _this.base.param.category_id2 = window.sessionStorage.getItem("finishedGoods_category_id2");
            _this.base.param.style_goods_no = window.sessionStorage.getItem("finishedGoods_style_no");
            _this.base.isEdit = window.sessionStorage.getItem("editFinishedGoods")-0;
            if (_this.base.isEdit == 1) { }
        },
    },
    ready: function () {
        var _this = this;
        _this._ready();
    }
});

// 设备列表
var equipment = Vue.extend({
    template: "#equipment_page",
    props: ['parent'],
    components: { 'pagination': pagination,'topmenu': topmenu },
    data: function () {
        return {
            "parentMsg": {},
            "base": {},
        }
    },
    filters: {},
    watch: {},
    methods: {
        _: function () {
            var _this = this;
        },
    },
    ready: function () {
        var _this = this;
        _this.parentMsg = _this.parent;
    }
});

// 订单中心
var order = Vue.extend({
    template: "#order_page",
    props: ['parent'],
    components: { 'pagination': pagination,'topmenu': topmenu },
    data: function () {
        return {
            "parentMsg": {},
            "base": {},
        }
    },
    filters: {},
    watch: {},
    methods: {
        _: function () {
            var _this = this;
        },
    },
    ready: function () {
        var _this = this;
        _this.parentMsg = _this.parent;
    }
});

/*
var product = Vue.extend({
    template: "#product_page",
    props: ['parent'],
    data: function () {
        return {
            "parentMsg": {},
            "base": {},
        }
    },
    filters: {},
    watch: {},
    methods: {
        _chooseTopMenu : function(){
            var _this = this;
            var data = {};
            data.user_id = _this.base.user_id;
            var url = "http://ssm.echao.com:8081/personnel/user_information_pc";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this.parentMsg.base.token = result.data[0].token;
                    _this._getPromotion();
                } else if( result.error_code == 300 ){
                    layer.msg(result.error_msg,{icon:0,time:1200});
                    setTimeout(function(){
                        window.location.href='login.html';
                    },1200);
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready: function () {
        var _this = this;
        _this.parentMsg = _this.parent;
    }
});
*/
App = Vue.extend({
    data : function(){
        return {
            "base" : {
                "user_id" : "",
            },
            "menu" : {
                "tabs" : "a",
                "database" : [
                    { "val": "a", "name": "产品中心", "href":"product"}
                    , { "val": "b", "name": "设备列表", "href":"equipment"}
                    , { "val": "c", "name": "订单中心", "href":"order"}
                ],
            },
            "topMenu" : {
                "login":{
                    "show":false,
                },
                "userMsg":{
                    "nickname":'',
                }
            },
            "parentMsg":{
                "product": {
                    "id": "",
                    "special_id": "",
                    "goods_mode": "",
                    "category_id1": "",
                    "category_id2": "",
                    "key_name": "",
                    "material": "",
                    "style_no": "",//款号
                    "style_region": "",
                    "style_sort": "",
                    "goods_no": "",//货号
                    "goods_name": "",//品名
                    "goods_new": "",
                    "goods_video": "",//视频
                    "goods_pic": "",
                    "goods_pic_all": [],//款式图片
                    "goods_content": "",//款式描述
                    "goods_size": '',//手寸
                    "goldWeigth_18K": "",//金重
                    "goldWeigth_pt950": "",//金重
                    "maxprice": "",//空托价格
                    "minprice": "",//空托价格
                    "s_weight": '0.3ct,0.5ct,0.7ct,1ct,1.5ct,2ct',//镶口
                    "destone_type": '',//副石种类  ' [{ "type": "", "weight": "", "num": "" }]'
                    "stone_shape": "",
                    "stone_type": "",//主石种类
                    "stone_weight": "",//主石重量
                    "stone_clarity": "",//主石颜色净度
                    "factory": "",//供应商
                    "factory_no": "",//供应商款号
                    "cert_no": '',//证书 '[{ "cert": "", "cert_no": "" }]'
                },
                "finishedGoods":{},
            }
        }
    },
    filters : {},
    watch : {},
    methods : {
        _selectMenu : function(tab,page){//一级菜单
            var _this = this;
            _this.menu.tabs = tab;
            routerHref(page);
        },
        _getRouter : function(){
            var _this = this;
            var hash = window.location.hash;
            if( hash ){
                if( hash.indexOf('product') > -1 ){
                    _this.menu.tabs = 'a';
                } else if (hash.indexOf('equipment') > -1 ){
                    _this.menu.tabs = 'b';
                } else if( hash.indexOf('order') > -1 ){
                    _this.menu.tabs = 'c';
                }
            }
        },
        _logOut:function () {
            window.sessionStorage.clear();
            window.location.href='login.html';
        },
        _hideLogin : function(){
            var _this = this;
            _this.topMenu.login.show = false;
        },
    },
    ready : function(){
        var _this = this;
        $('.hideDiv').show();
        // if( !_this.base.user_id ){
        //     layer.msg('数据丢失，请重新登录',{icon:0,time:1200});
        //     return setTimeout(function(){
        //         location.href = "login.html";
        //     },1200)
        // }
        _this._getRouter();
    }
});

// 路由配置
router.map({
    '/product': {
        component: product,
    },
    '/equipment': {
        component: equipment,
    },
    '/order': {
        component: order,
    },
    "/uploadPdt":{
        component: uploadPdt,
    },
    '/finishedGoods':{
        component: finishedGoods,
    },
    "/editPdt":{
        component: editPdt,
    },
    "/addGoods":{
        component: addGoods,
    },
    // "/addGoods": {
    //     component: addGoods,
    // },
});

router.redirect({
    '/': '/product'
});

function routerHref(href){
    $('.index_main_box').scrollTop(0);
    router.go({path : '/' + href});
}

function goBack(){
    window.history.go(-1);
}

function backPage(page){
    router.back = true;
    setTimeout(function(){
        router.go({path : '/' + page});
    },0)
}

function testUser(callback){
    var user_id = sessionStorage.getItem("user_id");
    if( user_id ){
        return callback();
    } else {
        layer.msg('数据丢失，请重新登录',{icon:0,time:1200});
        return setTimeout(function(){
            location.href = "login.html";
        },1200)
    }
}


function authPost(mode, param, callback) {
        var ajaxOpt = {};
        var load = null; //加载中图标
        var cd = "function" === typeof callback ? callback : function () { };
        ajaxOpt.url = webPath + mode;
        ajaxOpt.data = typeof param === 'object' ? param : {};
        ajaxOpt.data.adduid = 1;
        ajaxOpt.cache = false;
        ajaxOpt.type = 'post';
        ajaxOpt.dataType = 'json';
        ajaxOpt.success = function (json) {
            load && layer.close(load);
            cd(json.error_code - 0 ? (json.error_msg || json.error_code) : null, json);
        };
        ajaxOpt.error = function (XMLHttpRequest) {
            load && layer.close(load);
            layer.msg('出错了', { icon: 2 });
        };
        load = layer.load(2);
        return $.ajax(ajaxOpt);
}
// 使用
/*
authPost('wechat/mp/products/list/', param, function (error, json) {
    if (error) { return layer.msg(error,{icon:0}); }
    layer.msg("添加成功", { icon: 1 });
    $('.modal.add_notice').modal('hide');
});
*/
