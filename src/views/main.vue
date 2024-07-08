<template>
  <div id="main">
    <el-table :data="tableData" style="width: 100%" :border="true">
      <!-- 已创建的 -->
      <!-- 地图名 -->
      <el-table-column prop="mapName" label="地图名">
        <template slot-scope="scope">
          <el-button
            @click="editMapName(scope.row.id)"
            v-if="scope.row.mapName"
            >{{ scope.row.mapName }}</el-button
          >
          <!-- 默认 -->
          <el-input
            v-if="!scope.row.mapName"
            v-model="inputMapName"
            placeholder="请输入地图名"
          ></el-input>
        </template>
      </el-table-column>
      <!-- 怪物名 -->
      <el-table-column prop="name" label="怪物名">
        <template slot-scope="scope">
          <el-button
            class="btn-danger"
            @click="editBoss(scope.row.id)"
            v-if="scope.row.mapName"
            type="danger"
            >{{ scope.row.bossName }}</el-button
          >
          <!-- 默认 -->
          <el-input
            v-if="!scope.row.mapName"
            v-model="inputBossName"
            placeholder="请输入怪物名"
          ></el-input>
        </template>
      </el-table-column>
      <!-- 剩余时间 -->
      <el-table-column prop="remainTime" label="剩余时间">
        <template slot-scope="scope">
          <el-button
            :type="
              scope.row.remainTime === '已刷新'
                ? 'success'
                : scope.row.remainTime === '已停止'
                ? 'info'
                : ''
            "
            @click="editRemainTime(scope.row.id)"
            v-if="scope.row.mapName"
            >{{
              typeof scope.row.remainTime === "string"
                ? scope.row.remainTime
                : formatSeconds(scope.row.remainTime)
            }}</el-button
          >
        </template>
      </el-table-column>
      <!-- 操作 -->
      <el-table-column prop="edit" label="操作">
        <template slot-scope="scope">
          <el-button
            @click="dieClick(scope.row.id)"
            v-if="scope.row.mapName"
            type="primary"
            plain
            >死</el-button
          >
          <el-button
            @click="stopClick(scope.row.id)"
            v-if="scope.row.mapName"
            type="primary"
            plain
            >停</el-button
          >
          <!-- 默认 -->
          <el-button
            @click="addTask"
            v-if="!scope.row.mapName"
            type="primary"
            plain
            >创建</el-button
          >
        </template>
      </el-table-column>
      <!-- 死亡时间 -->
      <el-table-column prop="dieTime" label="死亡时间">
        <template slot-scope="scope">
          <el-button
            @click="editDieTime(scope.row.id)"
            v-if="scope.row.mapName"
            type="primary"
            plain
            >{{
              formatTime(new Date(scope.row.dieTime), "{h}:{i}:{s}")
            }}</el-button
          >
        </template>
      </el-table-column>
      <!-- 预计刷新时间 -->
      <el-table-column prop="preNewTime" label="预计刷新时间">
        <template slot-scope="scope">
          <el-button v-if="scope.row.mapName" type="success" plain>{{
            scope.row.preNewTime === "无"
              ? "无"
              : formatTime(new Date(scope.row.preNewTime), "{h}:{i}:{s}")
          }}</el-button>
        </template>
      </el-table-column>
      <!-- 刷新间隔 -->
      <el-table-column prop="newTime" label="刷新间隔">
        <template slot-scope="scope">
          <el-button
            @click="newTimeClick(scope.row.newTime, scope.row.id)"
            v-if="scope.row.mapName"
            plain
            >{{
              typeof scope.row.newTime === "string"
                ? scope.row.newTime
                : formatSeconds(scope.row.newTime)
            }}</el-button
          >
          <el-input
            v-if="!scope.row.mapName"
            v-model="inputNewTime"
            placeholder="请输入刷新间隔（单位：秒）"
            type="number"
          ></el-input>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import Worker from "worker-loader!../assets/js/worker.js";
import { formatSeconds, formatTime } from "@/assets/util/index";
export default {
  data() {
    return {
      tableData: [{}],
      normalTableData: [{}],
      inputMapName: "",
      inputBossName: "",
      inputNewTime: 3600,
      formatSeconds,
      formatTime,
      lastTime: null,
      titleFlickerTimer: {},
      pageIsShow: true,
      timerWorker: null,
    };
  },
  watch: {
    tableData: {
      deep: true, // 是否开启深度监听
      immediate: false,
      handler: function (value) {
        // 每当发生变化，就存储到本地
        localStorage.setItem("tableData", JSON.stringify(this.tableData));
        // 并且还要时刻记录当前页面的时间戳
        localStorage.setItem("lastTime", JSON.stringify(Date.now()));
      },
    },
  },
  methods: {
    handleVisibilityChange() {
      // 页面可见性发生变化时触发
      if (document.visibilityState === "visible") {
        this.pageIsShow = true;
        // 页面变为可见状态，取消修改页面标题的定时器
        clearInterval(this.titleFlickerTimer);
        // 恢复原始页面标题
        document.title = "倒计时";
      } else {
        this.pageIsShow = false;
      }
    },
    // 创建
    addTask() {
      if (!this.inputMapName) {
        return this.$message.error("地图名不能为空！");
      }
      if (!this.inputBossName) {
        return this.$message.error("怪物名不能为空！");
      }
      if (this.inputNewTime < 0) {
        return this.$message.error("刷新间隔不能为负数！");
      }
      if (this.inputNewTime > 360999) {
        return this.$message.error("刷新间隔不能大于360999秒！");
      }
      var id = Date.now();
      this.tableData.unshift({
        id,
        mapName: this.inputMapName,
        bossName: this.inputBossName,
        remainTime: +Math.round(this.inputNewTime),
        newTime: +Math.round(this.inputNewTime),
        preNewTime: Date.now() + Math.round(this.inputNewTime) * 1000,
        dieTime: Date.now(),
      });
      this.$message({
        message: "创建成功！",
        type: "success",
      });
      this.startCountdown(+this.inputNewTime, id, "remainTime");
      setTimeout(() => {
        document.activeElement.blur();
      }, 10);
    },
    newTimeClick(oldNewTime, id) {
      this.$prompt("BOSS多久刷新一次(分)?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValidator: (value) => {
          if (value < 0) {
            this.$message.error("刷新间隔不能为负数！");
            return false;
          }
          if (value > 6016) {
            this.$message.error("刷新间隔不能大于6016分钟！");
            return false;
          }
          return true;
        },
      })
        .then(({ value }) => {
          this.$message({
            type: "success",
            message: "修改成功！",
          });
          this.tableData[this.idFindIndex(id)].newTime = Math.round(
            +value * 60
          );
        })
        .catch(() => {});
    },
    // 闪烁页面标题
    titleFlicker(title) {
      if (this.pageIsShow) return;
      // 先清除上次的定时器
      clearInterval(this.titleFlickerTimer);
      var originalTitle = title;
      var n = 0;
      // 进来先修改一次
      document.title = title;
      // 创建一个定时器，每隔200毫秒就修改标题
      this.titleFlickerTimer = setInterval(() => {
        if (n !== 3) {
          title = "." + title;
          document.title = title;
          n++;
        } else {
          // 说明已经有3个点了，清空，重新来
          title = originalTitle;
          n = 0;
        }
      }, 200);
    },
    updateCountdown(index, id, keyName) {
      var index2 = this.idFindIndex(id);
      if (index2 === null) {
        // 没找到，说明被删除了，那么清除定时器
        this.timerWorker.postMessage({action:'stop',index:index2,id,keyName})
      }
      // 每过一秒减一
      var time = this.tableData[index2][keyName] + 0;
      time--;
      // 当
      if (time > 0) {
        // 更新倒计时显示
        this.tableData[index2][keyName] = time;
      } else {
        // 倒计时结束时的处理
        this.timerWorker.postMessage({action:'stop',index:index2,id,keyName})
        this.tableData[index2][keyName] = "已刷新";
        this.upPriority(id);
        // this.titleFlicker("已刷新");
      }
    },
    // 倒计时函数
    startCountdown(time, id, keyName) {
      var index = this.idFindIndex(id);
      // 进来首先更新下剩余时间的显示
      this.tableData[index][keyName] = time;
      // 并且更一下预计刷新时间
      this.tableData[index].preNewTime =
        Date.now() + Math.round(this.tableData[index].remainTime) * 1000;
      // 然后进行排序
      this.$nextTick(() => {
        this.allSort();
      });
      // 判断是否被删除了
      if (index !== null) {
        // 将定时器存到相应的对象里面去
        // 首次进来先赋值，防止无法看到第一秒
        this.tableData[index][keyName] = time;
        // this.tableData[index].remainTimer = setInterval(()=>this.updateCountdown(index ,id, keyName), 1000);
        console.log('◀️')
        this.timerWorker.postMessage({ action: "start", index, id, keyName });
      }
    },
    // 根据id找到index
    idFindIndex(id) {
      for (var i = 0; i < this.tableData.length; i++) {
        if (this.tableData[i].id === id) {
          return i;
        }
      }
      return false;
    },
    // 清除该对象的所有定时器
    clearObjAllTimer(id) {
      // 清除剩余时间
      this.timerWorker.postMessage({action:'stop',index:this.idFindIndex(id),id})
    },
    // 修改地图名
    editMapName(id) {
      this.$prompt("BOSS刷新在哪个地图?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValidator: (value) => {
          if (!value) return false;
          return true;
        },
      })
        .then(({ value }) => {
          this.tableData[this.idFindIndex(id)].mapName = value;
          this.$message({
            type: "success",
            message: "修改成功！",
          });
        })
        .catch(() => {});
    },
    // 修改BOSS
    editBoss(id) {
      this.$confirm("你要对这个BOSS做什么?", "信息", {
        distinguishCancelAndClose: true,
        confirmButtonText: "删除BOSS",
        cancelButtonText: "修改名字",
      })
        .then((action) => {
          // 删除BOSS
          this.delObj(id);
          this.$message({
            type: "success",
            message: "删除成功!",
          });
        })
        .catch((action) => {
          console.log("🍆");
          if (action === "close" || action === "confirm") return;
          // 修改名字
          this.editBossName(id);
        });
    },
    // 修改BOSS的名字
    editBossName(id) {
      this.$prompt("告诉我BOSS的名字", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValidator: (value) => {
          if (!value) return false;
          return true;
        },
      })
        .then(({ value }) => {
          this.tableData[this.idFindIndex(id)].bossName = value;
          this.$message({
            type: "success",
            message: "修改成功！",
          });
        })
        .catch(() => {});
    },
    // 删除指定对象
    delObj(id) {
      var index = this.idFindIndex(id);
      this.clearObjAllTimer(id);
      this.tableData.splice(index, 1);
    },
    // 修改本次刷新时间
    editRemainTime(id) {
      this.$prompt("BOSS还有多久刷新(分)?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValidator: (value) => {
          if (value < 0) {
            this.$message.error("刷新间隔不能为负数！");
            return false;
          }
          if (value > 6016) {
            this.$message.error("刷新间隔不能大于6016分钟！");
            return false;
          }
          return true;
        },
      })
        .then(({ value }) => {
          this.$message({
            type: "success",
            message: "修改成功！",
          });
          // 需要先清除之前的定时器
          this.clearObjAllTimer(id);
          this.tableData[this.idFindIndex(id)].dieTime = Date.now();
          this.startCountdown(value * 60, id, "remainTime");
        })
        .catch(() => {});
    },
    // 死
    dieClick(id) {
      var index = this.idFindIndex(id);
      // 清除该对象的定时器，并且重新开始计时
      this.clearObjAllTimer(id);
      this.tableData[index].dieTime = Date.now();
      this.startCountdown(this.tableData[index].newTime, id, "remainTime");
    },
    // 停
    stopClick(id) {
      // 清除该对象的定时器，然后改为已停止
      this.clearObjAllTimer(id);
      this.tableData[this.idFindIndex(id)].remainTime = "已停止";
      this.lowerPriority(id);
    },
    // 解冻
    thaw(item, diffTime) {
      // 如果没有地图名，则说明是默认对象
      if (!item.mapName) return;
      // 如果是已刷新或已停止，同样不用解冻
      if (item.remainTime === "已刷新" || item.remainTime === "已停止") return;
      // 正常对象，需要解冻
      if (diffTime > item.remainTime) {
        // 大于解冻时间，则说明已经刷新
        item.remainTime = "已刷新";
        this.upPriority(item.id);
      } else {
        // 小于解冻时间，则说明还未刷新，需要继续倒计时
        this.startCountdown(item.remainTime - diffTime, item.id, "remainTime");
      }
    },
    // 提高优先级到第一位（针对于“已刷新”的）
    upPriority(id) {
      var index = this.idFindIndex(id);
      this.tableData[index].preNewTime = "无";
      const obj = this.tableData[index];
      this.tableData.splice(index, 1);
      this.tableData.unshift(obj);
    },
    // 降低优先级到最后一位（针对于“已停止”的）
    lowerPriority(id) {
      var index = this.idFindIndex(id);
      this.tableData[index].preNewTime = "无";
      const obj = this.tableData[index];
      this.tableData.splice(index, 1);
      this.tableData.splice(this.tableData.length - 1, 0, obj);
    },
    // 修改死亡时间
    editDieTime(id) {
      // 让用户修改死亡时间
      this.$prompt("BOSS已经死了多少(分)?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValidator: (value) => {
          if (value < 0) {
            this.$message.error("刷新间隔不能为负数！");
            return false;
          }
          if (value > 6016) {
            this.$message.error("刷新间隔不能大于6016分钟！");
            return false;
          }
          return true;
        },
      })
        .then(({ value }) => {
          var index = this.idFindIndex(id);
          // 刷新间隔 - value，如果小于等于0，则说明已经刷新
          var time = this.tableData[index].newTime - value * 60;
          // 无论是否刷新，都需要清除该对象的刷新时间定时器
          this.clearObjAllTimer(id);
          if (time <= 0) {
            // 已经刷新
            this.tableData[index].remainTime = "已刷新";
            this.upPriority(id);
          } else {
            // 还未刷新，time即是剩下的秒数，那么开启刷新时间定时器
            this.startCountdown(time, id, "remainTime");
          }
          // 获取之前的死亡时间：当前时间 - 死了多久
          var lastDieTime = Date.now() - value * 60 * 1000;
          this.tableData[index].dieTime = lastDieTime;
          this.$message({
            type: "success",
            message: "修改成功！",
          });
        })
        .catch(() => {});
    },
    // 全体成员进行排序函数：已刷新>刷新中>已停止
    allSort() {
      console.log("🚶‍♀️️");
      this.tableData.sort((a, b) => {
        if (a.remainTime === "已刷新") {
          var aa = -99999999999999;
        } else if (a.remainTime === "已停止") {
          var aa = 99999999999999;
        } else {
          var aa = a.remainTime;
        }
        if (b.remainTime === "已刷新") {
          var bb = -99999999999999;
        } else if (b.remainTime === "已停止") {
          var bb = 99999999999999;
        } else {
          var bb = b.remainTime;
        }
        console.log(aa, bb, a.remainTime, b.remainTime);
        return aa - bb;
      });
    },
    // 创建web worker主线程
    createWorker() {
      this.timerWorker = new Worker();
      // 接收来自分线程的消息
      this.timerWorker.onmessage = (e) => {
        const { action, index, id, keyName } = e.data;
        // 说明1秒走完了
        if (action === "ok") {
          this.updateCountdown(index, id, keyName);
          // 说明清除定时器成功
        } else if (action === "gg") {
          // 说明清除所有定时器成功
        } else if (action === "gg_all") {
        }
      };
    },
  },
  created() {
    this.createWorker();
    // 获取本地存储的数据
    this.tableData = localStorage.getItem("tableData")
      ? JSON.parse(localStorage.getItem("tableData"))
      : [{}];
    // 获取上次的最后时间戳
    this.lastTime = localStorage.getItem("lastTime") || null;
    // 全体成员进行排序
    this.allSort();
    if (this.lastTime) {
      // 计算出两者的时间差，然后解冻时间（更新“剩余时间”的状态）
      var diffTime = Math.round((Date.now() - this.lastTime) / 1000);
      console.log("⚫", this.tableData.length);
      for (var item of this.tableData) {
        this.thaw(item, diffTime);
      }
    } else {
      // 上次并没有存储最终时间戳，说明本地没有存储任何数据，因此什么也不需要做
    }
  },
  mounted() {
    // 监听页面的可见性变化
    // document.addEventListener("visibilitychange", this.handleVisibilityChange);
  },
  beforeDestroy() {
    // 清除web worker
    this.timerWorker.postMessage('stopAll')
  },
};
</script>

<style lang='less' scoped>
.main {
  table {
    width: 80px;
    height: 200px;
    overflow: auto;
    display: block;
    position: relative;
    th,
    td {
      background-color: #fff;
    }
    // 以下代码用于固定行列头
    // thead tr {
    //   position: sticky;
    //   top: 0;
    //   z-index: 2;
    // }
    // tr td:first-child,
    // tr th:first-child {
    //   position: sticky;
    //   left: 0;
    //   z-index: 1;
    // }
  }
}
.el-button--danger {
  font-weight: bold !important;
}
</style>