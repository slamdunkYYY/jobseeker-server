/*
mongoose test
 */
const md5 = require('blueimp-md5')
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false);
mongoose.connect('mongodb+srv://MoonYYY:MOONYYY@cluster0-trtiu.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true})
const conn = mongoose.connection
conn.on('connected', function () {
    console.log('db connection success')
})

const userSchema = mongoose.Schema({
    username: {type: String, required: true}, // 用户名
    password: {type: String, required: true}, // 密码
    user_type: {type: String, required: true}, // 用户类型: dashen/laoban
})
const UserModel = mongoose.model('user', userSchema) // 集合名: users

// CRUD
// 3.1. 通过 Model 实例的 save()添加数据
function testSave() {
// user 数据对象
    const user = {
        username: 'xfzhang',
        password: md5('1234'),
        user_type: 'job seeker',
    }
    const userModel = new UserModel(user)
// 保存到数据库
    userModel.save(function (err, user) {
        console.log('save', err, user)
    })
}
//testSave()

// 3.2. 通过 Model 的 find()/findOne()查询多个或一个数据
function testFind() {
// 查找多个
    UserModel.find(function (err, users) { // 如果有匹配返回的是一个[user, user..], 如果没有一个匹配的返回[]
        console.log('find() ', err, users)
    })
// 查找一个
    UserModel.findOne({_id: '5e278b8b6802104360a29dc1'}, function (err, user) { // 如果有匹配返回的是一个 user, 如果没有一个匹配的返回 null
        console.log('findOne() ', err, user)
    })
} //
//testFind()

// 3.3. 通过 Model 的 findByIdAndUpdate()更新某个数据
function testUpdate() {
    UserModel.findByIdAndUpdate({_id: '5e278b8b6802104360a29dc1'}, {username: 'yyy'},
        function (err, user) {
            console.log('findByIdAndUpdate()', err, user)
        })
} //
testUpdate()

// 3.4. 通过 Model 的 remove()删除匹配的数据
function testDelete() {
    UserModel.deleteMany({_id: '5e278ba134d25623f83d1a41'}, function (err, result) {
        console.log('remove()', err, result)
    })
} //
testDelete()