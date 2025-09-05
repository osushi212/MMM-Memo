Module.register("MMM-Memo", {
    defaults: {
        memofile: "/home/yasushi/MagicMirror/modules/MMM-Memo/memo.txt"
    },

    start: function() {
        this.memoText = "";
        console.log("MMM-Memo started");

        // NodeHelper に読み込み依頼
        this.sendSocketNotification("GET_MEMO", { path: this.config.memofile });

        // 定期更新（5秒ごと）
        this.updateInterval = setInterval(() => {
            this.sendSocketNotification("GET_MEMO", { path: this.config.memofile });
        }, 5000);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "MEMO_TEXT") {
            this.memoText = payload;
            this.updateDom();
        }
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = this.memoText.replace(/\n/g, "<br>");
        return wrapper;
    },

    suspend: function() {
        clearInterval(this.updateInterval);
    }
});
