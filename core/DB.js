/*var mongoose = require('mongoose'),
	uuid = require('node-uuid');
	
mongoose.connect('mongodb://localhost/canvasengine', function(err) {
  if (err) { throw err; }
});

var dataShema = new  mongoose.Schema({
  username : { type: String, required: true, index: { unique: true } },
  password : { type: String, required: true },
  group: { type: String, required: true, default: "user" },
  salt: { type: String, required: true, default: uuid.v1 },
  data : { type : String, default : "{}" }
});

var UserDB = mongoose.model('user', dataShema);

exports.Class = {
	user: UserDB
};*/

exports.Class = {
	user: {}
};