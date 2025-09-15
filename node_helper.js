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

        // add the memo (GET)
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

        // add the memo (POST)
        app.post("/memo", (req, res) => {
            const memo = req.body;
            if (memo && memo.text) this.appendMemo(memo);
            res.send({ success: !!(memo && memo.text), memo });
        });

        // delete the memo (GET)
        app.get("/Removememo", (req, res) => {
            const title = req.query.title || "";
            const text = req.query.text || "";

            if (!text) {
                res.send({ success: false, error: "text が必要です" });
                return;
            }

            let removed = false;
            this.memoData.forEach((m, idx) => {
                if (m.title === title) {
                    // text を改行で分割して、指定されたものを除外
                    const lines = m.text.split("\n").filter(line => line.trim() !== text);
                    if (lines.length !== m.text.split("\n").length) {
                        removed = true;
                        m.text = lines.join("\n");
                    }
                }
            });

            // delete empty memo
            this.memoData = this.memoData.filter(m => m.text.trim() !== "");

            if (!removed) {
                res.send({ success: false, error: "not found the memo" });
                return;
            }

            try {
                // save the file
                const lines = this.memoData.map(m => JSON.stringify(m));
                fs.writeFileSync(this.config.memofile, lines.join("\n") + "\n");
                this.sendSocketNotification("MEMO_UPDATE", this.memoData);
                res.send({ success: true, removed: { title, text } });
            } catch(e) {
                console.error("MMM-Memo remove error:", e);
                res.send({ success: false, error: "error writing file" });
            }
        });

        this.httpServer = app.listen(port, () => {
            console.log("MMM-Memo HTTP server running on port", port);
        });
    },

    appendMemo: function(newMemo) {
        // add the memo on same title
        let found = false;
        this.memoData.forEach(m => {
            if (m.title === newMemo.title) {
                m.text += "\n" + newMemo.text;
                found = true;
            }
        });

        if (!found) this.memoData.push(newMemo);

        try {
            // write to the memo.txt
            const lines = this.memoData.map(m => JSON.stringify(m));
            fs.writeFileSync(this.config.memofile, lines.join("\n") + "\n");
            this.sendSocketNotification("MEMO_UPDATE", this.memoData);
        } catch(e) {
            console.error("MMM-Memo append error:", e);
        }
    }
});
