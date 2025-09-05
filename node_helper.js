/* node_helper.js */
const NodeHelper = require("node_helper");
const express = require("express");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
  start: function() {
    this.memos = [];
    this.httpServer = null;
  },

  socketNotificationReceived: function(notification, payload) {
    if(notification === "MMM-MEMO-INIT") {
      this.memofile = payload;
      this.loadMemos();
      this.setupHTTP();
    }
  },

  loadMemos: function() {
    if(fs.existsSync(this.memofile)) {
      const data = fs.readFileSync(this.memofile, "utf8");
      this.memos = data.split("\n").filter(Boolean).map(line => {
        try { return JSON.parse(line); } catch { return {title:"無題", content:line}; }
      });
    }
  },

  setupHTTP: function() {
    if(this.httpServer) return; // すでに起動済み
    const app = express();
    app.use(express.json());

    // HTTPでメモを追加
    app.post("/add", (req,res)=>{
      const {title, content, color, angle, fontColor} = req.body;
      if(!content) return res.status(400).send("content is required");

      this.sendSocketNotification("MMM-MEMO-UPDATE", {title, content, color, angle, fontColor});
      // ファイルにも追記
      const line = JSON.stringify({title:title||"無題", content, color, angle, fontColor});
      fs.appendFileSync(this.memofile, line+"\n");

      res.send("ok");
    });

    this.httpServer = app.listen(8081, ()=>console.log("MMM-Memo HTTP server running on port 8081"));
  }
});
