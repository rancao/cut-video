<template>
  <div class="cut-vidio">
    <div class="video-box">
      <div class="current-video-box">
        <div class="choose-file">
          <input type="file" @change="selectVideo" accept="video/*" />
        </div>
        <video ref="videoPlayer"
          controls="controls"
          @loadedmetadata="onVideoLoaded"
        ></video>
        <img
          v-show="imgShow"
          ref="imageOverlay"
          :style="{ position: 'absolute', top: imageTop + 'px', left: imageLeft + 'px', width: imageSize + 'px' }"
          :src="imageSrc"
          @mousedown="startDrag"
        />
      </div>
      <div
        class="pre-video-box"
        v-show="isPreviewVisible"
      >
        <p>预览：</p>
        <video ref="previewPlayer" controls></video>
        <img
          v-show="preImgShow"
          ref="preImageOverlay"
          :style="{ position: 'absolute', top: imageTop + 'px', left: imageLeft + 'px', width: imageSize +  'px' }"
          :src="imageSrc"
        />
      </div>
    </div>

    <!-- <div v-if="isVideoSelected"> -->
    <div class="set-time-box">
      时间设置：
      <label class="time-box">
        start：
        <input type="number" v-model="start" @input="onInputChange" :max="end" />
        <span class="time-label">{{ formatTime(start) }}</span>
      </label>
      <label class="time-box">
        end：
        <input type="number" v-model="end" @input="onInputChange" :min="start" />
        <span class="time-label">{{ formatTime(end) }}</span>
      </label>
    </div>
      <!-- <button @click="addCaptions">字幕添加</button> -->
    <div class="set-captions-box">
        字幕设置：
      <label class="time-box">
        start：
        <input type="number" v-model="captionsStart" @input="captionsTimeChange" :max="captionsEnd" />
        <span class="time-label">{{ formatTime(captionsStart) }}</span>
      </label>
      <label class="time-box">
        end：
        <input type="number" v-model="captionsEnd" @input="captionsTimeChange" :min="captionsStart" />
        <span class="time-label">{{ formatTime(captionsEnd) }}</span>
      </label>
      <input v-model="subtitle" placeholder="请输入字幕内容">
    </div>
    <div class="set-img-box">
        贴图设置：
      <label class="time-box">
        start：
        <input type="number" v-model="imgStart" @input="imgTimeChange" :max="imgEnd"/>
        <span class="time-label">{{ formatTime(imgStart) }}</span>
      </label>
      <label class="time-box">
        end：
        <input type="number" v-model="imgEnd" @input="imgTimeChange" :min="imgStart" />
        <span class="time-label">{{ formatTime(imgEnd) }}</span>
      </label>
      <button @click="imgShow=!imgShow">展示/隐藏贴图</button>
    </div>
    <div class="buttons">
      <button @click="clipVideo">预览</button>
      <button @click="handleOpen">导出</button>
      <!-- <button @click="saveVideo">保存视频</button> -->
    </div>
    <el-dialog
      title=""
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose">
      <span>导出视频？视频数据为
        {{ seaveData }}</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogConfirm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      videoFile: null,
      isVideoSelected: false,
      isPreviewVisible: true,
      videoPlayer: null,
      previewPlayer: null,
      start: 0, // 起始剪辑时间
      end: 0, // 结束剪辑时间
      // 字幕
      captionsStart: 0, // 字幕startTime
      captionsEnd: 0, // 字幕endTime
      subtitle: '', // 字幕内容
      track: null,
      //贴图
      imgShow: false,
      preImgShow: false,
      imageSrc: require('../assets/logo.png'), // 贴图的图片路径
      imageTop: 200, // 贴图的顶部位置
      imageLeft: 250, // 贴图的左侧位置
      imageSize: 100, // 贴图的大小
      isDragging: false, // 是否正在拖拽贴图
      imgStart: 0, // 贴图startTime
      imgEnd: 0, // 贴图endTime
      currentTime: 0,
      dialogVisible: false,
      seaveData: ''
    };
  },
  mounted() {
    this.videoPlayer = this.$refs.videoPlayer;
    this.previewPlayer = this.$refs.previewPlayer;
  },
  methods: {
    handleClose(done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done();
        })
        .catch(_ => {});
    },
    // 贴图移动
    startDrag(event) {
      this.isDragging = true;
      document.addEventListener('mousemove', this.drag);
      document.addEventListener('mouseup', this.stopDrag);
    },
    drag(event) {
      if (this.isDragging) {
        // 根据鼠标的移动距离来更新贴图的位置
        this.imageTop += event.movementY;
        this.imageLeft += event.movementX;
      }
    },
    stopDrag(event) {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.drag);
      document.removeEventListener('mouseup', this.stopDrag);
    },
    // 选择视频
    selectVideo(event) {
      this.videoFile = event.target.files[0];
      this.isVideoSelected = true;
      this.videoPlayer.src = URL.createObjectURL(this.videoFile);
    },
    onVideoLoaded() {
      this.videoDuration = this.$refs.videoPlayer.duration;
    },
    onInputChange() {
      // 确保起始剪辑时间不超过结束剪辑时间，并限制在视频时长范围内
      if (+this.start > this.end) {
        this.start = this.end;
      }
      if (+this.start < 0) {
        this.start = 0;
      }
      if (+this.end > +this.videoDuration) {
        this.end = this.videoDuration;
      }
    },
    captionsTimeChange() {
      // 确保字幕startTime不超过endTime，并限制在视频时长范围内
      if (+this.captionsStart > this.captionsEnd) {
        this.captionsStart = this.captionsEnd;
      }
      if (this.captionsStart < 0) {
        this.captionsStart = 0;
      }
      if (+this.captionsEnd > this.videoDuration) {
        this.captionsEnd = this.videoDuration;
      }
    },
    imgTimeChange(){
      if (+this.imgStart > this.imgEnd) {
        this.imgStart = this.imgEnd;
      }
      if (this.imgStart < 0) {
        this.imgStart = 0;
      }
      if (+this.imgEnd > this.videoDuration) {
        this.imgEnd = this.videoDuration;
      }
    },
    clipVideo() {
      this.updatePreview()
    },
    updatePreview() {
      this.previewPlayer.src = URL.createObjectURL(this.videoFile)
      // 字幕设置，单轨
      this.track = this.$refs.previewPlayer.textTracks[0];
      if (this.track) {
        this.track.mode = 'showing';
      } else {
        this.track = this.previewPlayer.addTextTrack('subtitles', 'English', 'en');
        this.track.mode = 'showing';
      }
      this.track.addCue(new VTTCue(this.captionsStart, this.captionsEnd, this.subtitle));
      // 实现播放开始和结束时间
      this.$refs.previewPlayer.currentTime = this.start;
      this.$refs.previewPlayer.play();
      this.$refs.previewPlayer.addEventListener('timeupdate', () => {
        // 监听视频播放时间更新，当播放时间达到结束剪辑时间时，暂停视频
        if (this.$refs.previewPlayer.currentTime >= this.end) {
          this.$refs.previewPlayer.pause();
        }
        // 设置贴图展示
        if(this.$refs.previewPlayer.currentTime > this.imgStart && this.$refs.previewPlayer.currentTime < this.imgEnd){
          this.preImgShow = true
        } else {
          this.preImgShow = false
        }
      });
    },
    formatTime(time) {
      // 将时间格式化为时:分:秒的形式
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
    handleOpen(){
      let params = {
        start: this.start,
        end: this.end,
        captionsStart: this.captionsStart,
        captionsEnd: this.captionsEnd,
        subtitle: this.subtitle,
        imageSrc: this.imageSrc,
        imageTop: this.imageTop,
        imageLeft: this.imageLeft,
        imageSize: this.imageSize,
        imgStart: this.imgStart,
        imgEnd: this.imgEnd,
      }
      this.seaveData = JSON.stringify(params)
      this.dialogVisible = true
    },
    dialogConfirm(){
      this.$message({
        type: 'success',
        message: '导出成功'
      });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const videoWidth = this.previewPlayer.videoWidth;
      const videoHeight = this.previewPlayer.videoHeight;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      context.drawImage(this.previewPlayer, 0, 0, videoWidth, videoHeight);
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "cut_video.mp4";
        link.click();
        URL.revokeObjectURL(url);
      }, "video/mp4");
    },
  }
};
</script>
<style scoped>
.cut-vidio {
  padding: 20px;
  box-sizing: border-box;
  text-align: left;
}
.video-box {
  display: flex;
  justify-content: space-between;
}
.current-video-box, .pre-video-box{
  position: relative;
}
img {
  height: 100px;
  width: 100px;
}
p{
  margin: 0px 0px 10px;
}
.choose-file {
  margin-bottom: 10px;
}
video {
  width: 600px;
  height: 375px;
  object-fit: cover;
}
.time-box {
  margin-left: 10px;
  margin-right: 10px;
}
input {
  width: 160px;
}
.button-wrapper {
  display: block;
  margin-top: 10px;
}
canvas {
  display: none;
}
.buttons {
  margin-top: 10px;
}
</style>
