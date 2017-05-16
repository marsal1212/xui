--[[
/*
 * HTML5 GUI Framework for FreeSWITCH - XUI
 * Copyright (C) 2015-2017, Seven Du <dujinfang@x-y-t.cn>
 *
 * Version: MPL 1.1
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
 * The Original Code is XUI - GUI for FreeSWITCH
 *
 * The Initial Developer of the Original Code is
 * Seven Du <dujinfang@x-y-t.cn>
 * Portions created by the Initial Developer are Copyright (C)
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Seven Du <dujinfang@x-y-t.cn>
 *
 *
 */
]]

xtra.start_session()
xtra.require_login()

local do_debug = true

function __FILE__() return debug.getinfo(2,'S').source end
function __LINE__() return debug.getinfo(2, 'l').currentline end
function __FUNC__() return debug.getinfo(1).name end

content_type("application/json")

require 'xdb'
require 'xwechat'
require 'm_dict'
require 'xtra_config'
require 'utils'
xdb.bind(xtra.dbh)

get('/', function(params)
	n, tickets = xdb.find_all("tickets", "id desc")
	if (n > 0) then
		return tickets
	else
		return "[]"
	end
end)

get('/:id', function(params)
	ticket = xdb.find("tickets", params.id)

	if ticket then
		return ticket
	else
		return 404
	end
end)

get('/:id/comments', function(params)
	n, comments = xdb.find_by_cond("ticket_comments", {ticket_id = params.id}, "created_epoch DESC")
	local comments_res = {}
	for i, v in pairs(comments) do
		local n, users = xdb.find_by_cond("wechat_users", {user_id = v.user_id})
		local user = users[1]
		-- v.avatar_url = user.headimgurl
		table.insert(comments_res,v)
	end
	if (n > 0) then
		return comments_res
	else
		return "[]"
	end
end)

post('/comments', function(params)
	local comment = {}
	comment.content = env:getHeader("content")
	comment.ticket_id = env:getHeader("ticket_id")
	comment.user_id = env:getHeader("user_id")
	comment.user_name = env:getHeader("user_name")
	freeswitch.consoleLog("ERR",utils.json_encode(comment))
	local ret = xdb.create_return_object('ticket_comments',comment)
	return utils.json_encode(ret)
end)

post('/hb', function(params)
	tids = env:getHeader("tids")
	tid_t = utils.json_decode(tids)
	local tid = ''
	for i, v in pairs(tid_t) do
		if(tid == '') then
			tid = tid .. v
		else
			tid = tid .. ',' .. v
			--加个事务？
			--n, check = xdb.find_by_sql("select * from tickets where id in(" .. tid .. ")")
			--检查check内，当前一个与上一个比较，如果电话、用户相同，则执行delete
			xdb.delete("tickets", v);
			--事务结束
		end
	end
	for i, v in pairs(check) do
		freeswitch.consoleLog("ERR",utils.json_encode(v.cid_number))
	end
	
	sql = "update ticket_comments set ticket_id = " .. tid_t[1] .. " where ticket_id in(" .. tid .. ")";
	n, ret = xdb.find_by_sql(sql)
	if (n > 0) then
		return '{"res":"ok"}'
	else
		return '{}'
	end
end)

put('/:id/close',function(params)
	local pid = params.id
	ret = xdb.update_by_cond("tickets", { id = pid }, { status = 'TICKET_ST_DONE' })
	if ret == 1 then
		return 200, "{}"
	else
		return 500
	end
end)

put('/:id/assign/:dest_id',function(params)
	local pid = params.id
	ret = xdb.update_by_cond("tickets", { id = pid }, { current_user_id = params.dest_id })
	if ret == 1 then
		return 200
	else
		return 500
	end
end)

post('/:id/comments', function(params)
	utils.xlog(__FILE__() .. ':' .. __LINE__(), "INFO", serialize(params))

	ticket = {}
	ticket.id = params.id
	ticket.current_user_id = params.request.current_user_id
	if ticket.current_user_id then
		xdb.update("tickets", ticket)
	end

	local user = xdb.find("users", xtra.session.user_id)
	local weuser = xdb.find_one("wechat_users", {
		user_id = xtra.session.user_id
	})

	utils.xlog(__FILE__() .. ':' .. __LINE__(), "INFO", serialize(xtra.session))
	utils.xlog(__FILE__() .. ':' .. __LINE__(), "INFO", serialize(user))
	utils.xlog(__FILE__() .. ':' .. __LINE__(), "INFO", serialize(weuser))

	local comment = {}
	comment.ticket_id = params.id
	comment.user_id = xtra.session.user_id
	comment.content = params.request.content
	comment.user_name = user.name

	if weuser then
		comment.avatar_url = weuser.headimgurl
	end

	ret = xdb.create_return_object("ticket_comments", comment)

	ticket = xdb.find("tickets", params.id)
	utils.xlog(__FILE__() .. ':' .. __LINE__(), "INFO", serialize(ticket))

	realm = "xyt" -- fixme hardcoded

	if ticket and ticket.current_user_id then
		-- todo, send to all users subscribed to this ticket ?

		local weuser = xdb.find_one("wechat_users", {
			user_id = ticket.current_user_id
		})

		if weuser then
			local wechat = m_dict.get_obj('WECHAT/' .. realm)
			-- token = xwechat.access_token('realm')
			token = xwechat.get_token(realm, wechat.APPID, wechat.APPSEC)
			freeswitch.consoleLog("ERR", xwechat.access_token(realm))

			redirect_uri = config.wechat_base_url .. "/api/wechat/" .. realm .. "/tickets/" .. params.id
			redirect_uri = xwechat.redirect_uri(wechat.APPID, redirect_uri, "200")

			xwechat.send_ticket_notification(realm, weuser.openid, redirect_uri, ticket.subject, params.request.content)
		end
	end

	if ret then
		return ret
	else
		return 500, "{}"
	end
end)

delete('/:id', function(params)
	ret = xdb.delete("tickets", params.id);
	xdb.delete("ticket_log", {tid = params.id});
	if ret == 1 then
		return 200, "{}"
	else
		return 500, "{}"
	end
end)

post('/', function(params)
	print(serialize(params))

	params.request.status = 'TICKET_ST_NEW'
	ret = xdb.create_return_id('tickets', params.request)

	if ret then
		return {id = ret}
	else
		return 500, "{}"
	end
end)

put('/:id', function(params)
	print(serialize(params))
	ret = xdb.update("tickets", params.request)
	if ret then
		return 200, "{}"
	else
		return 500
	end
end)
