var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5')
const { UserModel, ChatModel} = require('../db/models')
const filter = {password: 0} // 查询时过滤出指定的属性

var express = require('express');
var app = express();
//设置跨域访问
app.all('*', function (req, res, next) {
//响应头指定了该响应的资源是否被允许与给定的origin共享。*表示所有域都可以访问，同时可以将*改为指定的url，表示只有指定的url可以访问到资源
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  //允许请求资源的方式
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1');
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/testGet', function(req, res) {
  res.send({code:0, data:'testGet'})
})
router.post('/testPost', function(req, res) {
  const {username, password, user_type} = req.body
  res.send({code:0, data:{username,password,user_type}})
});

router.post('/register', function (req, res) {
  const {username, password, user_type} = req.body
// 2. 处理数据
// 3. 返回响应数据
// 2.1. 根据 username 查询数据库, 看是否已存在 user
  UserModel.findOne({username}, function (err, user) {
// 3.1. 如果存在, 返回一个提示响应数据: 此用户已存在
    if(user) {
      res.send({code: 1, msg: 'Username already exsits'}) // code 是数据是否是正常数据的标识
    } else {
// 2.2. 如果不存在, 将提交的 user 保存到数据库
      new UserModel({username, password: md5(password), user_type}).save(function (err, user) {
// 生成一个 cookie(userid: user._id), 并交给浏览器保存
       res.cookie('userid', user._id, {maxAge: 1000*60*60*24*7}) // 持久化 cookie, 浏览器会保存在本地文件
// 3.2. 保存成功, 返回成功的响应数据: user
        const data = {username, user_type,_id:user._id}
        res.send({code: 0, data}) // 返回的数据中不要携带 pwd
      })
    }
  })
})
// 登陆路由
router.post('/login', function (req, res) {
// 1. 获取请求参数数据(username, password)
  const {username, password} = req.body
// 2. 处理数据: 根据 username 和 password 去数据库查询得到 user
  UserModel.findOne({username, password: md5(password)}, filter, function (err, user)
  {
// 3. 返回响应数据
// 3.1. 如果 user 没有值, 返回一个错误的提示: 用户名或密码错误
    if(!user) {
      res.send({code: 1, msg: 'username or password wrong'})
    } else {
// 生成一个 cookie(userid: user._id), 并交给浏览器保存
      res.cookie('userid', user._id, {maxAge: 1000*60*60*24*7})
// 3.2. 如果 user 有值, 返回 user
      res.send({code: 0, data: user}) // user 中没有 pwd
    }
  })
})

router.post('/update', function(req, res) {
  const userid = req.cookies.userid
  console.log(("userid"),userid)
  if(!userid) {// 如果没有, 说明没有登陆, 直接返回提示
    return res.send({code: 1, msg: 'Please login'});
  }
  const user = req.body
  console.log(("user"), user)
  UserModel.findByIdAndUpdate({_id: userid}, user, function (err, oldUser) {// user是数据库中原来的数据
    if (!oldUser) {
      res.clearCookie('userid')
      res.send({code:1, msg:'Please login'})
    }
    else {
      const {_id, username, user_type} = oldUser
      // 合并用户信息
      const data = Object.assign(user , {_id, username, user_type})
      console.log(data)
      //assign(obj1, obj2, obj3,...)
      // 将多个指定的对象进行合并, 返回一个合并后的对象
      res.send({code: 0, data})
    }
    //node 端 ...不可用 const data = {...req.body, _id, username, type}-> node wrong
  })
})
router.post('/remove', function (req, res) {
// 取出 cookie 中的 userid
  const userid = req.cookies.userid
  if(!userid) {
    return res.send({code: 1, msg: '请先登陆'})
  } //  查询对应的 user
  UserModel.deleteMany({_id: userid}, function (err, result) {
    if (err) {
      res.send(err);
    } else {
          res.send({code: 0,result});
    }
  })
})

router.post('/remove-user-all-msg', function (req, res) {
// 取出 cookie 中的 userid
  const userid = req.cookies.userid
  if(!userid) {
    return res.send({code: 1, msg: '请先登陆'})
  } //  查询对应的 user
   //
  ChatModel.deleteMany({from: userid}, function(err,result){
    if (err) {
      res.send(err);
    }
    else {
      res.send({code:0, result})
    }
  })
})

// 根据 cookie 获取对应的 user
router.get('/user', function (req, res) {
// 取出 cookie 中的 userid
  const userid = req.cookies.userid
  if(!userid) {
    return res.send({code: 1, msg: '请先登陆'})
  } //  查询对应的 user
  UserModel.findOne({_id: userid}, filter, function (err, user) {
    return res.send({code: 0, data: user})
  })
})

router.get('/list',function(req, res){
  const { user_type } = req.query
  console.log(user_type)
  UserModel.find({user_type},function(err,users){
    return res.json({code:0, data: users})
  })
})

/*
获取当前用户所有相关聊天信息列表
*/
router.get('/msglist', function (req, res) {
// 获取 cookie 中的 userid
  const userid = req.cookies.userid
// 查询得到所有 user 文档数组
  UserModel.find(function (err, userDocs) {
// 用对象存储所有 user 信息: key 为 user 的_id, val 为 name 和 header 组成的 user 对象
    const users = {} // 对象容器
    userDocs.forEach(doc => {
       users[doc._id] = {username: doc.username, avantar: doc.avantar}
    })

    // const users = userDocs.reduce((users,user)=>{
    //   users[user._id] = {username: user.username, avantar: user.avantar}
    //   return users
    // },{})

    /*
    查询 userid 相关的所有聊天信息
    参数 1: 查询条件
    参数 2: 过滤条件
    参数 3: 回调函数
    */
    ChatModel.find({'$or': [{from: userid}, {to: userid}]}, filter, function (err,chatMsgs) {
// 返回包含所有用户和当前用户相关的所有聊天消息的数据
      res.send({code: 0, data: {users, chatMsgs}})
    })
  })
})
/*
修改指定消息为已读
*/
router.post('/readmsg', function (req, res) {
// 得到请求中的 from 和 to
const from = req.body.from
const to = req.cookies.userid
  /*
更新数据库中的 chat 数据
参数 1: 查询条件
参数 2: 更新为指定的数据对象
参数 3: 是否 1 次更新多条, 默认只更新一条
参数 4: 更新完成的回调函数
*/
ChatModel.update({from, to, read: false}, {read: true}, {multi: true}, function (err, doc) {
  console.log(doc.nModified)
    res.send({code: 0, data: doc.nModified}) // 更新的数量
  })
})

module.exports = router;
