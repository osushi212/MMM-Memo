Module.register("MMM-Memo", {
    defaults: {
        memofile: "modules/MMM-Memo/memo.txt",
        width: "200px",
        refreshInterval: 15000 // reload every 15sec
    },

    start: function() {
        this.memoText = [];
        this.sendSocketNotification("CONFIG", this.config);
        this.updateMemo();

        setInterval(() => this.updateMemo(), this.config.refreshInterval);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "MEMO_UPDATE") {
            // if no changes, no update
            if (JSON.stringify(this.memoText) !== JSON.stringify(payload)) {
                this.memoText = payload;
                this.updateDom(0); // update now
            }
        }
    },

    updateMemo: function() {
        this.sendSocketNotification("READ_MEMO");
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "MMM-Memo-wrapper";

        this.memoText.forEach((memo) => {
            const memoDiv = document.createElement("div");
            memoDiv.className = "MMM-Memo-note";
            memoDiv.style.width = this.config.width;
            memoDiv.style.backgroundColor = memo.bgColor || this.randomColor();
            memoDiv.style.color = memo.textColor || "#000000";
            memoDiv.style.transform = `rotate(${memo.angle || this.randomAngle()}deg)`;
            memoDiv.style.padding = "10px";
            memoDiv.style.margin = "5px";
            memoDiv.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.3)";
            memoDiv.style.borderRadius = "8px";
            memoDiv.style.whiteSpace = "pre-wrap";
            memoDiv.style.fontFamily = "Arial, sans-serif";
            memoDiv.style.fontSize = "14px";

            if (memo.title) {
                const header = document.createElement("div");
                header.className = "MMM-Memo-header";
                header.innerText = memo.title;
                header.style.fontWeight = "bold";
                header.style.marginBottom = "5px";
                memoDiv.appendChild(header);
            }

            const content = document.createElement("div");
            content.className = "MMM-Memo-content";
            content.innerText = memo.text;
            memoDiv.appendChild(content);

            wrapper.appendChild(memoDiv);
        });

        return wrapper;
    },

    randomColor: function() {
        const colors = ["#fff9a7","#fffae0","#ffd1d1","#d1ffd1","#d1e0ff"];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    randomAngle: function() {
        return Math.floor(Math.random() * 10 - 5); // -5～+5deg
    }
});
