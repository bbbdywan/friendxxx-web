# FriendXXX API文档


**简介**:FriendXXX API文档


**HOST**:localhost:8080


**联系人**:


**Version**:1.0


**接口路径**:/v2/api-docs


[TOC]






# WebSocket管理


## 获取用户聊天记录


**接口地址**:`/api/websocket/getmessage`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|UserId1|UserId1|query|true|integer(int64)||
|UserId2|UserId2|query|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«MessageVO»|
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||MessageVO|MessageVO|
|&emsp;&emsp;avatar|头像|string||
|&emsp;&emsp;messageList|消息列表|array|ChatMessage|
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;&emsp;&emsp;conversationId||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;receiverId||integer||
|&emsp;&emsp;&emsp;&emsp;senderId||integer||
|&emsp;&emsp;&emsp;&emsp;type||string||
|&emsp;&emsp;userName|用户名|string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"avatar": "",
		"messageList": [
			{
				"content": "",
				"conversationId": "",
				"createTime": "",
				"id": 0,
				"receiverId": 0,
				"senderId": 0,
				"type": ""
			}
		],
		"userName": ""
	},
	"message": ""
}
```


## 获取在线用户列表


**接口地址**:`/api/websocket/online-users`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«Map«string,object»»|
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||object||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {},
	"message": ""
}
```


## 服务端主动发送消息


**接口地址**:`/api/websocket/send-message`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|message|message|query|true|string||
|toUserId|toUserId|query|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«string»|
|201|Created||
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": "",
	"message": ""
}
```


# 用户管理模块


## 用户登录


**接口地址**:`/api/user/login`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>用户登录接口</p>



**请求示例**:


```javascript
{
  "userAccount": "",
  "userpassword": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userDTO|userDTO|body|true|UserDTO|UserDTO|
|&emsp;&emsp;userAccount|用户名||false|string||
|&emsp;&emsp;userpassword|密码||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«UserVO»|
|201|Created||
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||UserVO|UserVO|
|&emsp;&emsp;age|年龄|integer(int32)||
|&emsp;&emsp;avatar|头像|string||
|&emsp;&emsp;background|背景图|string||
|&emsp;&emsp;gender|性别|integer(int32)||
|&emsp;&emsp;id|主键值|integer(int64)||
|&emsp;&emsp;signature|个性签名|string||
|&emsp;&emsp;tags|标签|string||
|&emsp;&emsp;token|jwt令牌|string||
|&emsp;&emsp;userAccount|账号|string||
|&emsp;&emsp;userName|用户名|string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"age": 0,
		"avatar": "",
		"background": "",
		"gender": 0,
		"id": 0,
		"signature": "",
		"tags": "",
		"token": "",
		"userAccount": "",
		"userName": ""
	},
	"message": ""
}
```


## 获取用户信息


**接口地址**:`/api/user/profile`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>获取用户信息接口</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«UserVO»|
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||UserVO|UserVO|
|&emsp;&emsp;age|年龄|integer(int32)||
|&emsp;&emsp;avatar|头像|string||
|&emsp;&emsp;background|背景图|string||
|&emsp;&emsp;gender|性别|integer(int32)||
|&emsp;&emsp;id|主键值|integer(int64)||
|&emsp;&emsp;signature|个性签名|string||
|&emsp;&emsp;tags|标签|string||
|&emsp;&emsp;token|jwt令牌|string||
|&emsp;&emsp;userAccount|账号|string||
|&emsp;&emsp;userName|用户名|string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"age": 0,
		"avatar": "",
		"background": "",
		"gender": 0,
		"id": 0,
		"signature": "",
		"tags": "",
		"token": "",
		"userAccount": "",
		"userName": ""
	},
	"message": ""
}
```


## 获取用户标签列表


**接口地址**:`/api/user/tagsList`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>根据用户标签查询用户信息</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«List«用户信息»»|
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array|用户信息|
|&emsp;&emsp;age||integer(int32)||
|&emsp;&emsp;avatarUrl|头像URL|string||
|&emsp;&emsp;background||string||
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;email||string||
|&emsp;&emsp;gender||integer(int32)||
|&emsp;&emsp;id|用户ID|integer(int64)||
|&emsp;&emsp;isDelete||integer(int32)||
|&emsp;&emsp;phone||string||
|&emsp;&emsp;planetCode||string||
|&emsp;&emsp;signature||string||
|&emsp;&emsp;tags||string||
|&emsp;&emsp;updateTime||string(date-time)||
|&emsp;&emsp;userAccount|用户账号|string||
|&emsp;&emsp;userPassword||string||
|&emsp;&emsp;userRole||integer(int32)||
|&emsp;&emsp;userStatus||integer(int32)||
|&emsp;&emsp;username|用户名|string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [
		{
			"age": 0,
			"avatarUrl": "",
			"background": "",
			"createTime": "",
			"email": "",
			"gender": 0,
			"id": 0,
			"isDelete": 0,
			"phone": "",
			"planetCode": "",
			"signature": "",
			"tags": "",
			"updateTime": "",
			"userAccount": "",
			"userPassword": "",
			"userRole": 0,
			"userStatus": 0,
			"username": ""
		}
	],
	"message": ""
}
```


## 用户更新


**接口地址**:`/api/user/update`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>用户更新接口</p>



**请求示例**:


```javascript
{
  "age": 0,
  "avatarUrl": "",
  "background": "",
  "createTime": "",
  "email": "",
  "gender": 0,
  "id": 0,
  "isDelete": 0,
  "phone": "",
  "planetCode": "",
  "signature": "",
  "tags": "",
  "updateTime": "",
  "userAccount": "",
  "userPassword": "",
  "userRole": 0,
  "userStatus": 0,
  "username": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|user|user|body|true|用户信息|用户信息|
|&emsp;&emsp;age|||false|integer(int32)||
|&emsp;&emsp;avatarUrl|头像URL||false|string||
|&emsp;&emsp;background|||false|string||
|&emsp;&emsp;createTime|||false|string(date-time)||
|&emsp;&emsp;email|||false|string||
|&emsp;&emsp;gender|||false|integer(int32)||
|&emsp;&emsp;id|用户ID||false|integer(int64)||
|&emsp;&emsp;isDelete|||false|integer(int32)||
|&emsp;&emsp;phone|||false|string||
|&emsp;&emsp;planetCode|||false|string||
|&emsp;&emsp;signature|||false|string||
|&emsp;&emsp;tags|||false|string||
|&emsp;&emsp;updateTime|||false|string(date-time)||
|&emsp;&emsp;userAccount|用户账号||false|string||
|&emsp;&emsp;userPassword|||false|string||
|&emsp;&emsp;userRole|||false|integer(int32)||
|&emsp;&emsp;userStatus|||false|integer(int32)||
|&emsp;&emsp;username|用户名||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«int»|
|201|Created||
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||integer(int32)|integer(int32)|
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": 0,
	"message": ""
}
```


## 用户更新头像


**接口地址**:`/api/user/update/image`


**请求方式**:`POST`


**请求数据类型**:`multipart/form-data`


**响应数据类型**:`*/*`


**接口描述**:<p>用户更新头像接口</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|file|file|formData|true|file||
|type|type|query|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«string»|
|201|Created||
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": "",
	"message": ""
}
```


## 查看用户信息


**接口地址**:`/api/user/{userID}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>查看用户信息接口</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userID|userID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«GetuUserVO»|
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||GetuUserVO|GetuUserVO|
|&emsp;&emsp;age|年龄|integer(int32)||
|&emsp;&emsp;avatar|头像|string||
|&emsp;&emsp;background|背景图|string||
|&emsp;&emsp;gender|性别|integer(int32)||
|&emsp;&emsp;id|主键值|integer(int64)||
|&emsp;&emsp;signature|个性签名|string||
|&emsp;&emsp;tags|标签|string||
|&emsp;&emsp;userAccount|账号|string||
|&emsp;&emsp;userName|用户名|string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"age": 0,
		"avatar": "",
		"background": "",
		"gender": 0,
		"id": 0,
		"signature": "",
		"tags": "",
		"userAccount": "",
		"userName": ""
	},
	"message": ""
}
```


# 群聊管理模块


## 创建群聊


**接口地址**:`/api/group/create`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>创建群聊接口</p>



**请求示例**:


```javascript
{
  "avatar_url": "",
  "creator_id": 0,
  "group_name": "",
  "introduction": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|groupCreatDTO|groupCreatDTO|body|true|GroupCreatDTO|GroupCreatDTO|
|&emsp;&emsp;avatar_url|群头像||false|string||
|&emsp;&emsp;creator_id|创建者ID||false|integer(int64)||
|&emsp;&emsp;group_name|群名称||false|string||
|&emsp;&emsp;introduction|群简介||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«int»|
|201|Created||
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||integer(int32)|integer(int32)|
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": 0,
	"message": ""
}
```


## 展示群聊列表


**接口地址**:`/api/group/grouplist`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>展示群聊列表接口</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«List«GroupListVO»»|
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array|GroupListVO|
|&emsp;&emsp;avatar_url|群聊头像|string||
|&emsp;&emsp;group_id|群聊ID|integer(int64)||
|&emsp;&emsp;group_name|群聊名称|string||
|&emsp;&emsp;introduction|群聊介绍|string||
|&emsp;&emsp;member||boolean||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [
		{
			"avatar_url": "",
			"group_id": 0,
			"group_name": "",
			"introduction": "",
			"member": true
		}
	],
	"message": ""
}
```


## 加入群聊


**接口地址**:`/api/group/join`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>加入群聊接口</p>



**请求示例**:


```javascript
{
  "groupId": 0,
  "userId": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|groupJoinDTO|groupJoinDTO|body|true|GroupJoinDTO|GroupJoinDTO|
|&emsp;&emsp;groupId|群聊ID||false|integer(int64)||
|&emsp;&emsp;userId|用户ID||false|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result«int»|
|201|Created||
|401|Unauthorized||
|403|Forbidden||
|404|Not Found||


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||integer(int32)|integer(int32)|
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": 0,
	"message": ""
}
```