/* MMM-Memo.js */
Module.register("MMM-Memo", {
    defaults: {
        memofile: "modules/MMM-Memo/memo.txt",
        defaultColor: "#fffa65",
        defaultAngle: 0,
        defaultFontColor: "#000000"
    },

    start: function () {
        this.memos = {}; // タイトルをキーにしたメモ格納
        this.loadMemos();
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = "mmm-memo-wrapper";

        for (const [title, memoData] of Object.entries(this.memos)) {
            const postIt = document.createElement("div");
            postIt.className = "mmm-memo-postit";
            postIt.style.backgroundColor = memoData.color;
            postIt.style.color = memoData.fontColor;
            postIt.style.transform = `rotate(${memoData.angle}deg)`;

            const header = document.createElement("div");
            header.className = "mmm-memo-header";
            header.innerText = title;
            postIt.appendChild(header);

            const content = document.createElement("div");
            content.className = "mmm-memo-content";
            content.innerHTML = memoData.texts.map(t => `<div>${t}</div>`).join("");
            postIt.appendChild(content);

            wrapper.appendChild(postIt);
        }

        return wrapper;
    },

    loadMemos: function () {
        const self = this;
        fetch(this.config.memofile)
            .then(resp => resp.text())
            .then(data => {
                data.split("\n").forEach(line => {
                    if (!line) return;
                    const [title, text, color, angle, fontColor] = line.split("|");
                    self.addMemo(title, text, color, parseInt(angle), fontColor, false);
                });
                self.updateDom();
            });
    },

    addMemo: function (title, text, color, angle, fontColor, save = true) {
        if (!this.memos[title]) {
            this.memos[title] = {
                texts: [],
                color: color,
                angle: angle,
                fontColor: fontColor
            };
        }
        this.memos[title].texts.push(text);
        this.updateDom();

        if (save) this.saveMemo(title, text, color, angle, fontColor);
    },

    saveMemo: function (title, text, color, angle, fontColor) {
        // 追記
        fetch(this.config.memofile, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}&color=${encodeURIComponent(color)}&angle=${angle}&fontColor=${encodeURIComponent(fontColor)}`
        }).catch(err => console.error(err));
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "ADD_MEMO") {
            this.addMemo(payload.title, payload.text, payload.color, payload.angle, payload.fontColor);
        }
    }
});
