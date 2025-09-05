/* node_helper.js */
const NodeHelper = require("node_helper");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");

module.exports = NodeHelper.create({
    start: function () {
        console.log("MMM-Memo helper started");
        this.memosFile = this.config?.memofile || "modules/MMM-Memo/memo.txt";
        this.setupHTTP();
    },

    setupHTTP: function () {
        const app = express();
        app.use(bodyParser.urlencoded({ extended: true }));

        // LAN公開
        const port = 8081;
        this.httpServer = app.listen(port, "0.0.0.0", () => {
            console.log(`MMM-Memo HTTP server running on port ${port}`);
        });

        // GET / POST 両対応でメモ追加
        const addHandler = (req, res) => {
            let { title, text, color, angle, fontColor } = req.method === "POST" ? req.body : req.query;

            if (!text) return res.status(400).send("text は必須です");

            // タイトルがない場合 → 新規付箋
            if (!title) {
                title = `メモ_${Date.now()}`;
                color = color || this.getRandomColor();
                angle = angle ? parseInt(angle) : this.getRandomAngle();
                fontColor = fontColor || "#000000";
            } else {
                color = color || "#fffa65";
                angle = angle ? parseInt(angle) : 0;
                fontColor = fontColor || "#000000";
            }

            // クライアントに通知
            this.sendSocketNotification("ADD_MEMO", { title, text, color, angle, fontColor });

            // ファイル追記
            const line = `${title}|${text}|${color}|${angle}|${fontColor}\n`;
            fs.appendFile(this.memosFile, line, err => {
                if (err) console.error(err);
            });

            res.send(`メモ "${title}" を追加しました`);
        };

        app.get("/add", addHandler);
        app.post("/add", addHandler);
    },

    getRandomColor: function () {
        const colors = ["#fffa65", "#ffd966", "#ffe599", "#c9daf8", "#d9ead3"];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    getRandomAngle: function () {
        return Math.floor(Math.random() * 21) - 10; // -10〜+10度
    }
});
