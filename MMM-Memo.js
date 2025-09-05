/* MMM-Memo.js */
Module.register("MMM-Memo", {
  defaults: {
    memofile: "modules/MMM-Memo/memo.txt",
    postitColors: ["#FFF79A", "#FFB6C1", "#CCFF99", "#ADD8E6"],
    rotateRange: 10, // ±10度
    fontColor: "#000000"
  },

  start: function() {
    this.memos = [];
    this.loadMemos();
    this.sendSocketNotification("MMM-MEMO-INIT", this.config.memofile);
  },

  getStyles: function() {
    return ["MMM-Memo.css"];
  },

  loadMemos: function() {
    const fs = require("fs");
    if(fs.existsSync(this.config.memofile)) {
      const data = fs.readFileSync(this.config.memofile, "utf8");
      this.memos = data.split("\n").filter(Boolean).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return {title: "無題", content: line, color: this.randomColor(), angle: this.randomAngle()};
        }
      });
    }
  },

  randomColor: function() {
    return this.config.postitColors[Math.floor(Math.random()*this.config.postitColors.length)];
  },

  randomAngle: function() {
    return Math.floor(Math.random()*(this.config.rotateRange*2+1)) - this.config.rotateRange;
  },

  socketNotificationReceived: function(notification, payload) {
    if(notification === "MMM-MEMO-UPDATE") {
      let updated = false;
      if(payload.title) {
        for(let memo of this.memos) {
          if(memo.title === payload.title) {
            memo.content.push(payload.content);
            updated = true;
            break;
          }
        }
      }
      if(!updated) {
        this.memos.push({
          title: payload.title || "無題",
          content: [payload.content],
          color: payload.color || this.randomColor(),
          angle: payload.angle !== undefined ? payload.angle : this.randomAngle(),
          fontColor: payload.fontColor || this.config.fontColor
        });
      }
      this.updateDom();
    }
  },

  getDom: function() {
    const wrapper = document.createElement("div");
    wrapper.className = "mmm-memo-wrapper";

    for(let memo of this.memos) {
      const postIt = document.createElement("div");
      postIt.className = "mmm-memo-postit";
      postIt.style.backgroundColor = memo.color;
      postIt.style.color = memo.fontColor;
      postIt.style.transform = `rotate(${memo.angle}deg)`;

      const header = document.createElement("div");
      header.className = "mmm-memo-header";
      header.innerText = memo.title;

      const contentDiv = document.createElement("div");
      contentDiv.className = "mmm-memo-content";
      memo.content.forEach(line => {
        const p = document.createElement("div");
        p.innerText = line;
        contentDiv.appendChild(p);
      });

      postIt.appendChild(header);
      postIt.appendChild(contentDiv);
      wrapper.appendChild(postIt);
    }

    return wrapper;
  }
});
