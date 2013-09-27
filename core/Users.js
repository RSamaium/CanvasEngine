var crypto = require('crypto');

exports.Class = function(Class, CE, DB) {

	var UserDB = DB.user;

	var Users, Groups;

	function hash(password, salt) {
		return crypto.createHmac('sha256', salt).update(password).digest('hex');
	}
	
	Class.create("Group", {
	
		name: "",
		users: {},
		
		initialize: function(name) {
			this.name = name;
		},
		
		userExist: function(id) {
			if (id instanceof Class) {
				id = id.id;
			}
			return this.users[id];
		},
		
		addUser: function(user) {
			if (!this.userExist(user)) {
				this.users[user.id] = user;	
				user.socket.join('group_' + this.name);
			}
		},
		
		removeUser: function(user) {
			delete this.users[user.id];
			user.socket.leave('group_' + this.name);
		},
		
		emit: function(event_name, data) {
			CE.io.sockets.in('group_' + this.name).emit(event_name, data);
		}
		
	});

	Class.create("User", {
	
		id: 0,
		socket: null,
		model: null,
		data: {},
		
		initialize: function(socket) {
			var self = this;
			this.id = CE.uniqid();
			this.socket = socket;
			this.socket.on('_authentication', function(params) {
				self.authenticate(params.username, params.password);
			});		
			this.socket.on('_register', function(params) {
				self.register(params.username, params.password, params.data);
			});	

			Groups.get("anonymous").addUser(this);
		},
	
		authenticate: function(username, password) {
			var self = this;
			UserDB.findOne({ username: username }, function(err, user) {
				 var ret = "";
				 
				 if (user) {
					if (user.password == hash(password, user.salt)) {
						Groups.get("anonymous").removeUser(self);
						self.id = user._id;
						Groups.get(user.group).addUser(self);
						ret = "success";
						self.model = user;
						if (Users._Model.authentication) Users._Model.authentication.call(Users._Model, self);
					}
					else {
						ret = "failed";
						err = {msg: "Wrong password"}
					}
				 }
				 else {
					ret = "failed";
				 }
				 
				 self.socket.emit('_authentication', {ret: ret, err: err});
			});
			
		},
		
		register: function(username, password, data) {
			var self = this;
			data = data || {};
			
			function createUserDB() {
				var ret = "",
					user = new UserDB({
						username: username,
						data: data
					});
				user.password = hash(password, user.salt),
				user.save(function (err) {
					if (!err) {
						ret = "success";
					}
					else {
						ret = "failed";
					}
					self.socket.emit('_register', {ret: ret, err: err});
				});
				self.model = user;
			}
		
			UserDB.findOne({ username: username }, function(err, user) {
				 if (!user) {
					createUserDB();
				 }
				 else {
					 self.socket.emit('_register', {ret: "Username exist", err: err});
				 }
			});
			
		},
		
		getGroups: function() {
			var groups = Groups.get(),
				ret = [];
			for (var id in groups) {
				if (groups[id].userExist(this)) {
					ret.push(groups[id]);
				}
			}
			return ret;
		}
	
	});
	
	Groups = {
	
		_list: [],
		
		init: function() {
		
			var groups = {
				"anonymous": {},
				"user": {},
				"admin": {}
			};
			
			for (var name in groups) {
				this._list[name] = Class.new("Group", [name, groups[name]]);
			}
		},
	
		get: function(group_id) {
			if (!group_id) {
				return this._list;
			}
			return this._list[group_id];
		}
	};

	Users = {
	
		_list: [],
		_Model: null,
	
		get: function() {
			return this._list;
		},
		
		add: function(socket) {
			var user = Class.new("User", [socket]);
			this._list.push(user);
			return user;
		}
		
		
	
	};
	
	Groups.init();

	return Users;
}