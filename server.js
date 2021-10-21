"use strict";
exports.__esModule = true;
var express_1 = require("express");
var db_js_1 = require("./config/db.js");
var security_routes_js_1 = require("./routes/security.routes.js");
var profile_routes_js_1 = require("./routes/profile.routes.js");
var article_routes_js_1 = require("./routes/article.routes.js");
var comment_routes_js_1 = require("./routes/comment.routes.js");
var category_routes_js_1 = require("./routes/category.routes.js");
var app = (0, express_1["default"])();
// Connect database
(0, db_js_1["default"])();
// Init Middleware
app.use(express_1["default"].json({ extended: false }));
app.get("/", function (req, res) { return res.json({ message: "API Running" }); });
// Define routes
app.use("/api/security", security_routes_js_1["default"]);
app.use("/api/profile", profile_routes_js_1["default"]);
app.use("/api/article", article_routes_js_1["default"]);
app.use("/api/comment", comment_routes_js_1["default"]);
app.use("/api/category", category_routes_js_1["default"]);
var PORT = process.env.PORT || 5000;
app.listen(PORT, function () { return console.log("Server started on port " + PORT); });
