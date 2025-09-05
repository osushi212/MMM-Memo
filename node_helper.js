const NodeHelper = require("node_helper");
const fs = require("fs");
const express = require("express");

module.exports = NodeHelper.create({
    start: function() {
        this.memoData = [];
        this.config = {};
        this.expressApp = express();
        this.expressApp.use(express.json());
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.readMemoFile();
            this.setupHTTP();
        } else if (notification === "READ_MEMO") {
            this.readMemoFile();
        }
    },

    readMemoFile: function() {
        try {
            if (!fs.existsSync(this.config.memofile)) fs.writeFileSync(this.config.memofile, "");
            const data = fs.readFileSync(this.config.memofile, "utf-8");
            const lines = data.split("\n").filter(l => l.trim() !== "");
            this.memoData = lines.map(line => {
                try { return JSON.parse(line); } 
                catch(e) { return { title:"", text:line, bgColor:"#fff9a7", textColor:"#000", angle:0 }; }
            });
            this.sendSocketNotification("MEMO_UPDATE", this.memoData);
        } catch(e) {
            console.error("MMM-Memo read error:", e);
        }
    },

    setupHTTP: function() {
        const port = 8081;
        const app = this.expressApp;

        app.get("/memo", (req, res) => {
            const memo = {
                title: req.query.title || "",
                text: req.query.text || "",
                bgColor: req.query.bgColor,
                textColor: req.query.textColor,
                angle: req.query.angle ? parseInt(req.query.angle) : undefined
            };
            if (memo.text) this.appendMemo(memo);
            res.send({ success: !!memo.text, memo });
        });

        app.post("/memo", (req, res) => {
            const memo = req.body;
            if (memo && memo.text) this.appendMemo(memo);
            res.send({ success: !!(memo && memo.text), memo });
        });

        this.httpServer = app.listen(port, () => {
            console.log("MMM-Memo HTTP server running on port", port);
        });
    },

    appendMemo: function(newMemo) {
        // 同じタイトルがあれば追記
        let found = false;
        this.memoData.forEach(m => {
            if (m.title === newMemo.title) {
                m.text += "\n" + newMemo.text;
                found = true;
            }
        });

        if (!found) this.memoData.push(newMemo);

        try {
            // ファイル書き込み（全体を書き直す）
            const lines = this.memoData.map(m => JSON.stringify(m));
            fs.writeFileSync(this.config.memofile, lines.join("\n") + "\n");
            this.sendSocketNotification("MEMO_UPDATE", this.memoData);
        } catch(e) {
            console.error("MMM-Memo append error:", e);
        }
    }
});
