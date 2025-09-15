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

        // remove the memo (GET)
        app.get("/Removememo", (req, res) => {
            const title = req.query.title || "";
            const text = req.query.text || "";

            if (!title) {
                res.send({ success: false, error: "no title" });
                return;
            }

            let removed = false;

            if (text) {
                // Delete text(1line) by matching the beginning
                this.memoData.forEach(m => {
                    if (m.title === title) {
                        const before = m.text.split("\n");
                        const after = before.filter(line => !line.startsWith(text));
                        if (before.length !== after.length) {
                            m.text = after.join("\n");
                            removed = true;
                        }
                    }
                });

                // remove empty memo
                this.memoData = this.memoData.filter(m => m.text.trim() !== "");

            } else {
                // If text is empty, delete all notes that match title
                const beforeLength = this.memoData.length;
                this.memoData = this.memoData.filter(m => m.title !== title);
                removed = this.memoData.length !== beforeLength;
            }

            if (!removed) {
                res.send({ success: false, error: "The target note cannot be found" });
                return;
            }

            try {
                // save back to file
                const lines = this.memoData.map(m => JSON.stringify(m));
                fs.writeFileSync(this.config.memofile, lines.join("\n") + "\n");
                this.sendSocketNotification("MEMO_UPDATE", this.memoData);
                res.send({ success: true, removed: { title, text: text || "ALL" } });
            } catch(e) {
                console.error("MMM-Memo remove error:", e);
                res.send({ success: false, error: "File write error" });
            }
        });

        this.httpServer = app.listen(port, () => {
            console.log("MMM-Memo HTTP server running on port", port);
        });
    },

    appendMemo: function(newMemo) {
        // write on same titile
        let found = false;
        this.memoData.forEach(m => {
            if (m.title === newMemo.title) {
                m.text += "\n" + newMemo.text;
                found = true;
            }
        });

        if (!found) this.memoData.push(newMemo);

        try {
            // Write file (rewrite the whole thing)
            const lines = this.memoData.map(m => JSON.stringify(m));
            fs.writeFileSync(this.config.memofile, lines.join("\n") + "\n");
            this.sendSocketNotification("MEMO_UPDATE", this.memoData);
        } catch(e) {
            console.error("MMM-Memo append error:", e);
        }
    }
});

