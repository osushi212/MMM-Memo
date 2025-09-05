/* node_helper.js */
const NodeHelper = require("node_helper");
const fs = require("fs");
const express = require("express");

module.exports = NodeHelper.create({
    start: function() {
        this.memoText = [];
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
            if (!fs.existsSync(this.config.memofile)) {
                fs.writeFileSync(this.config.memofile, "");
            }
            const data = fs.readFileSync(this.config.memofile, "utf-8");
            this.memoText = data.split("\n").filter(line => line.trim() !== "").map(line => {
                try {
                    return JSON.parse(line);
                } catch(e) {
                    return { text: line, title: "", bgColor: "#fff9a7", textColor: "#000000", angle: 0 };
                }
            });
            this.sendSocketNotification("MEMO_UPDATE", this.memoText);
        } catch (e) {
            console.error("MMM-Memo read error:", e);
        }
    },

    setupHTTP: function() {
        const port = 8081;
        const app = this.expressApp;

        // GET /memo?text=メモ内容&title=&bgColor=&textColor=&angle=
        app.get("/memo", (req, res) => {
            const memo = {
                text: req.query.text || "",
                title: req.query.title || "",
                bgColor: req.query.bgColor || undefined,
                textColor: req.query.textColor || undefined,
                angle: req.query.angle ? parseInt(req.query.angle) : undefined
            };
            if (memo.text) this.appendMemo(memo);
            res.send({ success: !!memo.text, memo });
        });

        // POST /memo { "text":"", "title":"", "bgColor":"", "textColor":"", "angle":3 }
        app.post("/memo", (req, res) => {
            const memo = req.body;
            if (memo && memo.text) this.appendMemo(memo);
            res.send({ success: !!(memo && memo.text), memo });
        });

        this.httpServer = app.listen(port, () => {
            console.log("MMM-Memo HTTP server running on port", port);
        });
    },

    appendMemo: function(memo) {
        try {
            fs.appendFileSync(this.config.memofile, JSON.stringify(memo) + "\n");
            this.readMemoFile();
        } catch (e) {
            console.error("MMM-Memo append error:", e);
        }
    }
});
