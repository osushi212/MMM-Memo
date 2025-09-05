const NodeHelper = require("node_helper");
const fs = require("fs");
const express = require("express");

module.exports = NodeHelper.create({
    start: function() {
        console.log("MMM-Memo helper started");

        this.memoPath = null; // ファイルパス保存

        this.app = express();
        this.app.use(express.json());

        // POST /memo でメモ更新
        this.app.post("/memo", (req, res) => {
            const newText = req.body.text;
            if (!newText) return res.status(400).send("text missing");
            this._appendMemo(newText, res);
        });

        // GET /memo?text=任意の文字列 でも更新可能
        this.app.get("/memo", (req, res) => {
            const newText = req.query.text;
            if (!newText) return res.status(400).send("text missing");
            this._appendMemo(newText, res);
        });

        this.server = this.app.listen(8081, () => {
            console.log("MMM-Memo HTTP server running on port 8081");
        });
    },

    _appendMemo: function(newText, res) {
        if (!this.memoPath) {
            console.error("MMM-Memo: memofile path is not set");
            return res.status(500).send("memofile path not set");
        }

        try {
            // 既存メモを取得
            let oldText = "";
            if (fs.existsSync(this.memoPath)) {
                oldText = fs.readFileSync(this.memoPath, "utf8");
            }

            // 改行付きで追記
            const updatedText = oldText ? oldText + "\n" + newText : newText;

            fs.writeFileSync(this.memoPath, updatedText, "utf8");

            // 即座に画面に反映
            this.sendSocketNotification("MEMO_TEXT", updatedText);

            res.send("OK");
        } catch (err) {
            console.error("MMM-Memo write error:", err);
            res.status(500).send("write error");
        }
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_MEMO") {
            this.memoPath = payload.path;
            try {
                const text = fs.readFileSync(payload.path, "utf8");
                this.sendSocketNotification("MEMO_TEXT", text);
            } catch (err) {
                console.error("MMM-Memo read error:", err);
                this.sendSocketNotification("MEMO_TEXT", "メモ読み込みエラー");
            }
        }
    }
});
