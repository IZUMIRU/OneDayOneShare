// $ npm install request ejs
const request = require('request');
const ejs = require('ejs');
const fs = require('fs');

// templates配下のejsファイルを読み込む
const chooseTemplate = function(templateName) {
  return fs.readFileSync('templates/'+templateName+'.ejs', 'utf-8');
};

const postChatwork = function(url, template, requestBody, context) {
  const options = {
    url: url,
    headers: {
      'X-ChatWorkToken': process.env.CHATWORK_ACCOUNT_NOTIFICATION_ONEONE
    },
    form: {
      body: ejs.render(template, { event: requestBody }),
      to_ids: global.to_id,
      limit: limit
    }
  };

  const makeResponse = function(statusCode, body) {
    return {
      statusCode: statusCode,
      body: body
    };
  };

  request.post(options, function(error, responce, body) {
    // テンプレート内の本文があると通知されてしまうし、なければ502が返ってくるので、手動で200を格納
    if (template == chooseTemplate('unnecessary')) {
      responce.statusCode = 200;
    }
    if (!error && responce.statusCode == 200) {
      context.succeed(makeResponse(200, body));
    }
  });
};

const limit = Math.floor(new Date().getTime() / 1000);

exports.handler = function(event, context) {
  let chatworkRoomId = process.env.CHATWORK_ROOM_ONE_DAY_ONE_SHARE;
  let url = null;
  let template = chooseTemplate('unnecessary');

  // 定数作成：Githubイベント時に発生するwebhookから、headerとbodyを取得
  const requestHeaderEvent = Object(event.headers)['X-GitHub-Event'];
  const requestBody = JSON.parse(event.body);
  
  let to_id = null;
  if (requestBody.sender.login == "IZUMIRU") { 
    to_id = 2457947;
  } else {
    to_id = 2777822;
  }
  global.to_id = to_id;

  // 取得したheaderとbodyによって条件分岐して、通知するチャットルーム・テンプレートを指定
  if (requestHeaderEvent == 'issues' && requestBody.action == 'opened') {
    template = chooseTemplate('issue');
  } else if (requestHeaderEvent == 'issue_comment' && requestBody.action == 'created') {
    template = chooseTemplate('issue_comment');
  }
  
  if (template == chooseTemplate('issue')) {
    url = process.env.CHATWORK_API_URL+chatworkRoomId+'/tasks';
  } else {
    url = process.env.CHATWORK_API_URL+chatworkRoomId+'/messages';
  }

  postChatwork(url, template, requestBody, context);
};
